import React, { useState, useRef } from 'react';
import { authService, AVATAR_PRESETS } from '../services/authService';
import { UserAvatar } from './UserAvatar';
import type { InvestorRiskProfile, TimeHorizon } from '../types';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  Camera,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regRiskTolerance, setRegRiskTolerance] = useState<InvestorRiskProfile>('Dengeli (Orta Risk)');
  const [regDefaultHorizon] = useState<TimeHorizon>('1m');
  const [regBio] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState('preset_cloud_lightning');
  const [regAgreed, setRegAgreed] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'presets' | 'custom'>('presets');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle image file upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Profil fotoğrafı 3MB\'dan küçük olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setRegAvatarUrl(dataUrl);
        setErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Lütfen kullanıcı adı / e-posta ve şifrenizi girin.');
      return;
    }

    setIsSubmitting(true);
    const result = await authService.login(loginIdentifier.trim(), loginPassword);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Giriş başarılı! Terminale yönlendiriliyorsunuz...');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.error || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regUsername.trim()) {
      setErrorMessage('Lütfen geçerli bir kullanıcı adı belirleyin.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMessage('Şifreniz en az 4 karakter olmalıdır.');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }
    if (!regAgreed) {
      setErrorMessage('Devam etmek için kullanım ve yatırım bilgilendirmesini onaylamalısınız.');
      return;
    }

    setIsSubmitting(true);
    const result = await authService.register({
      username: regUsername.trim(),
      fullName: regFullName.trim() || regUsername.trim(),
      email: regEmail.trim(),
      password: regPassword,
      avatarUrl: regAvatarUrl,
      riskTolerance: regRiskTolerance,
      defaultHorizon: regDefaultHorizon,
      bio: regBio.trim() || 'Cloud Finance BİST Yatırımcısı',
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Hesabınız başarıyla oluşturuldu! Hoş geldiniz.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 900);
    } else {
      setErrorMessage(result.error || 'Kayıt oluşturulamadı.');
    }
  };

  const handleQuickDemoLogin = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    const result = await authService.login('demo@cloudfinance.com', 'demo123');
    setIsSubmitting(false);
    if (result.success) {
      setSuccessMessage('Demo hesap ile giriş yapıldı!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 600);
    }
  };

  // Password strength evaluation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 9) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Zayıf', color: '#ef4444' };
    if (score <= 3) return { score: 2, label: 'Orta Düzey', color: '#f59e0b' };
    return { score: 3, label: 'Çok Güçlü', color: '#10b981' };
  };

  const passStrength = getPasswordStrength(regPassword);

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
          maxWidth: mode === 'register' ? 640 : 460,
          backgroundColor: 'rgba(10, 15, 29, 0.98)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.15)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header with Title and Mode Switcher */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)',
              }}
            >
              <Shield size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Cloud Finance Terminal
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {mode === 'login' ? 'Yatırımcı Giriş Portalı' : 'Kişisel Yatırımcı Hesabı Oluştur'}
              </span>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: mode === 'login' ? 'var(--electric-cyan)' : 'var(--text-muted)',
              backgroundColor: mode === 'login' ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: mode === 'login' ? '2px solid var(--electric-cyan)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: mode === 'register' ? 'var(--electric-cyan)' : 'var(--text-muted)',
              backgroundColor: mode === 'register' ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: mode === 'register' ? '2px solid var(--electric-cyan)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Yeni Hesap Oluştur
          </button>
        </div>

        {/* Form Body with Scroll */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* Error Message */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: 12.5,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#86efac',
                fontSize: 12.5,
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Identifier (Username or Email) */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Kullanıcı Adı veya E-posta
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="ornek@cloudfinance.com veya kullanıcı adı"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
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

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Şifre
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Şifreniz"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
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
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--electric-cyan)' }}
                  />
                  <span>Beni Hatırla</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: 14,
                  fontWeight: 700,
                  marginTop: 4,
                  justifyContent: 'center',
                }}
              >
                {isSubmitting ? 'Doğrulanıyor...' : 'Terminale Giriş Yap'}
              </button>

              {/* Quick Demo Login Option */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px dashed rgba(56, 189, 248, 0.35)',
                    color: 'var(--electric-cyan)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <Zap size={15} />
                  <span>Tek Tıkla Demo Hesabıyla Giriş Yap (Ahmet Yılmaz)</span>
                </button>
              </div>
            </form>
          ) : (
            /* MODE 2: REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Profile Avatar Selection Section */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <UserAvatar
                    avatarUrl={regAvatarUrl}
                    name={regFullName || 'Yeni Yatırımcı'}
                    size="lg"
                    borderGlow={true}
                  />
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#ffffff' }}>
                      Profil Fotoğrafı & Rozeti
                    </h3>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Hazır terminal rozetlerinden birini seçin veya bilgisayarınızdan kendi fotoğrafınızı yükleyin.
                    </p>
                  </div>
                </div>

                {/* Avatar Tab switch */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('presets')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: avatarTab === 'presets' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: avatarTab === 'presets' ? 'var(--electric-cyan)' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    Hazır Finans Rozetleri
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('custom')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: avatarTab === 'custom' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: avatarTab === 'custom' ? 'var(--electric-cyan)' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    Kendi Fotoğrafını Yükle
                  </button>
                </div>

                {avatarTab === 'presets' ? (
                  /* Presets Grid */
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {AVATAR_PRESETS.map(preset => {
                      const isSelected = regAvatarUrl === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setRegAvatarUrl(preset.id)}
                          style={{
                            padding: '8px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '2px solid var(--electric-cyan)' : '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: 22 }}>{preset.svgIcon}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? '#ffffff' : 'var(--text-muted)', textAlign: 'center' }}>
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Custom Upload & URL Input */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
                        style={{ fontSize: 12, padding: '7px 12px' }}
                      >
                        <Camera size={14} />
                        <span>Bilgisayardan Fotoğraf Seç</span>
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Maksimum 3MB (PNG, JPG, WEBP)</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Veya profil görseli linki yapıştırın (https://...)"
                        value={customImageUrl}
                        onChange={e => setCustomImageUrl(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 4,
                          color: '#ffffff',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customImageUrl.trim()) {
                            setRegAvatarUrl(customImageUrl.trim());
                          }
                        }}
                        className="btn-secondary"
                        style={{ fontSize: 11, padding: '6px 10px' }}
                      >
                        Uygula
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Details Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Ad Soyad
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      required
                      placeholder="Adınız ve Soyadınız"
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 34px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ffffff',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Kullanıcı Adı (Benzersiz)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="yatirimci_kodu"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 28px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ffffff',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  E-posta Adresi
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="ornek@alanadi.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px 9px 34px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: 12.5,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Şifre Oluştur
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="En az 4 karakter"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 34px 9px 34px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ffffff',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 2,
                      }}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {regPassword && (
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(passStrength.score / 3) * 100}%`,
                            backgroundColor: passStrength.color,
                            transition: 'all 0.3s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10, color: passStrength.color, fontWeight: 700 }}>
                        {passStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Şifre Tekrarı
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Şifreyi tekrar yazın"
                      value={regPasswordConfirm}
                      onChange={e => setRegPasswordConfirm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 34px 9px 34px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ffffff',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 2,
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Investment Risk Tolerance */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Yatırımcı Risk Tercihiniz
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {(['Temkinli (Düşük Risk)', 'Dengeli (Orta Risk)', 'Büyüme Odaklı (Yüksek Risk)'] as InvestorRiskProfile[]).map(risk => {
                    const isSelected = regRiskTolerance === risk;
                    return (
                      <button
                        key={risk}
                        type="button"
                        onClick={() => setRegRiskTolerance(risk)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid var(--electric-cyan)' : '1px solid var(--border-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        {risk}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legal Disclaimer & Confirmation */}
              <div
                style={{
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={regAgreed}
                    onChange={e => setRegAgreed(e.target.checked)}
                    style={{ marginTop: 2, accentColor: 'var(--electric-cyan)' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Cloud Finance platformunun <strong>Yatırım Tavsiyesi Değildir (YTD)</strong> ilkesini ve karar destek sistemi analiz şartlarını kabul ediyorum.
                  </span>
                </label>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: 14,
                  fontWeight: 700,
                  justifyContent: 'center',
                }}
              >
                {isSubmitting ? 'Hesap Oluşturuluyor...' : 'Hesabımı Oluştur & Giriş Yap'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
