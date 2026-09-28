import React, { useState, useMemo, useEffect } from 'react';
import type { Stock, AuthState } from '../types';
import { authService } from '../services/authService';
import { Star, Search } from 'lucide-react';

interface StockListProps {
  stocks: Stock[];
  selectedStockCode: string;
  onSelectStock: (stock: Stock) => void;
  onOpenAuthModal?: () => void;
}

export const StockList: React.FC<StockListProps> = ({
  stocks,
  selectedStockCode,
  onSelectStock,
  onOpenAuthModal,
}) => {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<'all' | 'gainers' | 'losers' | 'alpha'>('all');

  useEffect(() => {
    const unsub = authService.subscribeAuth(state => setAuthState(state));
    return unsub;
  }, []);

  const watchlistSet = useMemo(() => {
    return new Set((authState.user?.watchlist || []).map(s => s.toUpperCase()));
  }, [authState.user?.watchlist]);

  const handleToggleStar = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (!authState.isAuthenticated) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    authService.toggleWatchlist(code);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filteredStocks = useMemo(() => {
    let list = [...stocks];
    
    // Sort logic
    if (sortType === 'gainers') {
      list.sort((a, b) => b.changePercent - a.changePercent);
    } else if (sortType === 'losers') {
      list.sort((a, b) => a.changePercent - b.changePercent);
    } else if (sortType === 'alpha') {
      list.sort((a, b) => a.code.localeCompare(b.code));
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    return list;
  }, [stocks, searchQuery, sortType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* iOS 18 Style Floating Search Bubble */}
      <div style={{ position: 'relative', margin: '16px 16px 8px 16px', zIndex: 10 }}>
        <Search size={22} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
        <input
          type="text"
          placeholder="Hisse veya Şirket Ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '16px 20px 16px 52px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '30px',
            color: '#ffffff',
            fontSize: '17px',
            fontWeight: 500,
            outline: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
          }}
        />
      </div>

      {/* Sort / Filter Pills */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
        <button
          onClick={() => setSortType('all')}
          style={{
            padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            backgroundColor: sortType === 'all' ? 'var(--brand-primary)' : 'rgba(255,255,255,0.1)',
            color: sortType === 'all' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          Tümü
        </button>
        <button
          onClick={() => setSortType('gainers')}
          style={{
            padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            backgroundColor: sortType === 'gainers' ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255,255,255,0.1)',
            color: sortType === 'gainers' ? '#30d158' : 'var(--text-secondary)',
            border: sortType === 'gainers' ? '1px solid rgba(48, 209, 88, 0.5)' : '1px solid transparent'
          }}
        >
          🚀 En Çok Yükselenler
        </button>
        <button
          onClick={() => setSortType('losers')}
          style={{
            padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            backgroundColor: sortType === 'losers' ? 'rgba(255, 69, 58, 0.2)' : 'rgba(255,255,255,0.1)',
            color: sortType === 'losers' ? '#ff453a' : 'var(--text-secondary)',
            border: sortType === 'losers' ? '1px solid rgba(255, 69, 58, 0.5)' : '1px solid transparent'
          }}
        >
          🔻 En Çok Düşenler
        </button>
        <button
          onClick={() => setSortType('alpha')}
          style={{
            padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            backgroundColor: sortType === 'alpha' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255,255,255,0.1)',
            color: sortType === 'alpha' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          A-Z Sırala
        </button>
      </div>

      {/* Individual Glass Cards Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '0 16px', paddingBottom: 24 }}>
        {filteredStocks.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No results found.
          </div>
        ) : (
          filteredStocks.map((stock) => {
            const isSelected = stock.code === selectedStockCode;
            const isPos = stock.changePercent >= 0;
            const isStarred = watchlistSet.has(stock.code.toUpperCase());

            return (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(20, 20, 22, 0.45)',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                  border: isSelected ? '1px solid rgba(10, 132, 255, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(20, 20, 22, 0.6)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(20, 20, 22, 0.45)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                {/* Left Side: Symbol and Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={(e) => handleToggleStar(e, stock.code)}
                    style={{ background: 'none', border: 'none', padding: 0, color: isStarred ? 'var(--brand-warning)' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.color = isStarred ? 'var(--brand-warning)' : 'rgba(255,255,255,0.6)'}
                    onMouseOut={(e) => e.currentTarget.style.color = isStarred ? 'var(--brand-warning)' : 'rgba(255,255,255,0.3)'}
                  >
                    <Star size={22} fill={isStarred ? 'currentColor' : 'none'} />
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{stock.code}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</span>
                  </div>
                </div>

                {/* Right Side: Price, AI Score, and Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(10, 132, 255, 0.15)', border: '1px solid rgba(10,132,255,0.3)', padding: '4px 8px', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0a84ff' }}>AI</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{stock.assistantScore}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 70 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(stock.price)}
                    </span>
                  </div>
                  
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isPos ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                      border: `1px solid ${isPos ? 'rgba(48, 209, 88, 0.4)' : 'rgba(255, 69, 58, 0.4)'}`,
                      color: isPos ? '#30d158' : '#ff453a',
                      borderRadius: 8,
                      padding: '8px 10px',
                      minWidth: 80,
                      fontWeight: 700,
                      fontSize: 15,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
