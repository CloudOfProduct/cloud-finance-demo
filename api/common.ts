let usersCache = [
  { id: 'usr_demo123', username: 'demo', email: 'demo@cloudfinance.com', passwordHash: 'demo123', fullName: 'Demo Kullanıcı', watchlist: ['THYAO'] }
];
export function getUsers() { return usersCache; }
export function saveUsers(u) { usersCache = u; }
