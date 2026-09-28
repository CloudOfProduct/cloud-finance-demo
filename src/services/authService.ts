import type { UserProfile, AuthState, InvestorRiskProfile, TimeHorizon } from '../types';

export interface AvatarPreset {
  id: string;
  name: string;
  description: string;
  bgGradient: string;
  borderColor: string;
  svgIcon: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'preset_cloud_lightning',
    name: 'Bulut & Şimşek',
    description: 'Cloud Finance resmi terminal simgesi',
    bgGradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    borderColor: '#38bdf8',
    svgIcon: '⚡',
  },
  {
    id: 'preset_golden_bull',
    name: 'Altın Boğa',
    description: 'Yükseliş trendi ve büyüme odaklı',
    bgGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    borderColor: '#fbbf24',
    svgIcon: '🐂',
  },
  {
    id: 'preset_cyber_trader',
    name: 'Siber Analist',
    description: 'Yüksek frekanslı algo trader',
    bgGradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    borderColor: '#10b981',
    svgIcon: '💻',
  },
  {
    id: 'preset_executive',
    name: 'Fon Yöneticisi',
    description: 'Kurumsal portföy ve strateji',
    bgGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderColor: '#818cf8',
    svgIcon: '👔',
  },
  {
    id: 'preset_falcon',
    name: 'BIST Şahini',
    description: 'Keskin piyasa takipçisi',
    bgGradient: 'linear-gradient(135deg, #ef4444, #f97316)',
    borderColor: '#f87171',
    svgIcon: '🦅',
  },
  {
    id: 'preset_matrix',
    name: 'Kuantum Motoru',
    description: 'Yapay zeka ve kantitatif veri',
    bgGradient: 'linear-gradient(135deg, #059669, #0d9488)',
    borderColor: '#34d399',
    svgIcon: '🧠',
  },
];

const STORAGE_KEY_TOKEN = 'cloud_finance_token';
const STORAGE_KEY_USER = 'cloud_finance_user';

