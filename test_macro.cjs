const https = require('https');

function fetchExternal(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  const html = await fetchExternal('https://finans.mynet.com/altin/');
  const re = /<span class="ticker-price dynamic-price-([A-Z0-9_-]+)">([0-9.,]+)<\/span>[\s\S]*?<span class="ticker-change dynamic-direction-[A-Z0-9_-]+">([%0-9.,+-]+)<\/span>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    console.log(m[1], 'Price:', m[2], 'Change:', m[3]);
  }
}

test();
