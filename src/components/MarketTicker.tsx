import React, { useEffect, useState } from 'react';
import type { MarketIndex } from '../types';
import { stockService } from '../services/stockService';

export const MarketTicker: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndex[]>(stockService.getMarketIndices());
  
  useEffect(() => {
    const unsubIndices = stockService.subscribeIndices(setIndices);
    return unsubIndices;
  }, []);

  return (
    <div
      style={{
        height: '40px',
        backgroundColor: 'var(--material-thick)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        padding: '0 16px',
        gap: 24,
        fontSize: 13,
        userSelect: 'none',
        scrollbarWidth: 'none',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingRight: 8, borderRight: '1px solid var(--border-subtle)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--brand-success)' }} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Markets Open</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {indices.map(idx => {
          const isPos = idx.changePercent >= 0;
          const bgBadgeColor = isPos ? 'var(--brand-success)' : 'var(--brand-danger)';
          const sign = isPos ? '+' : '';
          
          // Determine if we should flash the background based on recent tick
          const now = Date.now();
          const timeSinceTick = idx.lastTickTime ? now - idx.lastTickTime : 9999;
          const isTicking = timeSinceTick < 1000;
          let flashColor = 'transparent';
          if (isTicking) {
            flashColor = idx.tickDirection === 'up' ? 'rgba(48, 209, 88, 0.25)' : 'rgba(255, 69, 58, 0.25)';
          }

          return (
            <div 
              key={idx.code} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 8, 
                flexShrink: 0,
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: flashColor,
                transition: isTicking ? 'none' : 'background-color 1s ease-out'
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{idx.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-primary)' }}>
                {idx.value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#fff',
                  backgroundColor: bgBadgeColor,
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {sign}{idx.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
