import React, { useEffect, useState, useRef } from 'react';
import { Logo } from './Logo';
import { authService } from '../services/authService';
import { UserAvatar } from './UserAvatar';
import type { AuthState } from '../types';
import {
  Settings,
  Star,
  LogOut,
  ChevronDown,
  Newspaper
} from 'lucide-react';

interface HeaderProps {
  onOpenKapPanel: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenAccountSettings: () => void;
  onFilterWatchlist?: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenKapPanel,
  onOpenAuthModal,
  onOpenAccountSettings,
  onFilterWatchlist,
  onLogoClick,
}) => {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = authService.subscribeAuth(state => {
      setAuthState(state);
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubAuth();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const user = authState.user;

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--material-thick)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: App Logo */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={onLogoClick}
      >
        <Logo size="md" showText={true} />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onOpenKapPanel}
          className="btn-icon"
          title="News"
        >
          <Newspaper size={18} />
        </button>

        {/* USER PROFILE & AUTHENTICATION SECTION */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          {authState.isAuthenticated && user ? (
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <UserAvatar
                avatarUrl={user.avatarUrl}
                name={user.fullName}
                size="sm"
                showStatus={false}
              />
              <ChevronDown size={14} style={{ color: 'var(--text-secondary)', marginRight: 4 }} />
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthModal('login')}
              className="btn-secondary"
              style={{ fontSize: 13, padding: '8px 16px' }}
            >
              Sign In
            </button>
          )}

          {/* User Dropdown Menu Card */}
          {isUserMenuOpen && user && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 240,
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user.fullName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
              </div>

              <button
                onClick={() => { setIsUserMenuOpen(false); onOpenAccountSettings(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)', textAlign: 'left', fontSize: 14
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings size={16} /> Account Settings
              </button>

              {onFilterWatchlist && (
                <button
                  onClick={() => { setIsUserMenuOpen(false); onFilterWatchlist(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)', textAlign: 'left', fontSize: 14
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Star size={16} /> Watchlist
                </button>
              )}

              <button
                onClick={() => { setIsUserMenuOpen(false); authService.logout(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)', textAlign: 'left', fontSize: 14, color: 'var(--brand-danger)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,69,58,0.1)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
