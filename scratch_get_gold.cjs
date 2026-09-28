const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const raw = await fetch('https://finans.mynet.com/altin/');
    // search for gram altin
    const re = /<tr[^>]*>[\s\S]*?<a[^>]*altin\/([a-z0-9-]+)[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*>([0-9.,]+)<\/td>[\s\S]*?<td[^>]*>[\s\S]*?([0-9.,-]+)\s*%?<\/span>[\s\S]*?<\/tr>/gi;
    let match;
    while ((match = re.exec(raw)) !== null) {
      const slug = match[1];
      const name = match[2].replace(/<[^>]*>/g, '').trim();
      const price = match[3].trim();
      const change = match[4].trim();
      console.log(`[MYNET ALTIN] ${slug} | ${name} | Fiyat: ${price} | Değişim: %${change}`);
    }
  } catch (err) {
    console.error('Error fetching altin:', err.message);
  }

  // Also check Doviz
  try {
    const rawDoviz = await fetch('https://finans.mynet.com/doviz/');
    const reDoviz = /<tr[^>]*>[\s\S]*?<a[^>]*doviz\/([a-z0-9-]+)[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*>([0-9.,]+)<\/td>[\s\S]*?<td[^>]*>[\s\S]*?([0-9.,-]+)\s*%?<\/span>[\s\S]*?<\/tr>/gi;
    let match;
    while ((match = reDoviz.exec(rawDoviz)) !== null) {
      const slug = match[1];
      const name = match[2].replace(/<[^>]*>/g, '').trim();
      const price = match[3].trim();
      const change = match[4].trim();
      console.log(`[MYNET DOVIZ] ${slug} | ${name} | Fiyat: ${price} | Değişim: %${change}`);
    }
  } catch (err) {
    console.error('Error fetching doviz:', err.message);
  }
}

run();
