import React, { useState, useRef } from 'react';
import { authService, AVATAR_PRESETS } from '../services/authService';
import { UserAvatar } from './UserAvatar';
import { Logo } from './Logo';
import type { InvestorRiskProfile } from '../types';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

interface LoginGateProps {
  onAuthenticated: () => void;
}

type Step = 'landing' | 'login' | 'register' | 'register_avatar';

export const LoginGate: React.FC<LoginGateProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<Step>('landing');

  // Login state
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPass, setRegPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<any>(AVATAR_PRESETS[0]);
  const [riskProfile, setRiskProfile] = useState<InvestorRiskProfile>('Büyüme Odaklı (Yüksek Risk)');
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    const result = await authService.login(loginId, loginPass);
    setLoginSubmitting(false);
    if (result.success) {
      onAuthenticated();
    } else {
      setLoginError(result.error || 'Giriş başarısız.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSubmitting(true);
    const result = await authService.register({
      email: regEmail,
      username: regUsername,
      password: regPass,
      avatarUrl,
      riskTolerance: riskProfile,
      defaultHorizon: '1y',
    } as any);
    setRegSubmitting(false);
    if (result.success) {
      onAuthenticated();
    } else {
      setRegError(result.error || 'Kayıt başarısız.');
    }
  };

  const handleDemoLogin = async () => {
    setLoginSubmitting(true);
    const result = await authService.login('demo@cloudfinance.com', 'demo123');
    setLoginSubmitting(false);
    if (result.success) onAuthenticated();
    else setLoginError('Demo hesaba giriş yapılamadı.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya boyutu 2MB dan küçük olmalıdır.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      if (url) setAvatarUrl(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Decorative Orbs inside the container for ultra-modern sci-fi effect */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '10%', left: '20%', width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(10,132,255,0.15) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(60px)', animation: 'floatOrb 10s infinite ease-in-out alternate'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '20%', width: '35vw', height: '35vw',
          background: 'radial-gradient(circle, rgba(94,92,230,0.15) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(60px)', animation: 'floatOrb 12s infinite ease-in-out alternate-reverse'
        }} />
      </div>

      <style>
        {`
          @keyframes floatOrb {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(30px, -50px) scale(1.1); }
          }
          @keyframes glowPulse {
            0% { box-shadow: 0 0 20px rgba(10,132,255,0.4), inset 0 0 10px rgba(10,132,255,0.2); }
            50% { box-shadow: 0 0 40px rgba(10,132,255,0.8), inset 0 0 20px rgba(10,132,255,0.4); }
            100% { box-shadow: 0 0 20px rgba(10,132,255,0.4), inset 0 0 10px rgba(10,132,255,0.2); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fancy-input {
            width: 100%;
            padding: 16px 20px;
            background: rgba(10, 15, 30, 0.6);
            border: 1px solid rgba(10, 132, 255, 0.3);
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            outline: none;
            transition: all 0.3s ease;
          }
          .fancy-input:focus {
            border-color: #0a84ff;
            background: rgba(10, 15, 30, 0.8);
            box-shadow: 0 0 15px rgba(10, 132, 255, 0.3);
          }
          .fancy-btn-primary {
            background: linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%);
            color: #fff;
            border: none;
            padding: 18px;
            border-radius: 14px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 10px 30px rgba(10, 132, 255, 0.4);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .fancy-btn-primary::after {
            content: '';
            position: absolute;
            top: -50%; left: -50%; width: 200%; height: 200%;
            background: linear-gradient(rgba(255,255,255,0.2), transparent, transparent);
            transform: rotate(45deg);
            transition: all 0.3s ease;
          }
          .fancy-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(10, 132, 255, 0.6);
          }
          .fancy-btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 18px;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }
          .fancy-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
        `}
      </style>

      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', zIndex: 1 }}>
        
        <div 
          className="login-gate-card"
          style={{ 
            width: '100%', 
            maxWidth: 500, 
            background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.8) 0%, rgba(10, 10, 15, 0.9) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderRadius: 30, 
            border: '1px solid rgba(10, 132, 255, 0.3)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(10,132,255,0.15)',
            animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle glowing top edge */}
          <div style={{ position: 'absolute', top: 0, left: '10%', width: '80%', height: 2, background: 'linear-gradient(90deg, transparent, #0a84ff, transparent)', filter: 'blur(2px)' }} />

          {step === 'landing' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ animation: 'glowPulse 3s infinite', borderRadius: '50%', padding: 10 }}>
                  <Logo size="xl" showText={false} />
                </div>
              </div>
              <h1 style={{ 
                fontSize: 42, 
                fontWeight: 900, 
                background: 'linear-gradient(to right, #fff, #a0c4ff)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                marginBottom: 16,
                letterSpacing: '-1px'
              }}>
                CLOUD FINANCE
              </h1>
              <p style={{ fontSize: 18, color: '#8e8e93', marginBottom: 40, lineHeight: 1.5 }}>
                Yeni Nesil Finansal Zeka.<br/>Yapay Zeka Destekli Borsa Platformu.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <button onClick={() => setStep('login')} className="fancy-btn-primary">
                  Sisteme Giriş Yap
                </button>
                <button onClick={() => setStep('register')} className="fancy-btn-secondary">
                  Yeni Hesap Oluştur
                </button>
              </div>
              
              <div style={{ marginTop: 40 }}>
                <button 
                  onClick={handleDemoLogin} 
                  disabled={loginSubmitting} 
                  style={{ 
                    fontSize: 15, color: '#0a84ff', background: 'none', border: 'none', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                    textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700
                  }}
                >
                  <Sparkles size={18} /> Sistemi Demo Olarak Keşfet
                </button>
              </div>
            </div>
          )}

          {step === 'login' && (
            <div style={{ animation: 'slideUp 0.4s ease-out' }}>
              <button onClick={() => setStep('landing')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0a84ff', marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
                <ChevronLeft size={20} /> Geri Dön
              </button>
              
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 32 }}>Hoş Geldiniz</h2>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <input
                    type="text"
                    className="fancy-input"
                    placeholder="E-posta veya Kullanıcı Adı"
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    className="fancy-input"
                    placeholder="Şifre"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer' }}
                  >
                    {showLoginPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {loginError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff453a', background: 'rgba(255,69,58,0.1)', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
                    <AlertCircle size={18} /> {loginError}
                  </div>
                )}

                <button type="submit" disabled={loginSubmitting} className="fancy-btn-primary" style={{ marginTop: 10 }}>
                  {loginSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>
            </div>
          )}

          {step === 'register' && (
            <div style={{ animation: 'slideUp 0.4s ease-out' }}>
              <button onClick={() => setStep('landing')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0a84ff', marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
                <ChevronLeft size={20} /> Geri Dön
              </button>
              
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 32 }}>Kayıt Ol</h2>

              <form onSubmit={(e) => { e.preventDefault(); setStep('register_avatar'); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <input
                  type="email"
                  className="fancy-input"
                  placeholder="E-posta Adresi"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="fancy-input"
                  placeholder="Kullanıcı Adı"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  required
                />
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    className="fancy-input"
                    placeholder="Şifre"
                    value={regPass}
                    onChange={e => setRegPass(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer' }}
                  >
                    {showRegPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <button type="submit" className="fancy-btn-primary" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Devam Et <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </form>
            </div>
          )}

          {step === 'register_avatar' && (
            <div style={{ animation: 'slideUp 0.4s ease-out' }}>
              <button onClick={() => setStep('register')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0a84ff', marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
                <ChevronLeft size={20} /> Geri Dön
              </button>
              
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Profilini Kişiselleştir</h2>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <div style={{ position: 'relative' }}>
                  <UserAvatar avatarUrl={avatarUrl} customSize={100} />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ position: 'absolute', bottom: 0, right: 0, background: '#0a84ff', border: 'none', width: 36, height: 36, borderRadius: 18, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                  >
                    +
                  </button>
                  <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </div>
                
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '10px 0', width: '100%', justifyContent: 'center' }}>
                  {AVATAR_PRESETS.map((preset, i) => (
                    <img 
                      key={i} 
                      src={preset as unknown as string} 
                      alt="Preset" 
                      onClick={() => setAvatarUrl(preset)}
                      style={{ 
                        width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', objectFit: 'cover',
                        border: avatarUrl === preset ? '3px solid #0a84ff' : '1px solid rgba(255,255,255,0.2)',
                        transition: 'transform 0.2s',
                        transform: avatarUrl === preset ? 'scale(1.1)' : 'scale(1)'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', marginBottom: 12, color: '#fff', fontWeight: 600 }}>Risk Profilin</label>
                <select 
                  value={riskProfile} 
                  onChange={e => setRiskProfile(e.target.value as InvestorRiskProfile)}
                  className="fancy-input"
                  style={{ appearance: 'none' }}
                >
                  <option value="Temkinli (Düşük Risk)" style={{ color: '#000' }}>Muhafazakar (Düşük Risk)</option>
                  <option value="Dengeli (Orta Risk)" style={{ color: '#000' }}>Dengeli (Orta Risk)</option>
                  <option value="Büyüme Odaklı (Yüksek Risk)" style={{ color: '#000' }}>Büyüme (Yüksek Risk)</option>
                </select>
              </div>

              {regError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff453a', background: 'rgba(255,69,58,0.1)', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
                  <AlertCircle size={18} /> {regError}
                </div>
              )}

              <button onClick={handleRegister} disabled={regSubmitting} className="fancy-btn-primary" style={{ width: '100%' }}>
                {regSubmitting ? 'Hesap Oluşturuluyor...' : 'Hesabı Tamamla'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
