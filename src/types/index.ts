export type TimeHorizon = '1h' | '1d' | '1w' | '1m' | '1y' | '3y';

export type ScoreCategory = 'Güçlü' | 'Olumlu' | 'Nötr' | 'Temkinli' | 'Zayıf';

export type RiskLevel = 'Düşük' | 'Orta' | 'Yüksek';

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HorizonAnalysis {
  score: number;
  label: ScoreCategory;
  stance: string; // e.g. "Olumlu Görünüm", "Temkinli İzleme", "Seçici Alım Bölgesi"
  rationale: string;
}

export interface RiskFactor {
  factor: string;
  score: number; // 0 - 100
  description: string;
}

export interface ScoreBreakdown {
  priceTrend: number;
  technicalIndicators: number;
  tradingVolume: number;
  volatility: number;
  balanceSheet: number;
  profitability: number;
  indebtedness: number;
  liquidity: number;
  kapNews: number;
  sectorOutlook: number;
  newsSentiment: number;
}

export interface WhyAssistantThinks {
  summary: string;
  positiveFactors: string[];
  risks: string[];
  watchpoints: string[];
  dataSources: string[];
}

export interface ResearchReport {
  thesisSummary: string;
  technicalOutlook: string;
  fundamentalSummary: string;
  recentKapEvents: string;
  volumeLiquidityAnalysis: string;
  risksAndStress: string;
  bullScenario: string;
  bearScenario: string;
  keyLevels: {
    res2: number;
    res1: number;
    pivot: number;
    sup1: number;
    sup2: number;
  };
  scoreRationale: string;
  disclaimer: string;
}

export interface Stock {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  changeNominal: number;
  high?: number;
  low?: number;
  volume: number;
  marketCap: number;
  sector: string;
  peRatio: number;
  pbRatio: number;
  roe: number;
  netMargin: number;
  debtToEquity: number;
  assistantScore: number;
  scoreLabel: ScoreCategory;
  horizonScores: Record<TimeHorizon, HorizonAnalysis>;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  riskSummaryBullets: string[];
  scoreBreakdown: ScoreBreakdown;
  whyAssistantThinks: WhyAssistantThinks;
  researchReport: ResearchReport;
  candles: Record<string, Candle[]>;
  tickDirection?: 'up' | 'down' | 'neutral';
  lastTickTime?: number;
}

export interface KAPNewsItem {
  id: string;
  stockCode: string;
  companyName: string;
  title: string;
  timestamp: string;
  importance: 'Kritik' | 'Yüksek' | 'Normal';
  summary: string;
  fullContent: string;
  sentiment: 'Olumlu' | 'Nötr' | 'Olumsuz';
  category: 'Finansal Rapor' | 'Özel Durum' | 'İş İlişkisi' | 'Sermaye Artırımı' | 'Pay Alım/Satım';
}

export interface RumorItem {
  id: string;
  stockCode?: string;
  title: string;
  timestamp: string;
  rumorSource: string;
  summary: string;
  verificationStatus: 'Doğrulanmamış' | 'İncelemede' | 'Kaynak Teyidi Bekleniyor';
  warningNote: string;
}

export interface MarketIndex {
  code: string;
  name: string;
  value: number;
  changePercent: number;
  isCurrency?: boolean;
  tickDirection?: 'up' | 'down' | 'neutral';
  lastTickTime?: number;
}

export type InvestorRiskProfile = 'Temkinli (Düşük Risk)' | 'Dengeli (Orta Risk)' | 'Büyüme Odaklı (Yüksek Risk)';

export interface UserNotifications {
  kapAlerts: boolean;
  priceAlerts: boolean;
  dailyDigest: boolean;
  emailNotifications: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string; // Preset ID or DataURL/Image URL
  bio: string;
  phone?: string;
  role: 'Bireysel Yatırımcı' | 'Pro Terminal Analisti' | 'Fon Yöneticisi';
  riskTolerance: InvestorRiskProfile;
  defaultHorizon: TimeHorizon;
  defaultView: 'table' | 'cards';
  watchlist: string[]; // Stock codes, e.g. ['THYAO', 'DMSAS']
  createdAt: string;
  lastLoginAt: string;
  twoFactorEnabled: boolean;
  notifications: UserNotifications;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
