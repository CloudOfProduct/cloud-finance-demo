import React, { useState } from 'react';
import type { KAPNewsItem } from '../types';
import { kapService } from '../services/kapService';
import {
  X,
  Newspaper,
  AlertTriangle,
  Tag,
  ShieldAlert,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';

interface KapNewsPanelProps {
  onClose: () => void;
  initialStockCode?: string;
}

export const KapNewsPanel: React.FC<KapNewsPanelProps> = ({ onClose, initialStockCode }) => {
  const [activeTab, setActiveTab] = useState<'official' | 'rumors'>('official');
  const [selectedSentiment, setSelectedSentiment] = useState<'Tümü' | 'Olumlu' | 'Nötr' | 'Olumsuz'>('Tümü');
  const [selectedStock, setSelectedStock] = useState<string>(initialStockCode || 'Tümü');
  const [activeModalNews, setActiveModalNews] = useState<KAPNewsItem | null>(null);
  const [expandedNewsIds, setExpandedNewsIds] = useState<Set<string>>(new Set());

  const toggleExpandNews = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNewsIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [newsList, setNewsList] = useState<KAPNewsItem[]>(kapService.getAllNews());
  const allRumors = kapService.getRumors();

  React.useEffect(() => {
    const unsub = kapService.subscribeNews(newNews => {
      setNewsList(newNews);
    });
    return unsub;
  }, []);

  // Stock codes list for filter
  const stockCodes = ['Tümü', ...Array.from(new Set(newsList.map(n => n.stockCode)))];

  const filteredNews = newsList.filter(n => {
    if (selectedStock !== 'Tümü' && n.stockCode !== selectedStock) return false;
    if (selectedSentiment !== 'Tümü' && n.sentiment !== selectedSentiment) return false;
    return true;
  });

  const getSentimentBadge = (sentiment: KAPNewsItem['sentiment']) => {
    switch (sentiment) {
      case 'Olumlu':
        return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Olumsuz':
        return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { color: '#FCD34D', bg: 'rgba(252, 211, 77, 0.12)', border: 'rgba(252, 211, 77, 0.3)' };
    }
  };

  const getImportanceBadge = (imp: KAPNewsItem['importance']) => {
    switch (imp) {
      case 'Kritik':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: 'Kritik Önem' };
      case 'Yüksek':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', text: 'Yüksek Önem' };
      default:
        return { color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.05)', text: 'Normal' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          width: '95%',
          maxWidth: '900px',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(16, 23, 42, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--electric-cyan)',
              }}
            >
              <Newspaper size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                KAP Bildirimleri & Haber Merkezi
              </h2>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Kamuyu Aydınlatma Platformu resmi akışı ve ayrıştırılmış piyasa duyumları
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers: Official vs Rumors */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(10, 15, 29, 0.6)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setActiveTab('official')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === 'official' ? '#ffffff' : 'var(--text-muted)',
                backgroundColor: activeTab === 'official' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                border: activeTab === 'official' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              }}
            >
              Resmi KAP Açıklamaları ({newsList.length})
            </button>

            <button
              onClick={() => setActiveTab('rumors')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === 'rumors' ? '#fcd34d' : 'var(--text-muted)',
                backgroundColor: activeTab === 'rumors' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                border: activeTab === 'rumors' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
              }}
            >
              <AlertTriangle size={13} color="#f59e0b" />
              <span>Teyitsiz Piyasa Söylentileri ({allRumors.length})</span>
            </button>
          </div>

          {/* Filters for Official Tab */}
          {activeTab === 'official' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Stock Filter */}
              <select
                value={selectedStock}
                onChange={e => setSelectedStock(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                  padding: '4px 8px',
                  outline: 'none',
                }}
              >
                {stockCodes.map(c => (
                  <option key={c} value={c} style={{ backgroundColor: '#0f172a' }}>
                    {c === 'Tümü' ? 'Tüm Hisseler' : c}
                  </option>
                ))}
              </select>

              {/* Sentiment Filter */}
              <div style={{ display: 'flex', gap: 4 }}>
                {(['Tümü', 'Olumlu', 'Nötr', 'Olumsuz'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSentiment(s)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: selectedSentiment === s ? '#ffffff' : 'var(--text-muted)',
                      backgroundColor: selectedSentiment === s ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeTab === 'official' ? (
            /* Official KAP Feed */
            filteredNews.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                Seçilen filtrelere uygun bildirim bulunamadı.
              </div>
            ) : (
              filteredNews.map(item => {
                const sBadge = getSentimentBadge(item.sentiment);
                const iBadge = getImportanceBadge(item.importance);

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveModalNews(item)}
                    className="glass-panel-interactive"
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: 'var(--electric-cyan)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {item.stockCode}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {item.companyName}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          • {item.timestamp}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            backgroundColor: iBadge.bg,
                            color: iBadge.color,
                          }}
                        >
                          {iBadge.text}
                        </span>

                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            backgroundColor: sBadge.bg,
                            border: `1px solid ${sBadge.border}`,
                            color: sBadge.color,
                          }}
                        >
                          {item.sentiment}
                        </span>
                      </div>
                    </div>

                    <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {item.title}
                    </h4>

                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {item.summary}
                    </p>

                    {/* Inline Expanded Full Content */}
                    {expandedNewsIds.has(item.id) && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          marginTop: 6,
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(0, 0, 0, 0.45)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          fontSize: 12.5,
                          color: '#e2e8f0',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--electric-cyan)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={13} />
                          KAP BİLDİRİMİ TAM VE RESMİ METNİ:
                        </div>
                        {item.fullContent || item.summary}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag size={12} /> {item.category}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={(e) => toggleExpandNews(item.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: 11,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {expandedNewsIds.has(item.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {expandedNewsIds.has(item.id) ? 'Gizle' : 'Ayrıntıyı Göster'}
                        </button>
                        <span style={{ fontSize: 11, color: 'var(--electric-cyan)', fontWeight: 600 }}>
                          Pencerede Aç →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* Rumors and Unverified Market Information Tab (Explicit Separation) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Mandatory Segregation Warning Banner */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <ShieldAlert size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>
                    DİKKAT: Doğrulanmamış Piyasa Bilgisi & Söylenti Alanı
                  </h4>
                  <p style={{ fontSize: 11.5, color: '#fecaca', lineHeight: 1.45, margin: 0 }}>
                    Bu bölümde yer alan veriler <b>Kamuyu Aydınlatma Platformu (KAP) veya ilgili şirketler tarafından onaylanmamış</b>, piyasa kanalları ve sosyal mecralarda dolaşan teyitsiz söylentilerden ibarettir. Kesin bilgi veya haber niteliği taşımaz. Yatırım kararlarında yalnızca doğrulanmış resmi verileri esas alınız.
                  </p>
                </div>
              </div>

              {allRumors.map(rumor => (
                <div
                  key={rumor.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(245, 158, 11, 0.03)',
                    border: '1px dashed rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {rumor.stockCode && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {rumor.stockCode}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Kaynak İddiası: {rumor.rumorSource} • {rumor.timestamp}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        letterSpacing: '0.02em',
                      }}
                    >
                      ⚠️ {rumor.verificationStatus}
                    </span>
                  </div>

                  <h4 style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    {rumor.title}
                  </h4>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {rumor.summary}
                  </p>

                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      fontSize: 11,
                      color: '#fcd34d',
                      fontStyle: 'italic',
                    }}
                  >
                    {rumor.warningNote}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for Full KAP News Content */}
        {activeModalNews && (
          <div
            className="modal-overlay-top"
            onClick={() => setActiveModalNews(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: 20,
            }}
          >
            <div
              className="modal-content"
              style={{
                width: '90%',
                maxWidth: '720px',
                maxHeight: '90vh',
                padding: '24px',
                gap: 16,
                backgroundColor: '#0b1120',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.2)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(56, 189, 248, 0.2)',
                      color: 'var(--electric-cyan)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {activeModalNews.stockCode}
                  </span>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      KAP Bildirim Detayı
                    </h3>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {activeModalNews.companyName}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalNews(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginBottom: 6, lineHeight: 1.4 }}>
                  {activeModalNews.title}
                </h3>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span>Yayın Zamanı: <b style={{ color: '#cbd5e1' }}>{activeModalNews.timestamp}</b></span>
                  <span>Kategori: <b style={{ color: '#38bdf8' }}>{activeModalNews.category}</b></span>
                  <span>Önem: <b style={{ color: activeModalNews.importance === 'Kritik' ? '#ef4444' : '#94a3b8' }}>{activeModalNews.importance}</b></span>
                  <span>Piyasa Etkisi: <b style={{ color: activeModalNews.sentiment === 'Olumlu' ? '#10b981' : activeModalNews.sentiment === 'Olumsuz' ? '#ef4444' : '#fcd34d' }}>{activeModalNews.sentiment}</b></span>
                </div>
              </div>

              {/* Summary Highlight Box */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: 13,
                  color: '#93c5fd',
                  lineHeight: 1.55,
                }}
              >
                <b style={{ color: '#ffffff' }}>Özet: </b>
                {activeModalNews.summary}
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 13.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  maxHeight: '360px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--electric-cyan)', marginBottom: 8, letterSpacing: '0.04em' }}>
                  RESMİ BİLDİRİM TAM METNİ
                </div>
                {activeModalNews.fullContent || activeModalNews.summary}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                <a
                  href={`https://www.kap.org.tr/tr/sirket-bilgileri/genel/${activeModalNews.stockCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'var(--electric-cyan)',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>KAP Resmi Sayfasında Görüntüle</span>
                </a>

                <button onClick={() => setActiveModalNews(null)} className="btn-primary" style={{ padding: '7px 20px', fontSize: 13 }}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
