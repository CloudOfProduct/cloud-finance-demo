import type { KAPNewsItem, RumorItem } from '../types';
import { MOCK_KAP_NEWS, MOCK_RUMORS } from './mockData';

class KapService {
  private news: KAPNewsItem[] = [...MOCK_KAP_NEWS];
  private rumors: RumorItem[] = [...MOCK_RUMORS];
  private listeners: Array<(news: KAPNewsItem[]) => void> = [];
  private isLiveConnected: boolean = false;

  constructor() {
    this.fetchLiveKapNews();
    // Periodically sync new KAP disclosures every 30 seconds
    setInterval(() => {
      this.fetchLiveKapNews();
    }, 30000);
  }

  public async fetchLiveKapNews(): Promise<void> {
    try {
      const res = await fetch('/api/kap/news');
      if (!res.ok) throw new Error('KAP API yanıt vermedi');

      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        // Prepend live news, keeping unique IDs
        const existingIds = new Set(json.data.map((item: KAPNewsItem) => item.id));
        const nonDuplicateMock = MOCK_KAP_NEWS.filter(item => !existingIds.has(item.id));
        this.news = [...json.data, ...nonDuplicateMock];
        this.isLiveConnected = true;
        this.notifyListeners();
      }
    } catch (err: any) {
      console.warn('Canlı KAP bildirimleri çekilirken geçici hata:', err.message);
    }
  }

  public async fetchNewsForStock(stockCode: string): Promise<KAPNewsItem[]> {
    const code = stockCode.trim().toUpperCase();
    try {
      const res = await fetch(`/api/kap/news?symbol=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error('Hisse KAP API yanıt vermedi');

      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const fetchedIds = new Set(json.data.map((item: KAPNewsItem) => item.id));
        const remaining = this.news.filter(item => !fetchedIds.has(item.id));
        this.news = [...json.data, ...remaining];
        this.isLiveConnected = true;
        this.notifyListeners();
        return json.data;
      }
    } catch (err: any) {
      console.warn(`${code} KAP haberleri çekilirken geçici hata:`, err.message);
    }
    return this.getNewsForStock(code);
  }

  public subscribeNews(listener: (news: KAPNewsItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l([...this.news]));
  }

  public getAllNews(): KAPNewsItem[] {
    return [...this.news];
  }

  public getNewsForStock(stockCode: string): KAPNewsItem[] {
    const code = stockCode.trim().toUpperCase();
    const stockNews = this.news.filter(
      item =>
        item.stockCode.toUpperCase() === code ||
        item.title.toUpperCase().includes(code)
    );

    // If stock-specific disclosures exist, return them
    if (stockNews.length > 0) {
      return stockNews;
    }

    // Fallback: If no company-specific filing yet, return the latest market-wide KAP disclosures
    // so the user has immediate access to live market intelligence while on-demand fetch loads
    const generalMarket = this.news
      .filter(item => item.stockCode === 'BIST' || item.stockCode === 'CNBC')
      .slice(0, 5);

    return generalMarket;
  }

  public getRumors(): RumorItem[] {
    return [...this.rumors];
  }

  public getNewsById(id: string): KAPNewsItem | undefined {
    return this.news.find(item => item.id === id);
  }

  public isLive(): boolean {
    return this.isLiveConnected;
  }
}

export const kapService = new KapService();
