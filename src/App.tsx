import React, { useState, useEffect, useMemo } from 'react';
import type { Stock, AuthState } from './types';
import { stockService } from './services/stockService';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { MarketTicker } from './components/MarketTicker';
import { StockList } from './components/StockList';
import { StockDetailView } from './components/StockDetailView';
import { KapNewsPanel } from './components/KapNewsPanel';
import { ResearchReportModal } from './components/ResearchReportModal';
import { LoginGate } from './components/LoginGate';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AuthModal } from './components/AuthModal';
import { authService } from './services/authService';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>(stockService.getStocks());
  const [selectedStock, setSelectedStock] = useState<Stock>(stocks[0]);
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication & Settings Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isWatchlistOnly, setIsWatchlistOnly] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

  // Other Modals
  const [isKapPanelOpen, setIsKapPanelOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const unsubAuth = authService.subscribeAuth(setAuthState);
    return unsubAuth;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isKapPanelOpen) setIsKapPanelOpen(false);
        else if (isReportModalOpen) setIsReportModalOpen(false);
        else if (activeView === 'detail') setActiveView('list');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKapPanelOpen, isReportModalOpen, activeView]);

  // Subscribe to simulated live BIST data feed
  useEffect(() => {
    const unsub = stockService.subscribeStocks((updatedStocks) => {
      setStocks(updatedStocks);
      setSelectedStock(prev => {
        const found = updatedStocks.find(s => s.code === prev.code);
        return found || prev;
      });
    });
    return unsub;
  }, []);

  const filteredStocks = useMemo(() => {
    let list = stocks;
    if (isWatchlistOnly && authState.user?.watchlist) {
      const set = new Set(authState.user.watchlist.map(s => s.toUpperCase()));
      list = list.filter(stock => set.has(stock.code.toUpperCase()));
    }
    return list;
  }, [stocks, isWatchlistOnly, authState.user?.watchlist]);

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setActiveView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setActiveView('list');
  };

  if (authState.isLoading) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }} />;
  }

  return (
    <>
      {/* Robust Video Background + CSS Fallback */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(to bottom, #0a0b12 0%, #171822 100%)' }}>
        <div className="css-lightning" />
        
        {/* Dynamic Video Element */}
        {(() => {
          const videoSrc = new Date().getHours() >= 6 && new Date().getHours() < 18 ? "/clouds.mp4" : "/storm.mp4";
          return (
            <video 
              key={videoSrc}
              src={videoSrc}
              autoPlay 
              loop 
              muted 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, position: 'absolute', inset: 0 }}
            />
          );
        })()}
      </div>
        
        {/* Animated Background Elements */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '10%', left: '20%', width: '40vw', height: '40vw',
            background: 'radial-gradient(circle, rgba(10,132,255,0.15) 0%, rgba(0,0,0,0) 70%)',
            animation: 'floatAnim1 15s infinite ease-in-out',
            filter: 'blur(40px)'
          }} />
          <div style={{
            position: 'absolute', top: '40%', right: '10%', width: '35vw', height: '35vw',
            background: 'radial-gradient(circle, rgba(48,209,88,0.1) 0%, rgba(0,0,0,0) 70%)',
            animation: 'floatAnim2 20s infinite ease-in-out reverse',
            filter: 'blur(40px)'
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '40%', width: '50vw', height: '50vw',
            background: 'radial-gradient(circle, rgba(10,132,255,0.1) 0%, rgba(0,0,0,0) 70%)',
            animation: 'floatAnim3 25s infinite ease-in-out',
            filter: 'blur(40px)'
          }} />
        </div>


      {!authState.isAuthenticated ? (
        <LoginGate onAuthenticated={() => {}} />
      ) : (
        <>
          {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header
          onOpenKapPanel={() => setIsKapPanelOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAuthModal={mode => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
          onFilterWatchlist={() => {
            if (!authState.isAuthenticated) {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            } else {
              setIsWatchlistOnly(prev => !prev);
              setActiveView('list');
            }
          }}
        />

        <MarketTicker />

        <main
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 800, // Mobile-first width focus
            margin: '0 auto',
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeView === 'list' ? (
            <StockList
              stocks={filteredStocks}
              selectedStockCode={selectedStock?.code || ''}
              onSelectStock={handleSelectStock}
              onOpenAuthModal={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
            />
          ) : (
            <StockDetailView
              stock={selectedStock}
              onBack={handleBackToList}
              selectedHorizon="1m"
              onHorizonChange={() => {}}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onOpenKapPanel={() => setIsKapPanelOpen(true)}
              onOpenAuthModal={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {isKapPanelOpen && (
        <KapNewsPanel
          onClose={() => setIsKapPanelOpen(false)}
          initialStockCode={selectedStock?.code}
        />
      )}

      {isReportModalOpen && selectedStock && (
        <ResearchReportModal
          stock={selectedStock}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      <AccountSettingsModal
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
        </>
      )}
    </>
  );
};

export default App;
