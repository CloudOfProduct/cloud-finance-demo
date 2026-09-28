import React, { useState } from 'react';
import type { Stock } from '../types';
import { getScoreCategory } from '../services/aiService';
import { Speedometer } from './Speedometer';
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Layers,
  Activity,
  AlertTriangle,
  Compass,
} from 'lucide-react';

interface ResearchReportModalProps {
  stock: Stock;
  onClose: () => void;
}

export const ResearchReportModal: React.FC<ResearchReportModalProps> = ({ stock, onClose }) => {
  const [copied, setCopied] = useState(false);
  const report = stock.researchReport;
  const scoreBadge = getScoreCategory(stock.assistantScore);

  const handleCopy = () => {
    const reportText = `CLOUD FINANCE BIST ARAŞTIRMA RAPORU: ${stock.code} - ${stock.name}
Puan: ${stock.assistantScore}/100 (${stock.scoreLabel})
Tarih: ${new Date().toLocaleDateString('tr-TR')}

1. YATIRIM TEZİ ÖZETİ:
${report.thesisSummary}

2. TEKNİK GÖRÜNÜM:
${report.technicalOutlook}

3. TEMEL ANALİZ ÖZETİ:
${report.fundamentalSummary}

4. SON KAP GELİŞMELERİ:
${report.recentKapEvents}

5. HACİM VE LİKİDİTE ANALİZİ:
${report.volumeLiquidityAnalysis}

6. RİSKLER VE STRES TESTİ:
${report.risksAndStress}

7. SENARYO ANALİZİ:
Olumlu Senaryo: ${report.bullScenario}
Olumsuz Senaryo: ${report.bearScenario}

8. İZLENECEK SEVİYELER:
Direnç 2: ₺${report.keyLevels.res2.toFixed(2)} | Direnç 1: ₺${report.keyLevels.res1.toFixed(2)}
Pivot: ₺${report.keyLevels.pivot.toFixed(2)}
Destek 1: ₺${report.keyLevels.sup1.toFixed(2)} | Destek 2: ₺${report.keyLevels.sup2.toFixed(2)}

9. ASİSTAN PUAN GEREKÇESİ:
${report.scoreRationale}

UYARI: ${report.disclaimer}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          width: '95%',
          maxWidth: '850px',
          maxHeight: '92vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(16, 23, 42, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--electric-cyan)',
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                  {stock.code} Detaylı Araştırma Raporu
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: scoreBadge.bg,
                    border: `1px solid ${scoreBadge.border}`,
                    color: scoreBadge.color,
                  }}
                >
                  Skor: {stock.assistantScore}/100 ({scoreBadge.label})
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {stock.name} • {stock.sector} • Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleCopy}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12 }}
              title="Raporu Metin Olarak Kopyala"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12 }}
              title="Yazdır"
            >
              <Printer size={14} />
              <span>Yazdır</span>
            </button>

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
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Top Mandatory Disclaimer Callout */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: '#fef08a', lineHeight: 1.45 }}>
              <b>Önemli Yasal Çekince:</b> Bu rapor, Cloud Finance algoritmik araştırma motoru tarafından oluşturulmuştur. <b>Kesinlikle yatırım tavsiyesi değildir; nihai yatırım ve işlem kararı tamamen kullanıcıya aittir.</b> Alım, satım veya hedef fiyat taahhüdü içermez.
            </div>
          </div>

          {/* Section 1: Yatırım Tezi Özeti */}
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Compass size={16} color="var(--electric-cyan)" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                1. Yatırım Tezi ve Temel Değerlendirme Özeti
              </h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {report.thesisSummary}
            </p>
          </div>

          {/* NEW: AI Timeframe Speedometers (iOS 18 Style) */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Yapay Zeka Vade Öneri Oranları
            </h3>
            {(() => {
              const getDynamicScores = (code: string, base: number) => {
                switch (code) {
                  case 'THYAO': return { daily: 35, weekly: 50, monthly: base, yearly: 88, threeYear: 92 };
                  case 'ASELS': return { daily: 75, weekly: 65, monthly: base, yearly: 45, threeYear: 28 };
                  case 'GARAN': return { daily: 22, weekly: 38, monthly: base, yearly: 60, threeYear: 85 };
                  case 'SASA': return { daily: 88, weekly: 42, monthly: base, yearly: 25, threeYear: 15 };
                  case 'EREGL': return { daily: 45, weekly: 72, monthly: base, yearly: 80, threeYear: 40 };
                  default: return { daily: Math.max(10, base - 35), weekly: Math.max(10, base - 15), monthly: base, yearly: Math.min(95, base + 15), threeYear: Math.max(10, base - 45) };
                }
              };
              const scores = getDynamicScores(stock.code, stock.assistantScore);
              
              return (
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                  <Speedometer label="Günlük" score={scores.daily} />
                  <Speedometer label="Haftalık" score={scores.weekly} />
                  <Speedometer label="Aylık" score={scores.monthly} />
                  <Speedometer label="Yıllık" score={scores.yearly} />
                  <Speedometer label="3 Yıllık" score={scores.threeYear} />
                </div>
              );
            })()}
          </div>

          {/* Section 2 & 3: Teknik Görünüm & Temel Analiz */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
            {/* Teknik Görünüm */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp size={16} color="#38bdf8" />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  2. Teknik Görünüm & Göstergeler
                </h4>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {report.technicalOutlook}
              </p>
            </div>

            {/* Temel Analiz Özeti */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Layers size={16} color="#818cf8" />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  3. Temel Finansal Analiz & Rasyolar
                </h4>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 10 }}>
                {report.fundamentalSummary}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>F/K: <b style={{ color: '#ffffff' }}>{stock.peRatio}x</b></span>
                <span style={{ color: 'var(--text-muted)' }}>PD/DD: <b style={{ color: '#ffffff' }}>{stock.pbRatio}x</b></span>
                <span style={{ color: 'var(--text-muted)' }}>ROE: <b style={{ color: '#10b981' }}>%{stock.roe}</b></span>
                <span style={{ color: 'var(--text-muted)' }}>Net Marj: <b style={{ color: '#38bdf8' }}>%{stock.netMargin}</b></span>
              </div>
            </div>
          </div>

          {/* Section 4 & 5: KAP ve Hacim */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
            {/* KAP Gelişmeleri */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileText size={16} color="#fbbf24" />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  4. Son KAP Gelişmeleri & Etkileri
                </h4>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {report.recentKapEvents}
              </p>
            </div>

            {/* Hacim ve Likidite */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Activity size={16} color="#34d399" />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  5. Hacim ve Likidite Analizi
                </h4>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {report.volumeLiquidityAnalysis}
              </p>
            </div>
          </div>

          {/* Section 6: Riskler ve Stres Testi */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ShieldAlert size={16} color="#ef4444" />
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>
                6. Riskler ve Makro Stres Testi Simülasyonu
              </h4>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {report.risksAndStress}
            </p>
          </div>

          {/* Section 7: Senaryo Analizleri (Olumlu / Olumsuz) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
            {/* Olumlu Senaryo */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <TrendingUp size={16} color="#10b981" />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7' }}>
                  7A. Olumlu Senaryo (Bull Case)
                </h4>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {report.bullScenario}
              </p>
            </div>

            {/* Olumsuz Senaryo */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <TrendingDown size={16} color="#ef4444" />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>
                  7B. Olumsuz Senaryo (Bear Case)
                </h4>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {report.bearScenario}
              </p>
            </div>
          </div>

          {/* Section 8: İzlenecek Seviyeler */}
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              8. İzlenecek Kritik Teknik Seviyeler (Destek & Dirençler)
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 10,
                textAlign: 'center',
              }}
            >
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontSize: 10, color: '#fca5a5', fontWeight: 600 }}>Direnç 2</span>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
                  ₺{report.keyLevels.res2.toFixed(2)}
                </div>
              </div>

              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <span style={{ fontSize: 10, color: '#fca5a5', fontWeight: 600 }}>Direnç 1</span>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                  ₺{report.keyLevels.res1.toFixed(2)}
                </div>
              </div>

              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <span style={{ fontSize: 10, color: 'var(--electric-cyan)', fontWeight: 600 }}>Pivot Seviyesi</span>
                <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                  ₺{report.keyLevels.pivot.toFixed(2)}
                </div>
              </div>

              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <span style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 600 }}>Destek 1</span>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                  ₺{report.keyLevels.sup1.toFixed(2)}
                </div>
              </div>

              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 600 }}>Destek 2</span>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                  ₺{report.keyLevels.sup2.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 9: Asistan Puan Gerekçesi */}
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              9. Asistanın Puan Gerekçesi ve Nihai Model Yorumu
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {report.scoreRationale}
            </p>
          </div>

          {/* Section 10: Footer Disclaimer */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              fontSize: 11,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            {report.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};
