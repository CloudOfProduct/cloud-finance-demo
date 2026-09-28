import type { Stock, TimeHorizon, MarketIndex, Candle } from '../types';
import { INITIAL_STOCKS, MARKET_INDICES, buildStockFromMeta } from './mockData';
import { findOrGenerateBistStock } from './bistDirectory';

export type LiveDataStatus = 'connected' | 'reconnecting' | 'error' | 'stale';

export interface DataFeedState {
  status: LiveDataStatus;
  lastUpdated: Date;
  latencyMs: number;
  provider: string;
  errorMessage?: string;
  isRealLiveFeed: boolean;
  isMarketOpen: boolean;
  isWeekend: boolean;
  sessionStatusText: string;
  sessionSubText: string;
}

class StockService {
  private stocks: Stock[] = JSON.parse(JSON.stringify(INITIAL_STOCKS));
  private indices: MarketIndex[] = JSON.parse(JSON.stringify(MARKET_INDICES));
  private listeners: Array<(stocks: Stock[], changedStockCode?: string) => void> = [];
  private indexListeners: Array<(indices: MarketIndex[]) => void> = [];
  private statusListeners: Array<(state: DataFeedState) => void> = [];
  private updateInterval: any = null;
  private sessionCheckInterval: any = null;
  private isSimulatedError: boolean = false;

  private feedState: DataFeedState = {
    status: 'connected',
    lastUpdated: new Date(),
    latencyMs: 24,
    provider: 'Borsa İstanbul Resmi Kapanış & Canlı Piyasa Akışı',
    isRealLiveFeed: true,
    isMarketOpen: false,
    isWeekend: false,
    sessionStatusText: 'BİST GÜN SONU KAPALI',
    sessionSubText: 'Bugünün Resmi Kapanış Fiyatları • Açılış Yarın 10:00',
  };

  constructor() {
    this.updateSessionState();
    this.initLiveData();
  }

  public getSessionInfo(): {
    isOpen: boolean;
    isWeekend: boolean;
    isPreMarket: boolean;
    statusText: string;
    subText: string;
    nextOpenText: string;
  } {
    const now = new Date();
    // Istanbul time calculation roughly
    const istanbulTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const day = istanbulTime.getDay();
    const hours = istanbulTime.getHours();
    const minutes = istanbulTime.getMinutes();
    const time = hours + minutes / 60;

    const isWeekend = day === 0 || day === 6;
    const isPreMarket = !isWeekend && time >= 9.66 && time < 10; // 09:40 - 10:00
    const isOpen = !isWeekend && time >= 10 && time < 18.16; // 10:00 - 18:10

    if (isWeekend) {
      return { isOpen: false, isWeekend: true, isPreMarket: false, statusText: 'PİYASA KAPALI (HAFTA SONU)', subText: 'Pazartesi 10:00\'da açılacak', nextOpenText: 'Pzt 10:00' };
    }
    if (isPreMarket) {
      return { isOpen: false, isWeekend: false, isPreMarket: true, statusText: 'SEANS ÖNCESİ İŞLEMLER', subText: 'Açılışa az kaldı...', nextOpenText: 'Bugün 10:00' };
    }
    if (isOpen) {
      return { isOpen: true, isWeekend: false, isPreMarket: false, statusText: 'CANLI PİYASA AÇIK', subText: 'Gerçek Zamanlı BİST Verisi', nextOpenText: 'Açık' };
    }
    
    // After hours
    return {
      isOpen: false,
      isWeekend: false,
      isPreMarket: false,
      statusText: 'BİST GÜN SONU KAPALI',
      subText: 'Bugünün Resmi Kapanış Fiyatları',
      nextOpenText: 'Yarın 10:00',
    };
  }

  public isBistSessionOpen(): boolean {
    return this.getSessionInfo().isOpen;
  }

  private updateSessionState() {
    const info = this.getSessionInfo();
    this.feedState.isMarketOpen = info.isOpen;
    this.feedState.isWeekend = info.isWeekend;
    this.feedState.sessionStatusText = info.statusText;
    this.feedState.sessionSubText = info.subText;
  }

  private async initLiveData() {
    // Initial fetch of real live quotes
    await this.fetchLiveQuotes();

    // Periodically sync live prices from backend every 3 seconds for ultra-low latency feel
    this.updateInterval = setInterval(() => {
      if (!this.isSimulatedError) {
        this.fetchLiveQuotes();
      }
    }, 3000);

    // Monitor market session transitions every 30 seconds
    this.sessionCheckInterval = setInterval(() => {
      this.updateSessionState();
      this.notifyStatusListeners();
    }, 30000);
  }

