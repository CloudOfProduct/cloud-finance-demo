import type { TimeHorizon, ScoreCategory } from '../types';

export interface HorizonConfig {
  id: TimeHorizon;
  label: string;
  subLabel: string;
  description: string;
  focus: string;
}

export const HORIZONS: HorizonConfig[] = [
  {
    id: '1h',
    label: '1 Saat',
    subLabel: 'Çok Kısa Vade',
    description: 'Seans içi anlık para giriş/çıkışı, kademe derinliği ve mikro momentum analizi.',
    focus: 'Seans İçi Likidite & Anlık Hacim',
  },
  {
    id: '1d',
    label: '1 Gün',
    subLabel: 'Günlük Kapanış',
    description: 'Günlük mum formasyonları, gün sonu ağırlıklı ortalama ve kurumsal takas kapanış eğilimi.',
    focus: 'Gün Sonu Momentum & Formasyon',
  },
  {
    id: '1w',
    label: '1 Hafta',
    subLabel: 'Kısa Vade',
    description: 'Haftalık trend destekleri, 20 EMA etkileşimi ve sektörel rotasyon akışı.',
    focus: 'Haftalık Kanal & Sektör Rotasyonu',
  },
  {
    id: '1m',
    label: '1 Ay',
    subLabel: 'Orta-Kısa Vade',
    description: 'Aylık dip/tepe testleri, aylık yabancı takas değişimi ve operasyonel haber katalizörleri.',
    focus: 'Aylık Trend & Haber Katalizörü',
  },
  {
    id: '1y',
    label: '1 Yıl',
    subLabel: 'Orta Vade',
    description: 'Çeyreklik bilanço kârlılığı, F/K ve PD/DD değerleme çarpanları, enflasyon muhasebesi uyumu.',
    focus: 'Bilanço Kârlılığı & Değerleme',
  },
  {
    id: '3y',
    label: '3 Yıl',
    subLabel: 'Uzun Vade',
    description: 'Stratejik yatırımlar, pazar payı kazanımı, küresel rekabet avantajı ve sürdürülebilir nakit akımı.',
    focus: 'Stratejik Büyüme & Özkaynak Verimi',
  },
];

export const SCORE_METRICS = [
  { key: 'priceTrend', title: 'Fiyat Trendi', weight: '%15', desc: 'Hareketli ortalamalar, kanal eğimi ve yüksek/düşük dip dizilimi.' },
  { key: 'technicalIndicators', title: 'Teknik Göstergeler', weight: '%15', desc: 'RSI, MACD, Bollinger Bantları ve hacim destekli osilatörler.' },
  { key: 'tradingVolume', title: 'İşlem Hacmi', weight: '%10', desc: 'Ortalama hacim sapması, para akış göstergesi (MFI) ve kurumsal blok işlemler.' },
  { key: 'volatility', title: 'Volatilite & Risk', weight: '%8', desc: 'Tarihsel oynaklık, beta katsayısı ve gün içi ortalama gerçek aralık (ATR).' },
  { key: 'balanceSheet', title: 'Bilanço Gücü', weight: '%12', desc: 'Dönen/Duran varlık dengesi, işletme sermayesi ve net nakit pozisyonu.' },
  { key: 'profitability', title: 'Kârlılık Oranları', weight: '%10', desc: 'Özsermaye kârlılığı (ROE), FAVÖK marjı ve net kâr büyüme performansı.' },
  { key: 'indebtedness', title: 'Borçluluk Rasyoları', weight: '%8', desc: 'Net Borç / FAVÖK çarpanı, faiz karşılama oranı ve borç vade dağılımı.' },
  { key: 'liquidity', title: 'Piyasa Likiditesi', weight: '%7', desc: 'BIST 30 / BIST 100 kademe derinliği, spread darlığı ve emir defteri direnci.' },
  { key: 'kapNews', title: 'KAP Bildirimleri', weight: '%5', desc: 'Yeni iş ilişkileri, teşvikler, pay geri alımları ve temettü kararları.' },
  { key: 'sectorOutlook', title: 'Sektör Görünümü', weight: '%5', desc: 'Sektörel ihracat talebi, büyüme trendi ve regülasyon uyumu.' },
  { key: 'newsSentiment', title: 'Haber Duyarlılığı', weight: '%5', desc: 'Finansal basındaki duyarlılık skoru ve analist konsensüs eğilimi.' },
];

export function getScoreCategory(score: number): { label: ScoreCategory; color: string; bg: string; border: string } {
  if (score >= 80) {
    return { label: 'Güçlü', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
  }
  if (score >= 65) {
    return { label: 'Olumlu', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' };
  }
  if (score >= 50) {
    return { label: 'Nötr', color: '#FCD34D', bg: 'rgba(252, 211, 77, 0.12)', border: 'rgba(252, 211, 77, 0.3)' };
  }
  if (score >= 35) {
    return { label: 'Temkinli', color: '#FB923C', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.3)' };
  }
  return { label: 'Zayıf', color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.3)' };
}

export function getRiskLevelBadge(score: number): { label: string; color: string; bg: string } {
  if (score <= 35) {
    return { label: 'Düşük Risk', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
  }
  if (score <= 70) {
    return { label: 'Orta Risk', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
  }
  return { label: 'Yüksek Risk', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
}

export const LEGAL_DISCLAIMER = 'Yasal Uyarı: Burada yer alan araştırma puanı, analiz, grafik ve yapay zeka değerlendirmeleri kesinlikle bir yatırım tavsiyesi, al/sat/tut önerisi niteliğinde değildir. Sistem, karar destek ve veri analiz aracı olarak kurgulanmıştır. Nihai yatırım kararı tamamen kullanıcının kendi hür iradesine ve finansal risk profiline aittir.';
