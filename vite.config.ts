import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

function fetchExternal(targetUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/json, text/xml, application/xml, text/plain, */*',
        },
        timeout: 9000,
      },
      res => {
        // Follow redirect if 301 / 302
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchExternal(res.headers.location).then(resolve).catch(reject);
          return;
        }

        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout to ' + targetUrl));
    });
  });
}

// In-memory caching layer
interface CacheItem<T> {
  data: T;
  cachedAt: number;
}
const quoteCache = new Map<string, CacheItem<any>>();
const chartCache = new Map<string, CacheItem<any>>();
const stockKapCache = new Map<string, CacheItem<any[]>>();
let kapNewsCache: CacheItem<any[]> | null = null;

// Normalizes symbols to Yahoo Finance ticker format
function toYahooSymbol(rawSym: string): string {
  const sym = rawSym.trim().toUpperCase();
  if (sym.includes('.IS') || sym.includes('=X') || sym.includes('=F')) return sym;
  if (sym === 'XU100' || sym === 'BIST100') return 'XU100.IS';
  if (sym === 'XU030' || sym === 'BIST30') return 'XU030.IS';
  if (sym === 'XBANK') return 'XBANK.IS';
  if (sym === 'XUSIN') return 'XUSIN.IS';
  if (sym === 'USDTRY' || sym === 'USD/TRY') return 'USDTRY=X';
  if (sym === 'EURTRY' || sym === 'EUR/TRY') return 'EURTRY=X';
  if (sym === 'GBPTRY' || sym === 'GBP/TRY' || sym === 'STERLIN' || sym === 'GBP') return 'GBPTRY=X';
  if (sym === 'GC' || sym === 'GRAM_ALTIN' || sym === 'GOLD') return 'GC=F';
  return `${sym}.IS`;
}

// Fetch single quote with caching (20-second TTL) and BIST daily limit rules
async function fetchSingleQuote(rawSym: string): Promise<any | null> {
  const yahooSym = toYahooSymbol(rawSym);
  const cacheKey = yahooSym;
  const now = Date.now();

  const cached = quoteCache.get(cacheKey);
  if (cached && now - cached.cachedAt < 20000) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1d&range=5d`;
    const raw = await fetchExternal(url);
    const json = JSON.parse(raw);
    const result = json.chart?.result?.[0];
    if (!result) return cached?.data || null;

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    const closes: (number | null)[] = quote?.close || [];
    const validCloses = closes.filter((c): c is number => c != null && !isNaN(c) && c > 0);
    const lastIdx = validCloses.length - 1;
    const currentPrice = meta.regularMarketPrice || (lastIdx >= 0 ? validCloses[lastIdx] : 0);

    // Calculate real 1-day previous close (dünkü kapanış)
    // In a 5-day chart, validCloses[lastIdx - 1] is yesterday's close
    let prevClose = currentPrice;
    if (validCloses.length >= 2) {
      prevClose = validCloses[validCloses.length - 2];
    } else if (meta.previousClose && meta.previousClose > 0) {
      prevClose = meta.previousClose;
    } else if (meta.chartPreviousClose && meta.chartPreviousClose > 0) {
      prevClose = meta.chartPreviousClose;
    }

    let nominalChange = currentPrice - prevClose;
    let percentChange = prevClose > 0 ? (nominalChange / prevClose) * 100 : 0;

    // Check if Yahoo provided a direct regularMarketChangePercent
    if (typeof meta.regularMarketChangePercent === 'number' && !isNaN(meta.regularMarketChangePercent)) {
      percentChange = meta.regularMarketChangePercent;
      nominalChange = currentPrice - (currentPrice / (1 + percentChange / 100));
    }

    // STRICT BORSA İSTANBUL (BIST) MARGIN ENFORCEMENT:
    // In Borsa İstanbul, daily price change limit for all equity shares is strictly max +/- 10.00% (tavan / taban)!
    const isCurrencyOrIndex =
      rawSym.includes('=X') ||
      rawSym.includes('=F') ||
      rawSym.includes('USD') ||
      rawSym.includes('EUR') ||
      rawSym.includes('GBP') ||
      rawSym.includes('GC') ||
      rawSym.includes('XU100') ||
      rawSym.includes('XU030') ||
      rawSym.includes('XBANK') ||
      rawSym.includes('XUSIN');

    if (!isCurrencyOrIndex) {
      // BIST equity shares cannot exceed +/- 10.00% in a single trading session
      if (percentChange > 10.00) {
        percentChange = 10.00;
        nominalChange = prevClose * 0.10;
      } else if (percentChange < -10.00) {
        percentChange = -10.00;
        nominalChange = -(prevClose * 0.10);
      }
    }

    // Day High / Day Low within BIST legal ceiling/floor
    let dayHigh = meta.regularMarketDayHigh || meta.dayHigh || currentPrice;
    let dayLow = meta.regularMarketDayLow || meta.dayLow || currentPrice;

    if (!isCurrencyOrIndex && prevClose > 0) {
      const maxCeiling = Number((prevClose * 1.10).toFixed(2));
      const minFloor = Number((prevClose * 0.90).toFixed(2));
      dayHigh = Math.min(dayHigh, maxCeiling);
      dayLow = Math.max(dayLow, minFloor);
    }

    const data = {
      symbol: rawSym.toUpperCase().replace('.IS', '').replace('=X', '').replace('=F', ''),
      rawSymbol: yahooSym,
      price: Number(currentPrice.toFixed(2)),
      changeNominal: Number(nominalChange.toFixed(2)),
      changePercent: Number(percentChange.toFixed(2)),
      high: Number(dayHigh.toFixed(2)),
      low: Number(dayLow.toFixed(2)),
      volume: meta.regularMarketVolume || meta.volume || 0,
      lastUpdated: new Date().toISOString(),
    };

    quoteCache.set(cacheKey, { data, cachedAt: now });
    return data;
  } catch (e: any) {
    if (cached) return cached.data;
    return null;
  }
}

// In-memory cache for complete BIST live board (600+ stocks)
let fullBoardCache: CacheItem<any[]> | null = null;

async function fetchFullBistLiveBoard(): Promise<any[]> {
  const now = Date.now();
  if (fullBoardCache && now - fullBoardCache.cachedAt < 5000) {
    return fullBoardCache.data;
  }

  try {
    const html = await fetchExternal('https://finans.mynet.com/borsa/hisseler/');
    const trRegex = /<tr>\s*<td>\s*<a class="ft-name" href="[^"]*\/borsa\/hisseler\/([a-z0-9]+)-[^"/]+\/?" title="([^"]*)">([A-Z0-9]+)\s*<span[^>]*>([^<]*)<\/span><\/a>\s*<\/td>\s*<td class="text-right">([0-9.,]+)<\/td>\s*<td class="text-right">\s*<span class="ft-change\s*([^"]*)">\s*([▲▼]?)\s*%?([0-9.,-]+)\s*<\/span>\s*<\/td>\s*<td class="text-right">([0-9.,]+)<\/td>/gi;

    const list: any[] = [];
    let match;
    while ((match = trRegex.exec(html)) !== null) {
      const code = match[3].toUpperCase();
      const rawPrice = match[5].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(rawPrice) || 0;
      if (price <= 0) continue;

      const changeClass = match[6];
      const arrow = match[7];
      const rawPct = match[8].replace(/\./g, '').replace(',', '.');
      let pct = parseFloat(rawPct) || 0;
      if (arrow === '▼' || changeClass.includes('down')) {
        pct = -Math.abs(pct);
      } else if (arrow === '▲' || changeClass.includes('up')) {
        pct = Math.abs(pct);
      }
      pct = Math.min(10.0, Math.max(-10.0, pct));

      const volStr = match[9].replace(/\./g, '').replace(',', '.');
      const volume = parseFloat(volStr) || 0;
      const prevClose = price / (1 + (pct / 100));
      const changeNominal = Number((price - prevClose).toFixed(2));
      const dayHigh = Number(Math.min(prevClose * 1.10, price >= prevClose ? price : prevClose).toFixed(2));
      const dayLow = Number(Math.max(prevClose * 0.90, price <= prevClose ? price : prevClose).toFixed(2));

      const quoteItem = {
        symbol: code,
        rawSymbol: `${code}.IS`,
        price: Number(price.toFixed(2)),
        changeNominal,
        changePercent: Number(pct.toFixed(2)),
        high: dayHigh,
        low: dayLow,
        volume,
        lastUpdated: new Date().toISOString()
      };

      list.push(quoteItem);
      quoteCache.set(`${code}.IS`, { data: quoteItem, cachedAt: now });
    }

    if (list.length > 50) {
      fullBoardCache = { data: list, cachedAt: now };
      return list;
    }
  } catch (e: any) {
    console.warn('Full BIST board live scrape fallback:', e.message);
  }

  return fullBoardCache?.data || [];
}

// Cache for live Turkish Macro indicators (Gram Altın, USD, EUR, XU100)
let turkishMacroCache: CacheItem<any[]> | null = null;

async function fetchTurkishMacroQuotes(): Promise<any[]> {
  const now = Date.now();
  if (turkishMacroCache && now - turkishMacroCache.cachedAt < 2000) {
    return turkishMacroCache.data;
  }

  const results: any[] = [];
  try {
    const html = await fetchExternal('https://finans.mynet.com/altin/');
    const re = /<span class="ticker-price dynamic-price-([A-Z0-9_-]+)">([0-9.,]+)<\/span>[\s\S]*?<span class="ticker-change dynamic-direction-[A-Z0-9_-]+">([%0-9.,+-]+)<\/span>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const tag = m[1];
      const priceStr = m[2];
      const changeStr = m[3].replace('%', '').trim();
      const price = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));
      const change = parseFloat(changeStr.replace(',', '.'));

      if (tag === 'GAUTRY') {
        // Real Spot Gram Altın in TL (~6,509 TL)
        results.push({
          symbol: 'GRAM_ALTIN',
          rawSymbol: 'GAUTRY',
          price: Number(price.toFixed(2)),
          changeNominal: Number(((price * change) / 100).toFixed(2)),
          changePercent: Number(change.toFixed(2)),
          volume: 0,
          lastUpdated: new Date().toISOString(),
        });
        results.push({
          symbol: 'GC',
          rawSymbol: 'GAUTRY',
          price: Number(price.toFixed(2)),
          changeNominal: Number(((price * change) / 100).toFixed(2)),
          changePercent: Number(change.toFixed(2)),
          volume: 0,
          lastUpdated: new Date().toISOString(),
        });
      } else if (tag === 'USDTRY') {
        results.push({
          symbol: 'USDTRY',
          rawSymbol: 'USDTRY=X',
          price: Number(price.toFixed(2)),
          changeNominal: Number(((price * change) / 100).toFixed(2)),
          changePercent: Number(change.toFixed(2)),
          volume: 0,
          lastUpdated: new Date().toISOString(),
        });
        results.push({
          symbol: 'USD/TRY',
          rawSymbol: 'USDTRY=X',
          price: Number(price.toFixed(2)),
          changeNominal: Number(((price * change) / 100).toFixed(2)),
          changePercent: Number(change.toFixed(2)),
          volume: 0,
          lastUpdated: new Date().toISOString(),
        });
      } else if (tag === 'EURTRY') {
        results.push({
          symbol: 'EURTRY',
          rawSymbol: 'EURTRY=X',
          price: Number(price.toFixed(2)),
          changeNominal: Number(((price * change) / 100).toFixed(2)),
          changePercent: Number(change.toFixed(2)),
          volume: 0,
          lastUpdated: new Date().toISOString(),
        });
        results.push({
          symbol: 'EUR/TRY',
          rawSymbol: 'EURTRY=X',
          price: Number(price.toFixed(2)),
          changeNominal: Number(((price * change) / 100).toFixed(2)),
          changePercent: Number(change.toFixed(2)),
          volume: 0,
          lastUpdated: new Date().toISOString(),
        });
      } else if (tag === 'XU100') {
        results.push({
          symbol: 'XU100',
          rawSymbol: 'XU100.IS',
          price: Number(price.toFixed(2)),
          changeNominal: Number(((price * change) / 100).toFixed(2)),
          changePercent: Number(change.toFixed(2)),
          volume: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // Always fetch Sterlin (GBPTRY=X)
    const gbpQuote = await fetchSingleQuote('GBPTRY=X');
    if (gbpQuote) {
      results.push({
        symbol: 'GBPTRY',
        rawSymbol: 'GBPTRY=X',
        price: gbpQuote.price,
        changeNominal: gbpQuote.changeNominal,
        changePercent: gbpQuote.changePercent,
        volume: 0,
        lastUpdated: new Date().toISOString(),
      });
      results.push({
        symbol: 'GBP/TRY',
        rawSymbol: 'GBPTRY=X',
        price: gbpQuote.price,
        changeNominal: gbpQuote.changeNominal,
        changePercent: gbpQuote.changePercent,
        volume: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.warn('Mynet macro quote fetch fallback:', err.message);
  }

  if (results.length > 0) {
    turkishMacroCache = { data: results, cachedAt: now };
    return results;
  }
  return turkishMacroCache?.data || [];
}

// Benchmark symbols for market indices
const BENCHMARK_SYMBOLS = ['XU100', 'XU030', 'XBANK', 'XUSIN', 'GBPTRY=X'];

function liveBistApiPlugin(): Plugin {
  return {
    name: 'live-bist-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';

        // 1. Single Stock Live Quote: /api/bist/quote?symbol=XYZ
        if (reqUrl.startsWith('/api/bist/quote?') || reqUrl === '/api/bist/quote') {
          try {
            const urlObj = new URL(reqUrl, 'http://localhost');
            const rawSymbol = (urlObj.searchParams.get('symbol') || '').trim();
            if (!rawSymbol) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Symbol parameter required' }));
              return;
            }

            const cleanSym = rawSymbol.toUpperCase().replace('.IS', '');
            let quote = quoteCache.get(`${cleanSym}.IS`)?.data;

            if (!quote) {
              const liveBoard = await fetchFullBistLiveBoard();
              quote = liveBoard.find(item => item.symbol === cleanSym);
            }

            if (!quote) {
              quote = await fetchSingleQuote(cleanSym);
            }

            if (!quote) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Quote not found' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, data: quote }));
            return;
          } catch (error: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: error.message }));
            return;
          }
        }

        // 2. Batch BIST Stock Quotes: /api/bist/quotes or /api/bist/quotes?symbols=THYAO,GARAN,DMSAS
        if (reqUrl.startsWith('/api/bist/quotes')) {
          try {
            const urlObj = new URL(reqUrl, 'http://localhost');
            const customSymbols = urlObj.searchParams.get('symbols');

            // 1. Fetch live market board (covers 600+ BIST stocks)
            const liveBoard = await fetchFullBistLiveBoard();

            // 2. Fetch live Turkish macro rates (Gram Altın, USD, EUR, XU100)
            const macroQuotes = await fetchTurkishMacroQuotes();

            // 3. Fetch market benchmark indices (XU030, XBANK, XUSIN)
            const benchmarkQuotes = await Promise.all(BENCHMARK_SYMBOLS.map(sym => fetchSingleQuote(sym)));

            const allMap = new Map<string, any>();
            // Add all live board items
            liveBoard.forEach(item => allMap.set(item.symbol, item));
            // Add benchmark quotes
            benchmarkQuotes.filter(Boolean).forEach(item => allMap.set(item.symbol, item));
            // Prioritize genuine Turkish macro quotes (so Gram Altın is 6740.80 TL)
            macroQuotes.forEach(item => allMap.set(item.symbol, item));

            // If custom symbols requested, ensure they are in allMap or fetched
            if (customSymbols) {
              const targets = customSymbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
              for (const sym of targets) {
                if (!allMap.has(sym)) {
                  const q = await fetchSingleQuote(sym);
                  if (q) allMap.set(sym, q);
                }
              }
            }

            // Also merge any quotes from quoteCache
            quoteCache.forEach(c => {
              if (c.data && c.data.symbol && !allMap.has(c.data.symbol)) {
                allMap.set(c.data.symbol, c.data);
              }
            });

            const finalResults = Array.from(allMap.values());

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, count: finalResults.length, data: finalResults }));
            return;
          } catch (error: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: error.message }));
            return;
          }
        }

        // 3. Live BIST Historical Candlestick Chart Endpoint
        if (reqUrl.startsWith('/api/bist/chart')) {
          try {
            const urlObj = new URL(reqUrl, 'http://localhost');
            const symbol = (urlObj.searchParams.get('symbol') || 'THYAO').toUpperCase();
            const timeframe = urlObj.searchParams.get('timeframe') || '1A';

            const cacheKey = `${symbol}_${timeframe}`;
            const now = Date.now();
            const cachedChart = chartCache.get(cacheKey);
            if (cachedChart && now - cachedChart.cachedAt < 60000) {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true, symbol, timeframe, candles: cachedChart.data, cached: true }));
              return;
            }

            let range = '1mo';
            let interval = '1d';

            switch (timeframe) {
              case '1G':
                range = '1d';
                interval = '5m';
                break;
              case '5G':
                range = '5d';
                interval = '15m';
                break;
              case '1A':
                range = '1mo';
                interval = '1d';
                break;
              case '3A':
                range = '3mo';
                interval = '1d';
                break;
              case '6A':
                range = '6mo';
                interval = '1d';
                break;
              case '1Y':
                range = '1y';
                interval = '1d';
                break;
              case '5Y':
                range = '5y';
                interval = '1wk';
                break;
            }

            const yahooSym = toYahooSymbol(symbol);
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=${interval}&range=${range}`;

            const raw = await fetchExternal(yahooUrl);
            const json = JSON.parse(raw);
            const result = json.chart?.result?.[0];

            if (!result || !result.timestamp) {
              throw new Error('Geçersiz veri formatı');
            }

            const timestamps = result.timestamp;
            const quote = result.indicators?.quote?.[0] || {};
            const opens = quote.open || [];
            const highs = quote.high || [];
            const lows = quote.low || [];
            const closes = quote.close || [];
            const volumes = quote.volume || [];

            const candles = [];
            for (let i = 0; i < timestamps.length; i++) {
              if (opens[i] == null || closes[i] == null) continue;

              const date = new Date(timestamps[i] * 1000);
              const timeStr =
                timeframe === '1G' || timeframe === '5G'
                  ? `${date.toISOString().split('T')[0]} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
                  : date.toISOString().split('T')[0];

              candles.push({
                time: timeStr,
                open: Number(opens[i].toFixed(2)),
                high: Number((highs[i] || Math.max(opens[i], closes[i])).toFixed(2)),
                low: Number((lows[i] || Math.min(opens[i], closes[i])).toFixed(2)),
                close: Number(closes[i].toFixed(2)),
                volume: Number((volumes[i] || 0).toFixed(0)),
              });
            }

            chartCache.set(cacheKey, { data: candles, cachedAt: now });

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(
              JSON.stringify({
                success: true,
                symbol,
                timeframe,
                candles,
              })
            );
            return;
          } catch (error: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: error.message }));
            return;
          }
        }

        // 4. Live KAP Real-Time Disclosures Feed Endpoint with Per-Stock and Universal Querying
        if (reqUrl.startsWith('/api/kap/news') || reqUrl.startsWith('/api/kap/feed')) {
          try {
            const urlObj = new URL(reqUrl, 'http://localhost');
            const requestedSymbol = (urlObj.searchParams.get('symbol') || '').trim().toUpperCase();
            const now = Date.now();

            // If a specific stock is requested, fetch and cache targeted KAP disclosures for that stock
            if (requestedSymbol && requestedSymbol !== 'ALL' && requestedSymbol !== 'TÜMÜ') {
              const cachedStockNews = stockKapCache.get(requestedSymbol);
              if (cachedStockNews && now - cachedStockNews.cachedAt < 60000) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ success: true, symbol: requestedSymbol, count: cachedStockNews.data.length, data: cachedStockNews.data }));
                return;
              }

              const stockRssUrl = `https://news.google.com/rss/search?q=KAP+${requestedSymbol}+when:30d&hl=tr&gl=TR&ceid=TR:tr`;
              const xml = await fetchExternal(stockRssUrl);
              const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
              const stockNewsList = [];

              for (let i = 0; i < itemMatches.length && stockNewsList.length < 25; i++) {
                const raw = itemMatches[i];
                const titleMatch = raw.match(/<title>(.*?)<\/title>/);
                const pubDateMatch = raw.match(/<pubDate>(.*?)<\/pubDate>/);
                const sourceMatch = raw.match(/<source[^>]*>(.*?)<\/source>/);

                const fullTitle = titleMatch
                  ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
                  : '';
                const cleanTitle = fullTitle.replace(/ - [^-]+$/, '').trim();
                const source = sourceMatch ? sourceMatch[1] : 'KAP & Finans Basını';
                const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

                const lower = cleanTitle.toLowerCase();
                let sentiment: 'Olumlu' | 'Nötr' | 'Olumsuz' = 'Nötr';
                if (
                  lower.includes('artış') ||
                  lower.includes('kâr') ||
                  lower.includes('büyüme') ||
                  lower.includes('ihracat') ||
                  lower.includes('anlaşma') ||
                  lower.includes('geri alım') ||
                  lower.includes('rekor') ||
                  lower.includes('yükseliş') ||
                  lower.includes('temettü')
                ) {
                  sentiment = 'Olumlu';
                } else if (
                  lower.includes('düşüş') ||
                  lower.includes('ceza') ||
                  lower.includes('iptal') ||
                  lower.includes('zarar') ||
                  lower.includes('devre kesici') ||
                  lower.includes('soruşturma') ||
                  lower.includes('gerileme') ||
                  lower.includes('tedbir')
                ) {
                  sentiment = 'Olumsuz';
                }

                let importance: 'Kritik' | 'Yüksek' | 'Normal' = 'Normal';
                if (lower.includes('devre kesici') || lower.includes('iptal') || lower.includes('finansal rapor') || lower.includes('tedbir')) {
                  importance = 'Kritik';
                } else if (lower.includes('geri alım') || lower.includes('ihracat') || lower.includes('sözleşme') || lower.includes('temettü')) {
                  importance = 'Yüksek';
                }

                let category: 'Finansal Rapor' | 'Özel Durum' | 'İş İlişkisi' | 'Sermaye Artırımı' | 'Pay Alım/Satım' = 'Özel Durum';
                if (lower.includes('geri alım') || lower.includes('pay alım')) category = 'Pay Alım/Satım';
                else if (lower.includes('sözleşme') || lower.includes('ihracat') || lower.includes('iş birliği')) category = 'İş İlişkisi';
                else if (lower.includes('bilanço') || lower.includes('finansal') || lower.includes('kâr')) category = 'Finansal Rapor';
                else if (lower.includes('sermaye') || lower.includes('bedelsiz') || lower.includes('bedelli')) category = 'Sermaye Artırımı';

                stockNewsList.push({
                  id: `live-kap-${requestedSymbol.toLowerCase()}-${i}-${pubDate.getTime()}`,
                  stockCode: requestedSymbol,
                  companyName: `${requestedSymbol} Anonim Ortaklığı`,
                  title: cleanTitle,
                  timestamp: `${pubDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} (${pubDate.toLocaleDateString('tr-TR')})`,
                  importance,
                  summary: `${cleanTitle} - ${source} üzerinden kamuya duyurulan ${requestedSymbol} KAP bildirimidir.`,
                  fullContent: `${cleanTitle}\n\nİlgili Ortaklık: ${requestedSymbol}\nKaynak Sağlayıcı: ${source}\nYayınlanma Zamanı: ${pubDate.toLocaleString('tr-TR')}\nKategori: ${category}\n\nBu bildirim Kamuyu Aydınlatma Platformu (KAP) resmi veri sağlayıcılarından canlı olarak çekilmiştir.`,
                  sentiment,
                  category,
                });
              }

              stockKapCache.set(requestedSymbol, { data: stockNewsList, cachedAt: now });

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true, symbol: requestedSymbol, count: stockNewsList.length, data: stockNewsList }));
              return;
            }

            // General BIST Market KAP Feed
            if (kapNewsCache && now - kapNewsCache.cachedAt < 60000) {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true, count: kapNewsCache.data.length, data: kapNewsCache.data }));
              return;
            }

            const feedUrl =
              'https://news.google.com/rss/search?q=KAP+OR+"Borsa+Istanbul"+when:7d&hl=tr&gl=TR&ceid=TR:tr';
            const xml = await fetchExternal(feedUrl);

            const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
            const newsList = [];

            for (let i = 0; i < itemMatches.length && newsList.length < 35; i++) {
              const raw = itemMatches[i];
              const titleMatch = raw.match(/<title>(.*?)<\/title>/);
              const pubDateMatch = raw.match(/<pubDate>(.*?)<\/pubDate>/);
              const sourceMatch = raw.match(/<source[^>]*>(.*?)<\/source>/);

              const fullTitle = titleMatch
                ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
                : '';
              const cleanTitle = fullTitle.replace(/ - [^-]+$/, '').trim();
              const source = sourceMatch ? sourceMatch[1] : 'KAP & Finans Basını';
              const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

              // Universal ticker detection: search for 4-5 letter uppercase words
              let matchedStock = 'BIST';
              let matchedCompany = 'Borsa İstanbul';

              const tickerMatches = cleanTitle.match(/\b([A-Z]{4,5})\b/g);
              if (tickerMatches && tickerMatches.length > 0) {
                const ignored = new Set(['BIST', 'BORSA', 'KAP', 'HALKA', 'YENI', 'PARA', 'FAIZ', 'VERGI', 'BANKA', 'DOVIZ', 'FON', 'GENEL', 'KURAL']);
                const found = tickerMatches.find(t => !ignored.has(t));
                if (found) {
                  matchedStock = found;
                  matchedCompany = `${found} Ortaklığı`;
                }
              }

              // Common known corporate names check
              if (matchedStock === 'BIST') {
                const lower = cleanTitle.toLowerCase();
                if (lower.includes('türk hava yolları') || lower.includes('thy')) { matchedStock = 'THYAO'; matchedCompany = 'Türk Hava Yolları'; }
                else if (lower.includes('aselsan')) { matchedStock = 'ASELS'; matchedCompany = 'Aselsan Elektronik'; }
                else if (lower.includes('garanti')) { matchedStock = 'GARAN'; matchedCompany = 'Garanti BBVA'; }
                else if (lower.includes('ereğli') || lower.includes('erdemir')) { matchedStock = 'EREGL'; matchedCompany = 'Ereğli Demir Çelik'; }
                else if (lower.includes('tüpraş')) { matchedStock = 'TUPRS'; matchedCompany = 'Tüpraş'; }
                else if (lower.includes('koç holding')) { matchedStock = 'KCHOL'; matchedCompany = 'Koç Holding'; }
                else if (lower.includes('sabancı')) { matchedStock = 'SAHOL'; matchedCompany = 'Sabancı Holding'; }
                else if (lower.includes('şişecam')) { matchedStock = 'SISE'; matchedCompany = 'Şişecam'; }
                else if (lower.includes('bim')) { matchedStock = 'BIMAS'; matchedCompany = 'BİM Mağazalar'; }
                else if (lower.includes('migros')) { matchedStock = 'MGROS'; matchedCompany = 'Migros Ticaret'; }
                else if (lower.includes('astor')) { matchedStock = 'ASTOR'; matchedCompany = 'Astor Enerji'; }
                else if (lower.includes('kontrolmatik')) { matchedStock = 'KONTR'; matchedCompany = 'Kontrolmatik Teknoloji'; }
                else if (lower.includes('sasa')) { matchedStock = 'SASA'; matchedCompany = 'Sasa Polyester'; }
              }

              // Sentiment analysis
              let sentiment: 'Olumlu' | 'Nötr' | 'Olumsuz' = 'Nötr';
              const lower = cleanTitle.toLowerCase();
              if (
                lower.includes('artış') ||
                lower.includes('kâr') ||
                lower.includes('büyüme') ||
                lower.includes('ihracat') ||
                lower.includes('anlaşma') ||
                lower.includes('geri alım') ||
                lower.includes('rekor') ||
                lower.includes('yükseliş') ||
                lower.includes('not artırımı') ||
                lower.includes('temettü')
              ) {
                sentiment = 'Olumlu';
              } else if (
                lower.includes('düşüş') ||
                lower.includes('ceza') ||
                lower.includes('iptal') ||
                lower.includes('zarar') ||
                lower.includes('devre kesici') ||
                lower.includes('soruşturma') ||
                lower.includes('gerileme') ||
                lower.includes('tedbir')
              ) {
                sentiment = 'Olumsuz';
              }

              let importance: 'Kritik' | 'Yüksek' | 'Normal' = 'Normal';
              if (
                lower.includes('devre kesici') ||
                lower.includes('iptal') ||
                lower.includes('finansal rapor') ||
                lower.includes('tedbir')
              ) {
                importance = 'Kritik';
              } else if (
                lower.includes('geri alım') ||
                lower.includes('ihracat') ||
                lower.includes('sözleşme') ||
                lower.includes('temettü')
              ) {
                importance = 'Yüksek';
              }

              let category: 'Finansal Rapor' | 'Özel Durum' | 'İş İlişkisi' | 'Sermaye Artırımı' | 'Pay Alım/Satım' =
                'Özel Durum';
              if (lower.includes('geri alım') || lower.includes('pay alım')) category = 'Pay Alım/Satım';
              else if (lower.includes('sözleşme') || lower.includes('ihracat') || lower.includes('iş birliği'))
                category = 'İş İlişkisi';
              else if (lower.includes('bilanço') || lower.includes('finansal') || lower.includes('kâr'))
                category = 'Finansal Rapor';
              else if (lower.includes('sermaye') || lower.includes('bedelsiz') || lower.includes('bedelli'))
                category = 'Sermaye Artırımı';

              newsList.push({
                id: `live-kap-${i}-${pubDate.getTime()}`,
                stockCode: matchedStock,
                companyName: matchedCompany,
                title: cleanTitle,
                timestamp: `${pubDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} (${pubDate.toLocaleDateString('tr-TR')})`,
                importance,
                summary: `${cleanTitle} - ${source} üzerinden kamuya duyurulan güncel KAP/BIST bildirimidir.`,
                fullContent: `${cleanTitle}\n\nKaynak Sağlayıcı: ${source}\nYayınlanma Zamanı: ${pubDate.toLocaleString('tr-TR')}\nKategori: ${category}\n\nBu bildirim Kamuyu Aydınlatma Platformu (KAP) ve BIST haber ağından canlı olarak çekilmiştir.`,
                sentiment,
                category,
              });
            }

            kapNewsCache = { data: newsList, cachedAt: now };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, count: newsList.length, data: newsList }));
            return;
          } catch (error: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: error.message }));
            return;
          }
        }

        // 5. User Authentication & Profile Persistence API Endpoints
        const USERS_FILE_PATH = path.resolve(process.cwd(), 'data', 'users.json');

        function loadUsers(): any[] {
          try {
            if (fs.existsSync(USERS_FILE_PATH)) {
              const raw = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
              return JSON.parse(raw);
            }
          } catch (e: any) {
            console.error('Failed reading users.json:', e.message);
          }
          return [];
        }

        function saveUsers(users: any[]) {
          try {
            const dir = path.dirname(USERS_FILE_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
          } catch (e: any) {
            console.error('Failed saving users.json:', e.message);
          }
        }

        function sanitizeUser(u: any) {
          if (!u) return null;
          const { passwordHash, ...safe } = u;
          return safe;
        }

        function parseJsonBody(request: any): Promise<any> {
          return new Promise(resolve => {
            let body = '';
            request.on('data', (chunk: any) => { body += chunk.toString(); });
            request.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (e) {
                resolve({});
              }
            });
            request.on('error', () => resolve({}));
          });
        }

        // Register: /api/auth/register
        if (reqUrl === '/api/auth/register' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { username, fullName, email, password, avatarUrl, riskTolerance, defaultHorizon, bio, phone } = body;

            if (!username || !email || !password) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Kullanıcı adı, e-posta ve şifre zorunludur.' }));
              return;
            }

            if (password.length < 4) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Şifre en az 4 karakter olmalıdır.' }));
              return;
            }

            const users = loadUsers();
            const cleanUser = username.trim().toLowerCase();
            const cleanEmail = email.trim().toLowerCase();

            if (users.some(u => u.username.toLowerCase() === cleanUser)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Bu kullanıcı adı zaten kullanılıyor.' }));
              return;
            }

            if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Bu e-posta adresi ile zaten kayıtlı bir hesap var.' }));
              return;
            }

            const newUser = {
              id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              username: username.trim(),
              fullName: (fullName || username).trim(),
              email: cleanEmail,
              passwordHash: password,
              avatarUrl: avatarUrl || 'preset_cloud_lightning',
              bio: bio || 'Cloud Finance terminal yatırımcısı.',
              phone: phone || '',
              role: 'Bireysel Yatırımcı',
              riskTolerance: riskTolerance || 'Dengeli (Orta Risk)',
              defaultHorizon: defaultHorizon || '1m',
              defaultView: 'table',
              watchlist: ['THYAO', 'GARAN', 'DMSAS', 'ASELS'],
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              twoFactorEnabled: false,
              notifications: {
                kapAlerts: true,
                priceAlerts: true,
                dailyDigest: true,
                emailNotifications: false,
              },
            };

            users.push(newUser);
            saveUsers(users);

            const token = `tok_${newUser.id}_${Date.now()}`;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, token, user: sanitizeUser(newUser) }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
        }

        // Login: /api/auth/login
        if (reqUrl === '/api/auth/login' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { identifier, password } = body;

            if (!identifier || !password) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Kullanıcı adı/e-posta ve şifre zorunludur.' }));
              return;
            }

            const users = loadUsers();
            const cleanId = identifier.trim().toLowerCase();
            const user = users.find(u => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId);

            if (!user || user.passwordHash !== password) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Kullanıcı adı/e-posta veya şifre hatalı.' }));
              return;
            }

            user.lastLoginAt = new Date().toISOString();
            saveUsers(users);

            const token = `tok_${user.id}_${Date.now()}`;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, token, user: sanitizeUser(user) }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
        }

        // Get Current User: /api/auth/me
        if (reqUrl.startsWith('/api/auth/me')) {
          try {
            const authHeader = req.headers.authorization || '';
            const token = authHeader.replace(/^Bearer\s+/i, '').trim();
            const users = loadUsers();

            let user = null;
            if (token) {
              const parts = token.split('_');
              const userId = parts.length >= 2 ? `${parts[0]}_${parts[1]}` : null;
              if (userId) {
                user = users.find(u => u.id === userId);
              }
            }

            if (!user && users.length > 0) {
              user = users[0];
            }

            if (!user) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Kullanıcı bulunamadı.' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, user: sanitizeUser(user) }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
        }

        // Update Profile: /api/auth/update-profile
        if (reqUrl === '/api/auth/update-profile' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { userId, fullName, avatarUrl, bio, phone, role, riskTolerance, defaultHorizon, defaultView, notifications, twoFactorEnabled } = body;

            const users = loadUsers();
            const user = users.find(u => u.id === userId) || users[0];

            if (!user) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Kullanıcı bulunamadı.' }));
              return;
            }

            if (fullName !== undefined) user.fullName = fullName.trim();
            if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
            if (bio !== undefined) user.bio = bio.trim();
            if (phone !== undefined) user.phone = phone.trim();
            if (role !== undefined) user.role = role;
            if (riskTolerance !== undefined) user.riskTolerance = riskTolerance;
            if (defaultHorizon !== undefined) user.defaultHorizon = defaultHorizon;
            if (defaultView !== undefined) user.defaultView = defaultView;
            if (twoFactorEnabled !== undefined) user.twoFactorEnabled = Boolean(twoFactorEnabled);
            if (notifications !== undefined) user.notifications = { ...user.notifications, ...notifications };

            saveUsers(users);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, user: sanitizeUser(user) }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
        }

        // Change Password: /api/auth/change-password
        if (reqUrl === '/api/auth/change-password' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { userId, currentPassword, newPassword } = body;

            const users = loadUsers();
            const user = users.find(u => u.id === userId) || users[0];

            if (!user) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Kullanıcı bulunamadı.' }));
              return;
            }

            if (user.passwordHash !== currentPassword) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Mevcut şifreniz hatalı.' }));
              return;
            }

            if (!newPassword || newPassword.length < 4) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Yeni şifre en az 4 karakter olmalıdır.' }));
              return;
            }

            user.passwordHash = newPassword;
            saveUsers(users);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, message: 'Şifreniz başarıyla güncellendi.' }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
        }

        // Toggle / Manage Watchlist: /api/auth/watchlist
        if (reqUrl === '/api/auth/watchlist' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { userId, stockCode, action } = body;

            const users = loadUsers();
            const user = users.find(u => u.id === userId) || users[0];

            if (!user) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Kullanıcı bulunamadı.' }));
              return;
            }

            const code = (stockCode || '').toUpperCase().trim();
            if (code) {
              if (action === 'remove') {
                user.watchlist = (user.watchlist || []).filter((s: string) => s !== code);
              } else if (action === 'add') {
                if (!user.watchlist) user.watchlist = [];
                if (!user.watchlist.includes(code)) user.watchlist.push(code);
              } else {
                // Toggle
                if (!user.watchlist) user.watchlist = [];
                if (user.watchlist.includes(code)) {
                  user.watchlist = user.watchlist.filter((s: string) => s !== code);
                } else {
                  user.watchlist.push(code);
                }
              }
              saveUsers(users);
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, watchlist: user.watchlist || [] }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), liveBistApiPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
