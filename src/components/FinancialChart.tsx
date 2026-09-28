import React, { useRef, useEffect, useState } from 'react';
import type { Candle } from '../types';

interface FinancialChartProps {
  candles: Candle[];
  stockCode: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

const TIMEFRAMES = ['1G', '1H', '1A', '3A', '6A', '1Y', '5Y'];

export const FinancialChart: React.FC<FinancialChartProps> = ({
  candles,
  timeframe,
  onTimeframeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const isPositive = candles.length > 1 && candles[candles.length - 1].close >= candles[0].close;
  const themeColor = isPositive ? '#34C759' : '#FF3B30'; // iOS Green and Red
  const gradientStart = isPositive ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)';

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || candles.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const padding = { top: 20, right: 0, bottom: 20, left: 0 };
      const chartW = width;
      const chartH = height - padding.top - padding.bottom;

      let minP = Infinity;
      let maxP = -Infinity;
      candles.forEach(c => {
        if (c.close < minP) minP = c.close;
        if (c.close > maxP) maxP = c.close;
      });

      const range = maxP - minP || 1;
      minP -= range * 0.1;
      maxP += range * 0.1;
      const newRange = maxP - minP;

      const getX = (i: number) => (i / (candles.length - 1)) * chartW;
      const getY = (val: number) => padding.top + (1 - (val - minP) / newRange) * chartH;

      ctx.beginPath();
      candles.forEach((c, i) => {
        const x = getX(i);
        const y = getY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.lineTo(chartW, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height);
      gradient.addColorStop(0, gradientStart);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fill();

      if (hoverIndex !== null && candles[hoverIndex]) {
        const x = getX(hoverIndex);
        const y = getY(candles[hoverIndex].close);

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = themeColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    handleResize();

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [candles, hoverIndex, themeColor, gradientStart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || candles.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.round((x / rect.width) * (candles.length - 1));
    setHoverIndex(Math.max(0, Math.min(index, candles.length - 1)));
  };

  const handleMouseLeave = () => setHoverIndex(null);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Timeframes */}
      <div style={{ display: 'flex', gap: 16, padding: '0 16px 16px 16px' }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 600,
              color: timeframe === tf ? '#fff' : 'var(--text-secondary)',
              backgroundColor: timeframe === tf ? 'rgba(255,255,255,0.1)' : 'transparent',
              cursor: 'pointer'
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Hover Info (if any) */}
      <div style={{ height: 24, padding: '0 16px', display: 'flex', justifyContent: 'center' }}>
        {hoverIndex !== null && candles[hoverIndex] && (
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {candles[hoverIndex].time} — <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₺{candles[hoverIndex].close.toFixed(2)}</span>
          </span>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
};
