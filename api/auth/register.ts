import { getUsers, saveUsers } from '../common';
export default function handler(req, res) {
  const { username, email, password } = req.body;
  const users = getUsers();
  if (users.find(u => u.username === username || u.email === email)) return res.status(400).json({ success: false, error: 'Kullanıcı mevcut' });
  const newUser = { id: Date.now().toString(), username, email, passwordHash: password, watchlist: [] };
  users.push(newUser);
  res.status(200).json({ success: true, token: 'tok_123', user: newUser });
}