  public async fetchLiveQuotes(): Promise<void> {
    try {
      const startTime = performance.now();
      const res = await fetch('/api/bist/quotes');
      if (!res.ok) throw new Error('API yanıt vermedi');

      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return;

      const elapsed = Math.round(performance.now() - startTime);
      this.feedState.latencyMs = elapsed;
      this.feedState.lastUpdated = new Date();
      this.feedState.status = 'connected';
      this.feedState.isRealLiveFeed = true;
      this.updateSessionState();

      const sessionOpen = this.isBistSessionOpen();
      let changedStockCode: string | undefined = undefined;

      // Update stocks with authentic market data from API
      json.data.forEach((item: any) => {
        let stock = this.stocks.find(s => s.code.toUpperCase() === item.symbol.toUpperCase());
        if (!stock && !['XU100', 'XU030', 'XBANK', 'XUSIN', 'USDTRY', 'EURTRY', 'GBPTRY', 'GRAM_ALTIN', 'GC', 'GAUTRY'].includes(item.symbol.toUpperCase())) {
          const meta = findOrGenerateBistStock(item.symbol);
          stock = buildStockFromMeta(meta);
          this.stocks.push(stock);
        }

        if (stock) {
          if (sessionOpen && stock.price !== item.price) {
            stock.tickDirection = item.price > stock.price ? 'up' : 'down';
            stock.lastTickTime = Date.now();
            changedStockCode = stock.code;
          } else if (!sessionOpen) {
            // When exchange is closed, prices are frozen at official close (no ticks)
            stock.tickDirection = undefined;
            stock.lastTickTime = undefined;
          }
          stock.price = item.price;
          stock.changeNominal = item.changeNominal;
          stock.changePercent = item.changePercent;
          if (item.volume > 0) {
            stock.volume = item.volume;
          }
          if (item.high) stock.high = item.high;
          if (item.low) stock.low = item.low;
        }

        // Index & Forex & Gold updates
        const updateIdx = (code: string, newPrice: number, changePct: number, isForexOrGold: boolean = false) => {
          const idx = this.indices.find(i => i.code === code);
          if (idx) {
            // Currencies & Gold trade 24/5 globally on weekdays
            const allowTick = sessionOpen || isForexOrGold;
            if (allowTick && idx.value !== newPrice) {
              idx.tickDirection = newPrice > idx.value ? 'up' : 'down';
              idx.lastTickTime = Date.now();
            } else if (!allowTick) {
              idx.tickDirection = undefined;
              idx.lastTickTime = undefined;
            }
            idx.value = newPrice;
            idx.changePercent = changePct;
          }
        };

        if (item.symbol === 'XU100') {
          updateIdx('XU100', item.price, item.changePercent, false);
        } else if (item.symbol === 'XU030') {
          updateIdx('XU030', item.price, item.changePercent, false);
        } else if (item.symbol === 'XBANK') {
          updateIdx('XBANK', item.price, item.changePercent, false);
        } else if (item.symbol === 'XUSIN') {
          updateIdx('XUSIN', item.price, item.changePercent, false);
        } else if (item.symbol === 'USDTRY') {
          updateIdx('USD/TRY', item.price, item.changePercent, true);
        } else if (item.symbol === 'EURTRY') {
          updateIdx('EUR/TRY', item.price, item.changePercent, true);
        } else if (item.symbol === 'GBPTRY' || item.symbol === 'GBP/TRY' || item.symbol === 'GBP') {
          updateIdx('GBP/TRY', item.price, item.changePercent, true);
        } else if (item.symbol === 'GRAM_ALTIN' || item.symbol === 'GAUTRY' || item.symbol === 'GC') {
          updateIdx('GRAM_ALTIN', item.price, item.changePercent, true);
        }
      });

      this.notifyListeners(changedStockCode);
      this.notifyIndexListeners();
      this.notifyStatusListeners();
    } catch (err: any) {
      console.error("Live fetch error:", err);
      this.feedState.status = 'error';
      this.feedState.errorMessage = 'Canlı veri çekilemedi. Bağlantı problemi olabilir.';
      this.notifyStatusListeners();
    }
  }

  // Fetch real historical candles for a stock
  public async fetchCandlesForStock(symbol: string, timeframe: string): Promise<Candle[]> {
    try {
      const res = await fetch(`/api/bist/chart?symbol=${symbol}&timeframe=${timeframe}`);
      if (!res.ok) throw new Error('Grafik API yanıt vermedi');

      const json = await res.json();
      if (json.success && Array.isArray(json.candles) && json.candles.length > 0) {
        // Cache in memory
        const stock = this.stocks.find(s => s.code.toUpperCase() === symbol.toUpperCase());
        if (stock) {
          stock.candles[timeframe] = json.candles;
        }
        return json.candles;
      }
    } catch (e: any) {
      console.warn(`Real candle fetch failed for ${symbol} (${timeframe}):`, e.message);
    }

    // Fallback to stock's existing candles
    const stock = this.stocks.find(s => s.code.toUpperCase() === symbol.toUpperCase());
    return stock?.candles[timeframe] || [];
  }

