import React, { useState, useEffect } from 'react';
import type { Stock, TimeHorizon, Candle, KAPNewsItem, AuthState } from '../types';
import { FinancialChart } from './FinancialChart';
import { kapService } from '../services/kapService';
import { stockService } from '../services/stockService';
import { authService } from '../services/authService';
import { ChevronLeft, Star, Newspaper } from 'lucide-react';

interface StockDetailViewProps {
  stock: Stock;
  onBack: () => void;
  selectedHorizon: TimeHorizon;
  onHorizonChange: (h: TimeHorizon) => void;
  onOpenReportModal: () => void;
  onOpenKapPanel: () => void;
  onOpenAuthModal?: () => void;
}

export const StockDetailView: React.FC<StockDetailViewProps> = ({
  stock,
  onBack,
  onOpenReportModal,
  onOpenAuthModal,
}) => {
  const [timeframe, setTimeframe] = useState<string>('1A');
  const [candles, setCandles] = useState<Candle[]>(stock.candles[timeframe] || []);
  const [stockKapNews, setStockKapNews] = useState<KAPNewsItem[]>(kapService.getNewsForStock(stock.code));
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

  useEffect(() => {
    let isCancelled = false;
    stockService.fetchCandlesForStock(stock.code, timeframe).then(fetchedCandles => {
      if (!isCancelled && fetchedCandles && fetchedCandles.length > 0) {
        setCandles(fetchedCandles);
      }
    });
    return () => { isCancelled = true; };
  }, [stock.code, timeframe]);

  useEffect(() => {
    let isSubscribed = true;
    setStockKapNews(kapService.getNewsForStock(stock.code));
    kapService.fetchNewsForStock(stock.code).then(fresh => {
      if (isSubscribed && fresh && fresh.length > 0) setStockKapNews(fresh);
    });
    return () => { isSubscribed = false; };
  }, [stock.code]);

  useEffect(() => {
    const unsub = authService.subscribeAuth(setAuthState);
    return unsub;
  }, []);

  const isStarred = Boolean(
    authState.user?.watchlist?.some(s => s.toUpperCase() === stock.code.toUpperCase())
  );

  const handleToggleStar = () => {
    if (!authState.isAuthenticated) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    authService.toggleWatchlist(stock.code);
  };

  const isPos = stock.changePercent >= 0;
  const color = isPos ? 'var(--brand-success)' : 'var(--brand-danger)';
  const sign = isPos ? '+' : '';

  const formatCurrency = (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const formatLargeNumber = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
    return val.toLocaleString('tr-TR');
  };

  const prevClose = Number((stock.price - stock.changeNominal).toFixed(2));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* 1. Header (Apple Stocks style) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              color: 'var(--brand-primary)',
              fontSize: 16,
              cursor: 'pointer',
              padding: 0
            }}
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <button
            onClick={handleToggleStar}
            style={{
              background: 'none',
              border: 'none',
              color: isStarred ? 'var(--brand-warning)' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Star size={22} fill={isStarred ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {stock.code}
          </h1>
          <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            {stock.name}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(stock.price)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color }}>
            {sign}{stock.changeNominal.toFixed(2)} ₺ ({sign}{stock.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* 2. Chart Area */}
      <div style={{ height: 350, margin: '0 -16px' }}>
        {/* We keep FinancialChart but wrap it to allow it full width on mobile */}
        <FinancialChart
          candles={candles}
          stockCode={stock.code}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
      </div>

      {/* 3. Stats Grid (Clean 2-column list) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Stats</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 24,
          rowGap: 16,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 16
        }}>
          <StatItem label="Open" value={prevClose.toFixed(2)} />
          <StatItem label="Vol" value={formatLargeNumber(stock.volume)} />
          <StatItem label="High" value={stock.high?.toFixed(2) || '-'} />
          <StatItem label="Mkt Cap" value={formatLargeNumber(stock.marketCap)} />
          <StatItem label="Low" value={stock.low?.toFixed(2) || '-'} />
          <StatItem label="P/E" value={stock.peRatio.toString()} />
        </div>
      </div>

      {/* AI Analysis Section (Clean Apple Style) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>AI Analysis</h2>
        
        <div 
          onClick={onOpenReportModal}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12, 
            padding: 20, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, background: 'var(--brand-primary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                fontWeight: 700, fontSize: 18
              }}>
                {stock.assistantScore}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {stock.scoreLabel}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Cloud Finance AI Score
                </div>
              </div>
            </div>
            <div style={{ color: 'var(--brand-primary)', fontSize: 14, fontWeight: 500 }}>
              View Report →
            </div>
          </div>
          
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {stock.whyAssistantThinks?.summary || 'Yapay zeka analiz raporunu detaylı görüntülemek için tıklayın.'}
          </p>
        </div>
      </div>

      {/* 4. News Section */}
      {stockKapNews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>News</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stockKapNews.slice(0, 5).map(news => (
              <div key={news.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                  <Newspaper size={14} />
                  <span>{news.companyName}</span>
                  <span>•</span>
                  <span>{news.timestamp}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {news.title}
                </h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {news.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ label, value }: { label: string, value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</span>
  </div>
);
