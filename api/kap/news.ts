export default async function handler(req, res) {
  try {
    const { symbol } = req.query;
    let url = 'https://news.google.com/rss/search?q=KAP+Borsa+when:30d&hl=tr&gl=TR&ceid=TR:tr';
    if (symbol && symbol !== 'ALL' && symbol !== 'TÜMÜ') {
      url = `https://news.google.com/rss/search?q=KAP+${symbol}+when:30d&hl=tr&gl=TR&ceid=TR:tr`;
    }
    
    const raw = await fetch(url);
    const xml = await raw.text();
    
    // Quick regex parsing since we don't have xml2js
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      
      if (titleMatch) {
        items.push({
          id: linkMatch ? linkMatch[1] : Math.random().toString(),
          title: titleMatch[1].replace('<![CDATA[', '').replace(']]>', ''),
          url: linkMatch ? linkMatch[1] : '#',
          publishedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          source: 'KAP Bildirimi'
        });
      }
    }
    
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ success: true, symbol: symbol || 'ALL', data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