  // Fetch real-time quote for a specific stock on demand
  public async fetchQuoteForStock(symbol: string): Promise<Stock | undefined> {
    try {
      const res = await fetch(`/api/bist/quote?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) return undefined;

      const json = await res.json();
      if (json.success && json.data) {
        const item = json.data;
        let stock = this.stocks.find(s => s.code.toUpperCase() === symbol.toUpperCase().trim());
        if (!stock) {
          const meta = findOrGenerateBistStock(symbol);
          stock = buildStockFromMeta(meta);
          this.stocks.push(stock);
        }

        stock.price = item.price;
        stock.changeNominal = item.changeNominal;
        stock.changePercent = item.changePercent;
        if (item.volume > 0) stock.volume = item.volume;
        if (item.high) stock.high = item.high;
        if (item.low) stock.low = item.low;

        this.notifyListeners(stock.code);
        return stock;
      }
    } catch (e: any) {
      console.warn(`Failed on-demand quote for ${symbol}:`, e.message);
    }
    return this.stocks.find(s => s.code.toUpperCase() === symbol.toUpperCase().trim());
  }

  public getStocks(): Stock[] {
    return [...this.stocks];
  }

  public getStockByCode(code: string): Stock | undefined {
    const stock = this.stocks.find(s => s.code.toUpperCase() === code.toUpperCase().trim());
    if (stock) {
      // Trigger on-demand fresh quote in background
      this.fetchQuoteForStock(code);
      return stock;
    }
    // If not found in catalog, dynamically generate and fetch
    return this.getOrCreateStock(code);
  }

  public getOrCreateStock(code: string): Stock {
    const upper = code.toUpperCase().trim();
    let stock = this.stocks.find(s => s.code.toUpperCase() === upper);
    if (!stock) {
      const meta = findOrGenerateBistStock(upper);
      stock = buildStockFromMeta(meta);
      this.stocks.push(stock);
      this.notifyListeners(stock.code);
    }
    this.fetchQuoteForStock(upper);
    return stock;
  }

  public getMarketIndices(): MarketIndex[] {
    return [...this.indices];
  }

  public getFeedState(): DataFeedState {
    return { ...this.feedState };
  }

  public filterAndSortStocks(
    stocks: Stock[],
    horizon: TimeHorizon,
    searchQuery: string = '',
    selectedSector: string = 'Tümü',
    selectedRisk: string = 'Tümü'
  ): Stock[] {
    return stocks
      .filter(stock => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCode = stock.code.toLowerCase().includes(q);
          const matchName = stock.name.toLowerCase().includes(q);
          const matchSector = stock.sector.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchSector) return false;
        }

        // Sector filter
        if (selectedSector !== 'Tümü' && stock.sector !== selectedSector) {
          return false;
        }

        // Risk filter
        if (selectedRisk !== 'Tümü' && stock.riskLevel !== selectedRisk) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Primary sort: Research score for selected horizon
        const scoreA = a.horizonScores[horizon]?.score ?? a.assistantScore;
        const scoreB = b.horizonScores[horizon]?.score ?? b.assistantScore;
        return scoreB - scoreA;
      });
  }

  public getUniqueSectors(): string[] {
    const sectors = new Set<string>();
    this.stocks.forEach(s => sectors.add(s.sector));
    return ['Tümü', ...Array.from(sectors)];
  }

  // Subscribe to live stock updates
  public subscribeStocks(listener: (stocks: Stock[], changedStockCode?: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Subscribe to market index updates
  public subscribeIndices(listener: (indices: MarketIndex[]) => void): () => void {
    this.indexListeners.push(listener);
    return () => {
      this.indexListeners = this.indexListeners.filter(l => l !== listener);
    };
  }

  // Subscribe to feed status
  public subscribeFeedState(listener: (state: DataFeedState) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  // Toggle simulated connection error for resilient testing
  public toggleSimulatedError(): void {
    this.isSimulatedError = !this.isSimulatedError;
    const session = this.getSessionInfo();
    if (this.isSimulatedError) {
      this.feedState = {
        status: 'error',
        lastUpdated: this.feedState.lastUpdated,
        latencyMs: 999,
        provider: 'Borsa İstanbul Resmi Kapanış & Canlı Piyasa Akışı',
        isRealLiveFeed: false,
        isMarketOpen: session.isOpen,
        isWeekend: session.isWeekend,
        sessionStatusText: session.statusText,
        sessionSubText: session.subText,
        errorMessage: 'Veri sağlayıcı API yanıt vermiyor. Son geçerli piyasa verileri korunuyor.',
      };
    } else {
      this.feedState = {
        status: 'connected',
        lastUpdated: new Date(),
        latencyMs: 38,
        provider: 'Borsa İstanbul Resmi Kapanış & Canlı Piyasa Akışı',
        isRealLiveFeed: true,
        isMarketOpen: session.isOpen,
        isWeekend: session.isWeekend,
        sessionStatusText: session.statusText,
        sessionSubText: session.subText,
      };
      this.fetchLiveQuotes();
    }
    this.notifyStatusListeners();
  }

  // Force manual refresh
  public refreshData(): void {
    if (this.isSimulatedError) return;
    this.fetchLiveQuotes();
  }

  private notifyListeners(changedStockCode?: string): void {
    this.listeners.forEach(l => l([...this.stocks], changedStockCode));
  }

  private notifyIndexListeners(): void {
    this.indexListeners.forEach(l => l([...this.indices]));
  }

  private notifyStatusListeners(): void {
    this.statusListeners.forEach(l => l({ ...this.feedState }));
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }
}

export const stockService = new StockService();
