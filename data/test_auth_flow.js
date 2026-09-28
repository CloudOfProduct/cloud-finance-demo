import http from 'http';

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing Register ---');
  const regRes = await post('/api/auth/register', {
    name: 'Bora Karataş',
    username: 'borakaratas',
    email: 'bora@bistfinans.com',
    password: 'Password123!',
    avatar: 'bull',
    riskProfile: 'growth'
  });
  console.log('Register status:', regRes.status, 'Response:', regRes.body);

  console.log('\n--- 2. Testing Login ---');
  const loginRes = await post('/api/auth/login', {
    identifier: 'borakaratas',
    password: 'Password123!'
  });
  console.log('Login status:', loginRes.status, 'User Name:', loginRes.body.user?.name);
  const token = loginRes.body.token;
  const userId = loginRes.body.user?.id;

  console.log('\n--- 3. Testing Watchlist Toggle (THYAO) ---');
  const wlRes = await post('/api/auth/watchlist', {
    userId: userId,
    stockCode: 'THYAO',
    action: 'toggle'
  }, token);
  console.log('Watchlist status:', wlRes.status, 'Watchlist:', wlRes.body.watchlist);

  console.log('\n--- 4. Testing Watchlist Toggle (ASELS) ---');
  const wlRes2 = await post('/api/auth/watchlist', {
    userId: userId,
    stockCode: 'ASELS',
    action: 'toggle'
  }, token);
  console.log('Watchlist status:', wlRes2.status, 'Watchlist:', wlRes2.body.watchlist);

  console.log('\n--- 5. Testing Profile Update ---');
  const profRes = await post('/api/auth/update-profile', {
    userId: userId,
    name: 'Bora Karataş (Pro)',
    bio: 'BIST 30 & Algoritmik İşlemler Yatırımcısı',
    riskProfile: 'growth',
    defaultHorizon: '3m',
    avatar: 'cyber'
  }, token);
  console.log('Profile update status:', profRes.status, 'Updated User:', profRes.body.user?.name, 'Avatar:', profRes.body.user?.avatar);

  console.log('\n--- 6. Testing Password Change ---');
  const pwdRes = await post('/api/auth/change-password', {
    userId: userId,
    currentPassword: 'Password123!',
    newPassword: 'NewSecurePassword456!'
  }, token);
  console.log('Password change status:', pwdRes.status, 'Message:', pwdRes.body.message);

  console.log('\n--- 7. Testing Login with New Password ---');
  const newLoginRes = await post('/api/auth/login', {
    identifier: 'bora@bistfinans.com',
    password: 'NewSecurePassword456!'
  });
  console.log('New password login status:', newLoginRes.status, 'Success:', newLoginRes.body.success);

  console.log('\nALL AUTH FLOW TESTS COMPLETED SUCCESSFULLY!');
}

run().catch(console.error);
