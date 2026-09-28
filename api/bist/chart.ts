export default async function handler(req, res) {
  try {
    let { symbol, timeframe } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });
    
    let interval = '1d';
    let range = '1mo';
    
    const yahooSym = symbol.endsWith('TRY=X') || symbol.endsWith('=X') || symbol.endsWith('=F') || symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP') ? symbol : `${symbol}.IS`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=${interval}&range=${range}`;
    
    const raw = await fetch(url);
    const json = await raw.json();
    
    const result = json.chart?.result?.[0];
    if (!result) return res.status(200).json({ success: true, candles: [] });
    
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    
    const candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open?.[i] == null) continue;
      candles.push({
        time: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume?.[i] || 0
      });
    }
    
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ success: true, symbol, timeframe, candles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
