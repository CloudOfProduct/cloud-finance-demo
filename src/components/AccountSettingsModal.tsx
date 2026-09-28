import React, { useState, useRef, useEffect } from 'react';
import { authService, AVATAR_PRESETS } from '../services/authService';
import { stockService } from '../services/stockService';
import { UserAvatar } from './UserAvatar';
import type { UserProfile, InvestorRiskProfile, TimeHorizon } from '../types';
import {
  X,
  User,
  Shield,
  Sliders,
  Bell,
  Camera,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  Star,
  Trash2,
  Plus,
  Upload,
  Eye,
  EyeOff,
  KeyRound,
  Smartphone,
} from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onOpenStockDetail?: (stockCode: string) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onOpenStockDetail,
}) => {
  const [user, setUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'notifications'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [role, setRole] = useState(user?.role || 'Bireysel Yatırımcı');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || 'preset_cloud_lightning');

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled || false);

  // Preferences Form State
  const [riskTolerance, setRiskTolerance] = useState<InvestorRiskProfile>(user?.riskTolerance || 'Dengeli (Orta Risk)');
  const [defaultHorizon, setDefaultHorizon] = useState<TimeHorizon>(user?.defaultHorizon || '1m');
  const [defaultView, setDefaultView] = useState<'table' | 'cards'>(user?.defaultView || 'table');
  const [watchlist, setWatchlist] = useState<string[]>(user?.watchlist || []);
  const [newStockCode, setNewStockCode] = useState('');

  // Notifications State
  const [kapAlerts, setKapAlerts] = useState(user?.notifications?.kapAlerts ?? true);
  const [priceAlerts, setPriceAlerts] = useState(user?.notifications?.priceAlerts ?? true);
  const [dailyDigest, setDailyDigest] = useState(user?.notifications?.dailyDigest ?? true);

  // UI status
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarChooser, setShowAvatarChooser] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = authService.subscribeAuth(state => {
      setUser(state.user);
      if (state.user) {
        setFullName(state.user.fullName);
        setUsername(state.user.username);
        setEmail(state.user.email);
        setPhone(state.user.phone || '');
        setBio(state.user.bio || '');
        setRole(state.user.role);
        setAvatarUrl(state.user.avatarUrl);
        setRiskTolerance(state.user.riskTolerance);
        setDefaultHorizon(state.user.defaultHorizon);
        setDefaultView(state.user.defaultView);
        setWatchlist(state.user.watchlist || []);
        setTwoFactor(state.user.twoFactorEnabled);
        setKapAlerts(state.user.notifications?.kapAlerts ?? true);
        setPriceAlerts(state.user.notifications?.priceAlerts ?? true);
        setDailyDigest(state.user.notifications?.dailyDigest ?? true);
      }
    });
    return unsub;
  }, []);

  if (!isOpen || !user) return null;

  // Handle image upload from computer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Profil fotoğrafı 3MB\'dan küçük olmalıdır.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        setFeedback({ type: 'success', message: 'Fotoğraf yüklendi! Kaydetmeyi unutmayın.' });
      }
    };
    reader.readAsDataURL(file);
  };

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const result = await authService.updateProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      role: role as any,
      avatarUrl,
      riskTolerance,
      defaultHorizon,
      defaultView,
      twoFactorEnabled: twoFactor,
      notifications: {
        kapAlerts,
        priceAlerts,
        dailyDigest,
        emailNotifications: false,
      },
    });

    setIsSaving(false);
    if (result.success) {
      setFeedback({ type: 'success', message: 'Profil ve hesap ayarlarınız başarıyla kaydedildi!' });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Ayarlar kaydedilemedi.' });
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentPassword) {
      setFeedback({ type: 'error', message: 'Lütfen mevcut şifrenizi girin.' });
      return;
    }
    if (newPassword.length < 4) {
      setFeedback({ type: 'error', message: 'Yeni şifre en az 4 karakter olmalıdır.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Yeni şifreler birbiriyle eşleşmiyor.' });
      return;
    }

    setIsSaving(true);
    const result = await authService.changePassword(currentPassword, newPassword);
    setIsSaving(false);

    if (result.success) {
      setFeedback({ type: 'success', message: 'Şifreniz başarıyla güncellendi!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Şifre güncellenemedi.' });
    }
  };

  // Add stock to watchlist
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newStockCode.toUpperCase().trim();
    if (!code) return;

    const updated = await authService.toggleWatchlist(code);
    setWatchlist(updated);
    setNewStockCode('');
    setFeedback({ type: 'success', message: `${code} takip listenize eklendi.` });
    setTimeout(() => setFeedback(null), 2500);
  };

  // Remove stock from watchlist
  const handleRemoveStock = async (code: string) => {
    const updated = await authService.toggleWatchlist(code);
    setWatchlist(updated);
    setFeedback({ type: 'success', message: `${code} takip listesinden çıkarıldı.` });
    setTimeout(() => setFeedback(null), 2500);
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 720,
          backgroundColor: 'rgba(10, 15, 29, 0.98)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 50px rgba(56, 189, 248, 0.12)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Top Header Banner */}
        <div
          style={{
            padding: '24px 28px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(99, 102, 241, 0.08))',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* Avatar with click-to-change overlay */}
            <div style={{ position: 'relative' }}>
              <UserAvatar avatarUrl={avatarUrl} name={fullName} size="lg" borderGlow={true} showStatus={true} />
              <button
                type="button"
                onClick={() => setShowAvatarChooser(!showAvatarChooser)}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  backgroundColor: '#0284c7',
                  border: '2px solid #0a0f1d',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 8px rgba(2, 132, 199, 0.8)',
                }}
                title="Fotoğrafı Değiştir"
              >
                <Camera size={13} />
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {fullName || user.username}
                </h2>
                <span
                  style={{
                    fontSize: 10.5,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--electric-cyan)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontWeight: 800,
                  }}
                >
                  {role}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>@{user.username}</span>
                <span>•</span>
                <span>{email}</span>
                <span>•</span>
                <span>Kayıt: {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Avatar Chooser Popdown (when camera clicked) */}
        {showAvatarChooser && (
          <div
            style={{
              padding: '16px 28px',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderBottom: '1px solid var(--border-subtle)',
              animation: 'fadeIn 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--electric-cyan)' }}>
                Profil Fotoğrafı veya Rozetini Seç
              </span>
              <button
                type="button"
                onClick={() => setShowAvatarChooser(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
              >
                Kapat
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Presets */}
              {AVATAR_PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(p.id);
                    setShowAvatarChooser(false);
                    setFeedback({ type: 'success', message: `${p.name} rozeti seçildi! Kaydetmeyi unutmayın.` });
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: avatarUrl === p.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: avatarUrl === p.id ? '2px solid var(--electric-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{p.svgIcon}</span>
                  <span>{p.name}</span>
                </button>
              ))}

              {/* Upload from file */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ fontSize: 12, padding: '7px 12px', gap: 6 }}
              >
                <Upload size={14} />
                <span>Cihazdan Fotoğraf Yükle</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'profile', label: 'Profil Bilgileri', icon: User },
            { id: 'security', label: 'Güvenlik & Şifre', icon: Shield },
            { id: 'preferences', label: 'Yatırım & Takip Listesi', icon: Sliders },
            { id: 'notifications', label: 'Bildirimler', icon: Bell },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setFeedback(null);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: isActive ? 'var(--electric-cyan)' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--electric-cyan)' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body with Scroll */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {/* Feedback Alert */}
          {feedback && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: PROFILE FORM */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`@${username}`}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                      cursor: 'not-allowed',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    placeholder="+90 5XX XXX XX XX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Yatırımcı Rolü / Ünvan
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  <option value="Bireysel Yatırımcı" style={{ backgroundColor: '#0f172a' }}>Bireysel Yatırımcı</option>
                  <option value="Pro Terminal Analisti" style={{ backgroundColor: '#0f172a' }}>Pro Terminal Analisti</option>
                  <option value="Fon Yöneticisi" style={{ backgroundColor: '#0f172a' }}>Fon Yöneticisi</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Yatırımcı Strateji Notu & Biyografi
                </label>
                <textarea
                  rows={3}
                  placeholder="Yatırım felsefeniz, takip ettiğiniz sektörler..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: 13, gap: 8 }}
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Kaydediliyor...' : 'Profil Değişikliklerini Kaydet'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <KeyRound size={16} style={{ color: 'var(--electric-cyan)' }} />
                  <span>Şifre Değiştir</span>
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Mevcut Şifre
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      placeholder="Mevcut şifreniz"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ffffff',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Yeni Şifre
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        placeholder="En az 4 karakter"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 38px 10px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          color: '#ffffff',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Yeni Şifre Onayı
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Yeni şifreyi tekrar edin"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ffffff',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary"
                    style={{ padding: '9px 20px', fontSize: 12.5 }}
                  >
                    Şifreyi Güncelle
                  </button>
                </div>
              </form>

              {/* Two Factor Authentication (2FA) */}
              <div
                style={{
                  padding: 18,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--electric-cyan)',
                    }}
                  >
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: 0, color: '#ffffff' }}>
                      İki Faktörlü Doğrulama (2FA)
                    </h4>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Hesabınıza girişlerde SMS veya Authenticator uygulaması ile ek güvenlik katmanı sağlar.
                    </p>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={async e => {
                      const val = e.target.checked;
                      setTwoFactor(val);
                      await authService.updateProfile({ twoFactorEnabled: val });
                      setFeedback({ type: 'success', message: `2FA ${val ? 'aktif edildi' : 'devre dışı bırakıldı'}.` });
                    }}
                    style={{ width: 18, height: 18, accentColor: 'var(--electric-cyan)' }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & WATCHLIST */}
          {activeTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Risk Tolerance */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
                  Yatırımcı Risk Profili
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {(['Temkinli (Düşük Risk)', 'Dengeli (Orta Risk)', 'Büyüme Odaklı (Yüksek Risk)'] as InvestorRiskProfile[]).map(r => {
                    const isSelected = riskTolerance === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={async () => {
                          setRiskTolerance(r);
                          await authService.updateProfile({ riskTolerance: r });
                          setFeedback({ type: 'success', message: `Risk profili "${r}" olarak güncellendi.` });
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '2px solid var(--electric-cyan)' : '1px solid var(--border-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Horizon & View */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Varsayılan Karar Destek Ufku
                  </label>
                  <select
                    value={defaultHorizon}
                    onChange={async e => {
                      const h = e.target.value as TimeHorizon;
                      setDefaultHorizon(h);
                      await authService.updateProfile({ defaultHorizon: h });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="1d" style={{ backgroundColor: '#0f172a' }}>1 Günlük (Gün İçi / Çok Kısa)</option>
                    <option value="1w" style={{ backgroundColor: '#0f172a' }}>1 Haftalık (Kısa Vade)</option>
                    <option value="1m" style={{ backgroundColor: '#0f172a' }}>1 Aylık (Orta Vade - Varsayılan)</option>
                    <option value="1y" style={{ backgroundColor: '#0f172a' }}>1 Yıllık (Uzun Vade)</option>
                    <option value="3y" style={{ backgroundColor: '#0f172a' }}>3 Yıllık (Stratejik Temettü)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Varsayılan Liste Görünümü
                  </label>
                  <select
                    value={defaultView}
                    onChange={async e => {
                      const v = e.target.value as 'table' | 'cards';
                      setDefaultView(v);
                      await authService.updateProfile({ defaultView: v });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="table" style={{ backgroundColor: '#0f172a' }}>Kompakt Tablo Görünümü (Tavsiye Edilen)</option>
                    <option value="cards" style={{ backgroundColor: '#0f172a' }}>Geniş Kart Görünümü</option>
                  </select>
                </div>
              </div>

              {/* Personal Watchlist Management */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Star size={15} style={{ color: '#fbbf24' }} />
                      <span>Kişisel Takip Listeniz ({watchlist.length} Hisse)</span>
                    </h4>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Kaydettiğiniz hisseler doğrudan terminalinize ve fiyat takip motorunuza bağlanır.
                    </span>
                  </div>
                </div>

                {/* Add stock bar */}
                <form onSubmit={handleAddStock} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    placeholder="BIST Hisse Kodu (Örn: THYAO, SASA, EREGL)..."
                    value={newStockCode}
                    onChange={e => setNewStockCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#ffffff',
                      fontSize: 12.5,
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ fontSize: 12, padding: '8px 14px', gap: 4 }}
                  >
                    <Plus size={14} />
                    <span>Listeye Ekle</span>
                  </button>
                </form>

                {/* Stock Chips Grid */}
                {watchlist.length === 0 ? (
                  <div style={{ padding: 14, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                    Henüz takip listenize hisse eklemediniz. Yukarıdan hisse kodu yazarak ekleyebilirsiniz.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {watchlist.map(code => {
                      const stock = stockService.getStockByCode(code);
                      const priceStr = stock ? `${stock.price.toFixed(2)} ₺` : '';
                      const isPos = stock ? stock.changePercent >= 0 : true;

                      return (
                        <div
                          key={code}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: 12,
                          }}
                        >
                          <span
                            onClick={() => {
                              onOpenStockDetail?.(code);
                              onClose();
                            }}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              color: 'var(--electric-cyan)',
                              cursor: 'pointer',
                            }}
                            title="Hisse Detayını Aç"
                          >
                            {code}
                          </span>

                          {stock && (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                fontWeight: 700,
                                color: isPos ? '#10b981' : '#ef4444',
                              }}
                            >
                              {priceStr} ({isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveStock(code)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 2,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Listeden Çıkar"
                          >
                            <Trash2 size={13} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: 0, color: '#ffffff' }}>
                    KAP Bildirim Alarmları
                  </h4>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Takip listenizdeki hisselere ilişkin kritik özel durum açıklamalarında anlık uyarı alırsınız.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={kapAlerts}
                  onChange={async e => {
                    const val = e.target.checked;
                    setKapAlerts(val);
                    await authService.updateProfile({ notifications: { ...user.notifications, kapAlerts: val } });
                  }}
                  style={{ width: 18, height: 18, accentColor: 'var(--electric-cyan)' }}
                />
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: 0, color: '#ffffff' }}>
                    Piyasa & Tavan / Taban Alarmları
                  </h4>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Hisseleriniz BIST tavanı (+%10) veya tabanına (-%10) yaklaştığında görsel uyarı gönderilir.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={priceAlerts}
                  onChange={async e => {
                    const val = e.target.checked;
                    setPriceAlerts(val);
                    await authService.updateProfile({ notifications: { ...user.notifications, priceAlerts: val } });
                  }}
                  style={{ width: 18, height: 18, accentColor: 'var(--electric-cyan)' }}
                />
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: 0, color: '#ffffff' }}>
                    Günlük Piyasa Bülteni Özeti
                  </h4>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Her akşam seans kapanışında BIST 100 genel görünümü ve öne çıkan hisse hareketleri özeti.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={async e => {
                    const val = e.target.checked;
                    setDailyDigest(val);
                    await authService.updateProfile({ notifications: { ...user.notifications, dailyDigest: val } });
                  }}
                  style={{ width: 18, height: 18, accentColor: 'var(--electric-cyan)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer / Logout Zone */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Cloud Finance oturumunuzu kapatmak istediğinize emin misiniz?')) {
                authService.logout();
                if (onLogout) onLogout();
                onClose();
              }
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={15} />
            <span>Güvenli Çıkış Yap</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: 13, padding: '8px 18px' }}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
