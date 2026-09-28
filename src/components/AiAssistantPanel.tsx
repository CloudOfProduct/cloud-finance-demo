import React, { useState } from 'react';
import type { Stock, TimeHorizon } from '../types';
import { HORIZONS, SCORE_METRICS, getScoreCategory, LEGAL_DISCLAIMER } from '../services/aiService';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  FileText,
  Database,
  Info,
} from 'lucide-react';

interface AiAssistantPanelProps {
  stock: Stock;
  activeHorizon: TimeHorizon;
  onHorizonChange: (h: TimeHorizon) => void;
  onOpenReportModal: () => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  stock,
  activeHorizon,
  onHorizonChange,
  onOpenReportModal,
}) => {
  const [activeTab, setActiveTab] = useState<'reasoning' | 'breakdown'>('reasoning');

  const horizonData = stock.horizonScores[activeHorizon] || {
    score: stock.assistantScore,
    label: stock.scoreLabel,
    stance: 'Dengeli Araştırma Görünümü',
    rationale: 'Seçili vade için dengeli araştırma perspektifi.',
  };

  const scoreBadge = getScoreCategory(horizonData.score);
  const currentHorizonConfig = HORIZONS.find(h => h.id === activeHorizon);

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
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(0, 210, 255, 0.12)',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--electric-blue)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              Yapay Zeka Karar Destek Asistanı
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 4,
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 600,
                }}
              >
                Algoritmik
              </span>
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Objektif ve gerekçeli araştırma perspektifi (Kesin al/sat emri içermez)
            </span>
          </div>
        </div>

        {/* Full Institutional Report Button */}
        <button onClick={onOpenReportModal} className="btn-primary">
          <FileText size={15} />
          <span>Araştırma Raporunu Aç</span>
        </button>
      </div>

      {/* Horizon Selection Navigation Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Zaman Ufku Perspektifi:
          </span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {HORIZONS.map(h => (
              <button
                key={h.id}
                onClick={() => onHorizonChange(h.id)}
                className={`horizon-tab ${activeHorizon === h.id ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: 12 }}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
          <b style={{ color: 'var(--electric-cyan)' }}>{currentHorizonConfig?.subLabel}:</b> {currentHorizonConfig?.description}
        </p>
      </div>

      {/* Horizon Result Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: scoreBadge.bg,
          border: `1px solid ${scoreBadge.border}`,
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Big Score Number */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: scoreBadge.color,
                lineHeight: 1,
              }}
            >
              {horizonData.score}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>
              / 100 Puan
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: scoreBadge.color,
                  letterSpacing: '0.01em',
                }}
              >
                {scoreBadge.label} ({horizonData.stance})
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
              {horizonData.rationale}
            </p>
          </div>
        </div>

        {/* Sub-tab view toggle: Reasoning vs 11-factor breakdown */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: 3,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setActiveTab('reasoning')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              color: activeTab === 'reasoning' ? '#ffffff' : 'var(--text-muted)',
              backgroundColor: activeTab === 'reasoning' ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
            }}
          >
            Neden Böyle Düşünüyor?
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              color: activeTab === 'breakdown' ? '#ffffff' : 'var(--text-muted)',
              backgroundColor: activeTab === 'breakdown' ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
            }}
          >
            11 Faktör Dağılımı
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'reasoning' ? (
        /* "Asistan Neden Böyle Düşünüyor?" Section */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Executive Summary */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Compass size={15} style={{ color: 'var(--electric-cyan)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Yönetici Özeti (Genel Değerlendirme)
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {stock.whyAssistantThinks.summary}
            </p>
          </div>

          {/* Grid: Positive Factors & Risks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {/* Positive Factors */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-positive)' }}>
                <CheckCircle2 size={16} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Olumlu Etkenler & Katalizörler</span>
              </div>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stock.whyAssistantThinks.positiveFactors.map((fact, idx) => (
                  <li key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks & Headwinds */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-negative)' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Riskler & Baskı Unsurları</span>
              </div>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stock.whyAssistantThinks.risks.map((risk, idx) => (
                  <li key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Grid: Watchpoints & Data Sources */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {/* Watchpoints */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.04)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-warning)' }}>
                <Clock size={16} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>İzlenmesi Gereken Gelişmeler</span>
              </div>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {stock.whyAssistantThinks.watchpoints.map((wp, idx) => (
                  <li key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {wp}
                  </li>
                ))}
              </ul>
            </div>

            {/* Data Sources */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 210, 255, 0.03)',
                border: '1px solid rgba(0, 210, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--electric-cyan)' }}>
                <Database size={16} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Dayanak Veri Kaynakları</span>
              </div>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {stock.whyAssistantThinks.dataSources.map((src, idx) => (
                  <li key={idx} style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {src}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* 11-Factor Breakdown View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Araştırma puanı; fiyat trendi, temel bilanço, likidite, KAP duyarlılığı ve sektör dinamiklerinden oluşan 11 bağımsız parametrenin ağırlıklı algoritmik bileşimidir:
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 8,
            }}
          >
            {SCORE_METRICS.map(metric => {
              const val = (stock.scoreBreakdown as any)[metric.key] || 70;
              const valColor = val >= 80 ? '#10B981' : val >= 65 ? '#38BDF8' : val >= 50 ? '#FCD34D' : '#EF4444';

              return (
                <div
                  key={metric.key}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {metric.title}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        ({metric.weight})
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: valColor }}>
                      {val}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      width: '100%',
                      height: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      borderRadius: 9999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${val}%`,
                        backgroundColor: valColor,
                        borderRadius: 9999,
                      }}
                    />
                  </div>

                  <span style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.25 }}>
                    {metric.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prominent Legal Disclaimer Banner */}
      <div
        style={{
          marginTop: 6,
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <Info size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 11.5, color: '#fcd34d', lineHeight: 1.45, fontWeight: 500 }}>
          {LEGAL_DISCLAIMER}
        </span>
      </div>
    </div>
  );
};
