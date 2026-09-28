export default async function handler(req, res) {
  try {
    const symbols = [
      'THYAO.IS','ASELS.IS','EREGL.IS','GARAN.IS','KCHOL.IS','AKBNK.IS',
      'TUPRS.IS','YKBNK.IS','SISE.IS','BIMAS.IS','SAHOL.IS','FROTO.IS',
      'ENKAI.IS','ISCTR.IS','PGSUS.IS','TOASO.IS','PETKM.IS','TCELL.IS',
      'KOZAL.IS','TTKOM.IS','TRY=X','EURTRY=X','GBPTRY=X','XU100.IS','GC=F'
    ].join(',');
    
    const raw = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`);
    const json = await raw.json();
    const result = json.quoteResponse?.result || [];
    
    const mapped = result.map(item => {
      let sym = item.symbol.replace('.IS', '');
      if (sym === 'TRY=X') sym = 'USDTRY';
      if (sym === 'EURTRY=X') sym = 'EURTRY';
      if (sym === 'GBPTRY=X') sym = 'GBPTRY';
      if (sym === 'GC=F') sym = 'GRAM_ALTIN';

      return {
        symbol: sym,
        price: Number((item.regularMarketPrice || 0).toFixed(2)),
        change: Number((item.regularMarketChangePercent || 0).toFixed(2)),
        timestamp: (item.regularMarketTime || 0) * 1000,
        volume: item.regularMarketVolume || 0
      };
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
