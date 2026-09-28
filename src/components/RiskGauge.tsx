import React from 'react';
import type { RiskFactor, RiskLevel } from '../types';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RiskGaugeProps {
  score: number; // 0 - 100
  level: RiskLevel;
  factors: RiskFactor[];
  summaryBullets: string[];
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  level,
  factors,
  summaryBullets,
}) => {
  // Convert score (0 - 100) to needle rotation degrees (-90 to +90)
  const clampedScore = Math.max(0, Math.min(100, score));
  const needleAngle = -90 + (clampedScore / 100) * 180;

  const getThemeColor = () => {
    if (clampedScore <= 35) return '#10B981';
    if (clampedScore <= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getRiskIcon = () => {
    if (clampedScore <= 35) return <ShieldCheck size={18} color="#10B981" />;
    if (clampedScore <= 70) return <AlertTriangle size={18} color="#F59E0B" />;
    return <ShieldAlert size={18} color="#EF4444" />;
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Title & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getRiskIcon()}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Risk Ölçer & Güvenlik Göstergesi
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              7 faktörlü stres ve volatilite modeli
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 9999,
            backgroundColor: `${getThemeColor()}20`,
            border: `1px solid ${getThemeColor()}50`,
            color: getThemeColor(),
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          <span>{level} Risk</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>({score}/100)</span>
        </div>
      </div>

      {/* Speedometer Gauge Graphic */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          padding: '10px 0 0 0',
        }}
      >
        <svg
          width="260"
          height="140"
          viewBox="0 0 260 140"
          style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
        >
          <defs>
            {/* Gradients for arcs */}
            <linearGradient id="gaugeGreen" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="gaugeYellow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
            <linearGradient id="gaugeRed" x1="50%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <radialGradient id="needleCenter" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>

          {/* Background Dark Arc (Outer track) */}
          <path
            d="M 25 125 A 105 105 0 0 1 235 125"
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Green Zone: 0 - 35 (Angle: 0 to 63 deg from left) */}
          <path
            d="M 25 125 A 105 105 0 0 1 88.5 38.5"
            fill="none"
            stroke="url(#gaugeGreen)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity={clampedScore <= 35 ? 1 : 0.45}
          />

          {/* Yellow Zone: 35 - 70 (Angle: 63 to 126 deg) */}
          <path
            d="M 94 34.5 A 105 105 0 0 1 166 34.5"
            fill="none"
            stroke="url(#gaugeYellow)"
            strokeWidth="12"
            opacity={clampedScore > 35 && clampedScore <= 70 ? 1 : 0.45}
          />

          {/* Red Zone: 70 - 100 (Angle: 126 to 180 deg) */}
          <path
            d="M 171.5 38.5 A 105 105 0 0 1 235 125"
            fill="none"
            stroke="url(#gaugeRed)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity={clampedScore > 70 ? 1 : 0.45}
          />

          {/* Ticks and Zone Labels */}
          <text x="32" y="138" fill="#10B981" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">
            0 DÜŞÜK
          </text>
          <text x="130" y="24" fill="#F59E0B" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="var(--font-mono)">
            50 ORTA
          </text>
          <text x="228" y="138" fill="#EF4444" fontSize="10" fontWeight="600" textAnchor="end" fontFamily="var(--font-mono)">
            100 YÜKSEK
          </text>

          {/* Gauge Needle (Center at 130, 125) */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: '130px 125px',
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Needle shaft */}
            <polygon
              points="127,125 130,28 133,125"
              fill={getThemeColor()}
              style={{ filter: `drop-shadow(0 0 6px ${getThemeColor()}90)` }}
            />
            <circle cx="130" cy="28" r="3" fill="#ffffff" />
          </g>

          {/* Center Hub Nut */}
          <circle cx="130" cy="125" r="10" fill="url(#needleCenter)" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="130" cy="125" r="3" fill="#0f172a" />
        </svg>

        {/* Current Score Display */}
        <div style={{ marginTop: -14, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: getThemeColor(),
              letterSpacing: '-0.02em',
              textShadow: `0 0 15px ${getThemeColor()}60`,
            }}
          >
            {score}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            Genel Risk Puanı
          </div>
        </div>
      </div>

      {/* 7 Risk Breakdown Meters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
          Risk Faktörleri Ağırlık Dağılımı:
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8,
          }}
        >
          {factors.map(f => {
            const fColor = f.score <= 35 ? '#10B981' : f.score <= 70 ? '#F59E0B' : '#EF4444';
            return (
              <div
                key={f.factor}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.factor}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: fColor, fontWeight: 700 }}>
                    {f.score}
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 9999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${f.score}%`,
                      backgroundColor: fColor,
                      borderRadius: 9999,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.3 }}>
                  {f.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Rationale Bullet Points */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          İbre Neden Bu Seviyede? (Gerekçeler):
        </span>
        <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {summaryBullets.map((bullet, idx) => (
            <li
              key={idx}
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
