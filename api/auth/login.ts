import { getUsers, saveUsers } from '../common';
export default function handler(req, res) {
  const { identifier, password } = req.body;
  const users = getUsers();
  const user = users.find(u => u.username === identifier || u.email === identifier);
  if (!user || user.passwordHash !== password) return res.status(401).json({ success: false, error: 'Hatalı şifre' });
  res.status(200).json({ success: true, token: 'tok_123', user });
}
