import React from 'react';

interface SpeedometerProps {
  label: string;
  score: number; // 0 to 100
}

export const Speedometer: React.FC<SpeedometerProps> = ({ label, score }) => {
  // Map score (0-100) to an angle (-90 to 90 degrees)
  const angle = (score / 100) * 180 - 90;

  // Colors: 0-35 Sell (Red), 36-65 Hold (Yellow), 66-100 Buy (Green)
  let statusColor = '#34d399'; // Default Green (Buy)
  let statusText = 'GÜÇLÜ AL';
  if (score < 20) { statusColor = '#ef4444'; statusText = 'GÜÇLÜ SAT'; }
  else if (score < 40) { statusColor = '#f87171'; statusText = 'SAT'; }
  else if (score < 60) { statusColor = '#fbbf24'; statusText = 'TUT'; }
  else if (score < 80) { statusColor = '#6ee7b7'; statusText = 'AL'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ position: 'relative', width: '120px', height: '60px', overflow: 'hidden' }}>
        {/* SVG Speedometer Background Arc */}
        <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%' }}>
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Active Arc (Colored) */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={statusColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="125.6" // approx Math.PI * 40
            strokeDashoffset={125.6 - (125.6 * (score / 100))}
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease-out' }}
          />
        </svg>

        {/* Needle */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          width: 2,
          height: 45,
          backgroundColor: '#fff',
          transformOrigin: 'bottom center',
          transform: `rotate(${angle}deg)`,
          transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 2,
          borderRadius: 2
        }}>
          {/* Needle Center Circle */}
          <div style={{
            position: 'absolute',
            bottom: -3,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#fff',
            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
          }} />
        </div>
      </div>
      
      {/* Values */}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: statusColor, marginTop: 2 }}>
          %{score.toFixed(0)}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: statusColor, opacity: 0.9, letterSpacing: 0.5 }}>
          {statusText}
        </div>
      </div>
    </div>
  );
};