class AuthService {
  private state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  };

  private listeners: Array<(state: AuthState) => void> = [];

  constructor() {
    this.initFromStorage();
  }

  private async initFromStorage() {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);

      if (storedToken && storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          this.state = {
            user: userObj,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          };
          this.notifyListeners();
        } catch (e) {
          // JSON parse failed
        }

        // Validate or refresh with server
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              this.state.user = data.user;
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
              this.notifyListeners();
            }
          }
        } catch (err) {
          // Offline or network error, keep stored user
        }
      } else {
        // No stored session — user must log in manually
        this.state = {
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        };
      }
    } catch (e) {
      console.warn('Auth initialization error:', e);
      this.state = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    } finally {
      this.state.isLoading = false;
      this.notifyListeners();
    }
  }

  public async autoLoginDemoUser(): Promise<void> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'demo@cloudfinance.com',
          password: 'demo123',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          this.setSession(data.token, data.user);
        }
      }
    } catch (err) {
      console.warn('Auto demo login skipped:', err);
    }
  }

  private setSession(token: string, user: UserProfile) {
    this.state = {
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    };
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed writing to localStorage:', e);
    }
    this.notifyListeners();
  }

  private clearSession() {
    this.state = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    };
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) {
      console.warn('Failed clearing localStorage:', e);
    }
    this.notifyListeners();
  }

  private getUsersDb(): any[] {
    try {
      const db = localStorage.getItem('cloud_finance_mock_db');
      if (db) return JSON.parse(db);
    } catch (e) {}
    // Varsayılan Demo Kullanıcısı
    return [{
      id: 'usr_demo123',
      username: 'demo',
      email: 'demo@cloudfinance.com',
      passwordHash: 'demo123',
      fullName: 'Demo Kullanıcı',
      role: 'PREMIUM',
      watchlist: ['THYAO', 'ASELS', 'GARAN']
    }];
  }

  private saveUsersDb(users: any[]) {
    localStorage.setItem('cloud_finance_mock_db', JSON.stringify(users));
  }

  public async login(identifier: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await new Promise(r => setTimeout(r, 600)); // Simulate network
      const users = this.getUsersDb();
      const cleanId = identifier.trim().toLowerCase();
      
      const user = users.find(u => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId);
      
      if (!user || user.passwordHash !== password) {
        return { success: false, error: 'Kullanıcı adı veya şifre hatalı!' };
      }

      this.setSession(`tok_${user.id}_${Date.now()}`, user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Bağlantı hatası' };
    }
  }

  public async register(payload: {
    username: string;
    fullName: string;
    email: string;
    password: string;
    avatarUrl?: string;
    riskTolerance?: InvestorRiskProfile;
    defaultHorizon?: TimeHorizon;
    bio?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await new Promise(r => setTimeout(r, 600));
      const users = this.getUsersDb();
      
      if (users.find(u => u.username === payload.username || u.email === payload.email)) {
        return { success: false, error: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' };
      }

      const newUser = {
        id: `usr_${Date.now()}`,
        username: payload.username,
        email: payload.email,
        passwordHash: payload.password,
        fullName: payload.fullName || payload.username,
        role: 'FREE',
        watchlist: ['THYAO'],
        riskTolerance: payload.riskTolerance || 'MODERATE',
        defaultHorizon: payload.defaultHorizon || 'MEDIUM'
      };

      users.push(newUser);
      this.saveUsersDb(users);
      this.setSession(`tok_${newUser.id}_${Date.now()}`, newUser as any);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Bağlantı hatası' };
    }
  }

  public async logout(): Promise<void> {
    this.clearSession();
  }

  public async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    if (!this.state.user) return { success: false, error: 'Oturum açık değil' };
    try {
      await new Promise(r => setTimeout(r, 400));
      const users = this.getUsersDb();
      const idx = users.findIndex(u => u.id === this.state.user!.id);
      if (idx === -1) return { success: false, error: 'Kullanıcı bulunamadı' };
      
      const updatedUser = { ...users[idx], ...updates };
      users[idx] = updatedUser;
      this.saveUsersDb(users);
      
      this.state.user = updatedUser;
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      this.notifyListeners();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Bağlantı hatası' };
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.state.user) return { success: false, error: 'Oturum açık değil' };

    try {
      await new Promise(r => setTimeout(r, 400));
      const users = this.getUsersDb();
      const idx = users.findIndex(u => u.id === this.state.user!.id);
      if (idx === -1) return { success: false, error: 'Kullanıcı bulunamadı' };
      
      if (users[idx].passwordHash !== currentPassword) {
        return { success: false, error: 'Mevcut şifre hatalı' };
      }
      
      users[idx].passwordHash = newPassword;
      this.saveUsersDb(users);
      return { success: true, message: 'Şifreniz başarıyla değiştirildi.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Bağlantı hatası' };
    }
  }

  public async toggleWatchlist(stockCode: string): Promise<string[]> {
    if (!this.state.user) return [];
    const code = stockCode.toUpperCase().trim();

    try {
      const users = this.getUsersDb();
      const idx = users.findIndex(u => u.id === this.state.user!.id);
      
      const current = this.state.user.watchlist || [];
      const updated = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
      
      this.state.user.watchlist = updated;
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.state.user));
      
      if (idx !== -1) {
        users[idx].watchlist = updated;
        this.saveUsersDb(users);
      }
      
      this.notifyListeners();
      return updated;
    } catch (err) {
      return this.state.user.watchlist || [];
    }
  }

  public isInWatchlist(stockCode: string): boolean {
    if (!this.state.user || !this.state.user.watchlist) return false;
    return this.state.user.watchlist.includes(stockCode.toUpperCase().trim());
  }

  public getAuthState(): AuthState {
    return { ...this.state };
  }

  public getCurrentUser(): UserProfile | null {
    return this.state.user;
  }

  public subscribeAuth(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l({ ...this.state }));
  }
}

export const authService = new AuthService();
