import React from 'react';
import { AVATAR_PRESETS } from '../services/authService';

interface UserAvatarProps {
  avatarUrl?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  customSize?: number;
  showStatus?: boolean;
  statusColor?: string;
  borderGlow?: boolean;
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl = 'preset_cloud_lightning',
  name = 'Kullanıcı',
  size = 'md',
  customSize,
  showStatus = false,
  statusColor = '#10b981',
  borderGlow = true,
}) => {
  const pixelSize = customSize || SIZE_MAP[size];
  const isImage = avatarUrl?.startsWith('data:') || avatarUrl?.startsWith('http') || avatarUrl?.startsWith('/');
  const preset = AVATAR_PRESETS.find(p => p.id === avatarUrl) || AVATAR_PRESETS[0];

  const fontSize = Math.max(12, Math.round(pixelSize * 0.44));

  return (
    <div
      style={{
        position: 'relative',
        width: pixelSize,
        height: pixelSize,
        flexShrink: 0,
        borderRadius: '50%',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isImage ? '#1e293b' : preset.bgGradient,
          border: `2px solid ${preset.borderColor || '#38bdf8'}`,
          boxShadow: borderGlow ? `0 0 ${Math.round(pixelSize * 0.25)}px rgba(56, 189, 248, 0.35)` : 'none',
          userSelect: 'none',
        }}
      >
        {isImage ? (
          <img
            src={avatarUrl}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={e => {
              // Fallback to initial
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span style={{ fontSize, lineHeight: 1 }}>{preset.svgIcon}</span>
        )}
      </div>

      {showStatus && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: Math.max(8, Math.round(pixelSize * 0.25)),
            height: Math.max(8, Math.round(pixelSize * 0.25)),
            borderRadius: '50%',
            backgroundColor: statusColor,
            border: '2px solid #0a0f1d',
            boxShadow: `0 0 6px ${statusColor}`,
          }}
        />
      )}
    </div>
  );
};
