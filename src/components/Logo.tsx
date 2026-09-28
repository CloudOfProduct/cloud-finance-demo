import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const s = iconSizes[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'lg' ? 12 : 8, userSelect: 'none' }}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cloudGrad" x1="4" y1="8" x2="30" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0a84ff" />
            <stop offset="1" stopColor="#30d158" />
          </linearGradient>
          <linearGradient id="boltGrad" x1="16" y1="12" x2="22" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#e5e5ea" />
          </linearGradient>
        </defs>

        {/* Minimalist Cloud Outline & Form */}
        <path
          d="M10 24C7.23858 24 5 21.7614 5 19C5 16.48 6.84 14.38 9.25 14.05C9.88 9.54 13.75 6 18.5 6C23.05 6 26.83 9.28 27.65 13.56C29.6 14.15 31 15.92 31 18C31 20.7614 28.7614 23 26 23H22"
          stroke="url(#cloudGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Minimalist Lightning Bolt */}
        <path
          d="M20 11L14.5 20H19.5L16 29L25.5 18H20.5L23 11H20Z"
          fill="url(#boltGrad)"
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                fontSize: size === 'lg' ? 24 : size === 'md' ? 18 : 15,
                fontWeight: 600,
                letterSpacing: '-0.5px',
                color: 'var(--text-primary)',
              }}
            >
              Cloud
            </span>
            <span
              style={{
                fontSize: size === 'lg' ? 24 : size === 'md' ? 18 : 15,
                fontWeight: 600,
                letterSpacing: '-0.5px',
                color: '#0a84ff',
              }}
            >
              Finance
            </span>
          </div>
          {size === 'lg' && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              BIST Araştırma & Karar Destek
            </span>
          )}
        </div>
      )}
    </div>
  );
};
