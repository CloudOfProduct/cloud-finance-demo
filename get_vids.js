const fetch = require('node-fetch'); // might not be needed in node 18+
fetch('https://mixkit.co/free-stock-video/lightning/').then(r => r.text()).then(html => {
  const match = html.match(/https:\/\/assets\.mixkit\.co\/videos\/preview\/[a-zA-Z0-9-]+\.mp4/gi);
  console.log(match ? Array.from(new Set(match)).slice(0, 3) : 'Not found');
}).catch(console.error);
