import type { Stock, KAPNewsItem, RumorItem, MarketIndex, Candle, ScoreCategory, RiskLevel } from '../types';
import { BIST_ALL_STOCKS } from './bistDirectory';
import type { BISTStockMetadata } from './bistDirectory';

// Helper to generate realistic candles
function generateCandles(basePrice: number, count: number, volatility: number, trend: number): Candle[] {
  const candles: Candle[] = [];
  let currentClose = basePrice;
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    const randomChange = (Math.random() - 0.48 + trend) * volatility * currentClose;
    const open = currentClose;
    const close = Math.max(open + randomChange, open * 0.7);
    const high = Math.max(open, close) + Math.random() * volatility * 0.8 * open;
    const low = Math.max(0.1, Math.min(open, close) - Math.random() * volatility * 0.8 * open);
    const volume = Math.floor(Math.random() * 5000000 + 1000000);

    candles.push({
      time: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentClose = close;
  }
  return candles;
}

export const MARKET_INDICES: MarketIndex[] = [
  { code: 'XU100', name: 'BIST 100', value: 12592.76, changePercent: -2.38 },
  { code: 'XU030', name: 'BIST 30', value: 13940.50, changePercent: -2.15 },
  { code: 'XBANK', name: 'BIST Banka', value: 16420.10, changePercent: -1.45 },
  { code: 'XUSIN', name: 'BIST Sınai', value: 17850.40, changePercent: -2.20 },
  { code: 'USD/TRY', name: 'Dolar / TL', value: 48.98, changePercent: 0.10, isCurrency: true },
  { code: 'EUR/TRY', name: 'Euro / TL', value: 55.76, changePercent: 0.01, isCurrency: true },
  { code: 'GBP/TRY', name: 'Sterlin / TL', value: 64.98, changePercent: 0.26, isCurrency: true },
  { code: 'GRAM_ALTIN', name: 'Gram Altın', value: 6511.30, changePercent: -3.40, isCurrency: true },
];

function getLabelForScore(score: number): ScoreCategory {
  if (score >= 80) return 'Güçlü';
  if (score >= 65) return 'Olumlu';
  if (score >= 50) return 'Nötr';
  if (score >= 35) return 'Temkinli';
  return 'Zayıf';
}

export function buildStockFromMeta(meta: BISTStockMetadata): Stock {
  const score = meta.baseScore;
  const label = getLabelForScore(score);
  const riskScore = meta.riskScore;
  const riskLevel: RiskLevel = riskScore <= 35 ? 'Düşük' : riskScore <= 70 ? 'Orta' : 'Yüksek';

  const h1hScore = Math.max(30, Math.min(95, score - 8 + Math.floor(Math.random() * 8)));
  const h1dScore = Math.max(30, Math.min(95, score - 4 + Math.floor(Math.random() * 6)));
  const h1wScore = Math.max(30, Math.min(95, score - 2 + Math.floor(Math.random() * 5)));
  const h1mScore = score;
  const h1yScore = Math.max(30, Math.min(95, score + (meta.roe > 30 ? 5 : -4)));
  const h3yScore = Math.max(30, Math.min(95, score + (meta.debtToEquity < 0.6 ? 6 : -5)));

  return {
    code: meta.code,
    name: meta.name,
    price: meta.basePrice,
    changePercent: typeof meta.changePercent === 'number' ? meta.changePercent : 0.0,
    changeNominal: typeof meta.changeNominal === 'number' ? meta.changeNominal : 0.0,
    volume: Math.floor(meta.basePrice * 1500000 + 5000000),
    marketCap: Math.floor(meta.basePrice * 1250000000),
    sector: meta.sector,
    peRatio: meta.peRatio,
    pbRatio: meta.pbRatio,
    roe: meta.roe,
    netMargin: meta.netMargin,
    debtToEquity: meta.debtToEquity,
    assistantScore: score,
    scoreLabel: label,
    horizonScores: {
      '1h': {
        score: h1hScore,
        label: getLabelForScore(h1hScore),
        stance: h1hScore >= 75 ? 'Seans İçi Pozitif Akış' : 'Yatay Denge Arayışı',
        rationale: `${meta.code} için seans içi kademe derinliği ve mikro para akışı verileri değerlendirilmektedir.`,
      },
      '1d': {
        score: h1dScore,
        label: getLabelForScore(h1dScore),
        stance: h1dScore >= 75 ? 'Gün Sonu Kapanış Desteği' : 'Kapanış Öncesi Konsolidasyon',
        rationale: 'Günlük ağırlıklı ortalama fiyat ve kurumsal blok emir dengesi izlenmektedir.',
      },
      '1w': {
        score: h1wScore,
        label: getLabelForScore(h1wScore),
        stance: h1wScore >= 75 ? 'Haftalık Kanal Desteği' : 'Direnç Testi Beklentisi',
        rationale: '20 günlük üssel hareketli ortalama üzerinde hacim destekli fiyat oluşumu takip edilmektedir.',
      },
      '1m': {
        score: h1mScore,
        label: getLabelForScore(h1mScore),
        stance: h1mScore >= 75 ? 'Trend Korunuyor' : 'Temkinli Araştırma Görünümü',
        rationale: `${meta.sector} sektör dinamikleri ve şirketin son çeyrek operasyonel performansı baz alınmıştır.`,
      },
      '1y': {
        score: h1yScore,
        label: getLabelForScore(h1yScore),
        stance: h1yScore >= 75 ? 'Stratejik Büyüme Potansiyeli' : 'Döngüsel İskonto Takibi',
        rationale: `F/K: ${meta.peRatio}x, PD/DD: ${meta.pbRatio}x ve %${meta.roe} özkaynak kârlılığı ile orta vadeli değerleme projeksiyonu.`,
      },
      '3y': {
        score: h3yScore,
        label: getLabelForScore(h3yScore),
        stance: h3yScore >= 75 ? 'Sektörel Liderlik & Özkaynak Verimi' : 'Makro Dengelenme Perspektifi',
        rationale: 'Sektörün uzun vadeli büyüme trendi, sermaye harcamaları (CapEx) ve nakit üretme gücü modellenmiştir.',
      },
    },
    riskScore,
    riskLevel,
    riskFactors: [
      { factor: 'Volatilite', score: Math.min(95, Math.floor(riskScore * 1.1)), description: 'BIST 100 beta katsayısına bağlı fiyat dalgalanma aralığı.' },
      { factor: 'Ani Fiyat Hareketleri', score: Math.min(90, Math.floor(riskScore * 0.95)), description: 'Gün içi spread genişliği ve kademe derinliği direnci.' },
      { factor: 'Düşük Likidite Riski', score: Math.min(80, Math.floor(riskScore * 0.4)), description: 'Kurumsal ve yabancı takas payının derinliği.' },
      { factor: 'Haber Yoğunluğu', score: Math.min(85, Math.floor(riskScore * 0.85 + 10)), description: 'Sektörel KAP bildirimleri ve makroekonomik duyarlılık.' },
      { factor: 'Bilanço Zayıflığı', score: Math.min(85, Math.floor(riskScore * 0.8)), description: 'Özkaynak yapısı ve işletme sermayesi döngüsü.' },
      { factor: 'Borçluluk Riski', score: Math.min(95, Math.floor(meta.debtToEquity * 35)), description: `Net Borç / Özkaynak oranı ${meta.debtToEquity}x seviyesindedir.` },
      { factor: 'Sektör Riski', score: Math.min(90, Math.floor(riskScore * 0.75 + 15)), description: `${meta.sector} sektörüne özgü talep ve regülasyon değişkenleri.` },
    ],
    riskSummaryBullets: [
      `${meta.sector} sektöründeki genel konjonktür ve küresel girdi maliyetleri yakından izlenmelidir.`,
      `Şirketin borç/özkaynak oranı (${meta.debtToEquity}x) finansman gideri hassasiyeti oluşturmaktadır.`,
      `Özkaynak kârlılığı (%${meta.roe}) sektör ortalamalarıyla karşılaştırıldığında finansal dayanıklılığı desteklemektedir.`,
      'BIST genel endeks dalgalanmalarına karşı portföy çeşitlendirmesi ve risk yönetimi esastır.',
    ],
    scoreBreakdown: {
      priceTrend: Math.min(95, Math.max(35, score + 2)),
      technicalIndicators: Math.min(95, Math.max(35, score - 1)),
      tradingVolume: Math.min(95, Math.max(40, score + 4)),
      volatility: Math.min(95, Math.max(30, 100 - riskScore)),
      balanceSheet: Math.min(95, Math.max(35, score + 3)),
      profitability: Math.min(95, Math.max(30, Math.floor(meta.roe * 2.2))),
      indebtedness: Math.min(95, Math.max(25, 100 - Math.floor(meta.debtToEquity * 40))),
      liquidity: Math.min(98, Math.max(50, 95 - Math.floor(riskScore * 0.3))),
      kapNews: Math.min(95, Math.max(45, score)),
      sectorOutlook: Math.min(95, Math.max(40, score + 1)),
      newsSentiment: Math.min(95, Math.max(40, score - 2)),
    },
    whyAssistantThinks: {
      summary: `${meta.name} (${meta.code}), ${meta.sector} sektöründeki konumu, %${meta.roe} özkaynak getirisi ve ${meta.peRatio}x F/K çarpanıyla asistan modelimizden ${score} puan almıştır.`,
      positiveFactors: [
        `${meta.sector} sektöründe güçlü pazar payı ve operasyonel nakit akışı.`,
        `%${meta.roe} seviyesindeki özkaynak kârlılığı ile sağlam kâr üretimi.`,
        `Makul değerleme çarpanları (F/K: ${meta.peRatio}x, PD/DD: ${meta.pbRatio}x).`,
        'BIST kurumsal saklama payının derinliği ve düzenli işlem hacmi.',
      ],
      risks: [
        'Genel makroekonomik faiz ve enflasyon politikalarının sektör talebine etkisi.',
        `Borç / Özkaynak oranının (${meta.debtToEquity}x) getirdiği faiz yükü.`,
        'Sektörel regülasyon ve vergi düzenlemeleri.',
      ],
      watchpoints: [
        'Açıklanacak çeyreklik finansal raporlar ve FAVÖK marjı eğilimi.',
        'KAP üzerinden duyurulacak yeni iş ilişkileri ve yatırımlar.',
        'Sektörel ihracat ve iç pazar talep istatistikleri.',
      ],
      dataSources: [
        'Borsa İstanbul Resmi Seans Verileri',
        'Kamuyu Aydınlatma Platformu (KAP) Finansal Raporları',
        'Sektörel İhracat ve Sanayi İstatistikleri',
      ],
    },
    researchReport: {
      thesisSummary: `${meta.name}, sektöründeki güçlü konumu ve dengeli operasyonel yapısıyla araştırma radarmızda yer almaktadır. Mevcut çarpanlar ve kârlılık rasyoları risk/getiri dengesi açısından analiz edilmiştir.`,
      technicalOutlook: `Hissede 20 ve 50 günlük üssel hareketli ortalamalar çevresinde teknik konsolidasyon gözlenmektedir. Destek seviyelerinden gelen tepki alımları yakından takip edilmelidir.`,
      fundamentalSummary: `Şirketin F/K çarpanı ${meta.peRatio}x, PD/DD oranı ${meta.pbRatio}x seviyesindedir. Net kâr marjı %${meta.netMargin} olarak gerçekleşmiş, özkaynak kârlılığı %${meta.roe} seviyesinde korunmuştur.`,
      recentKapEvents: `${meta.code} tarafından KAP bülteninde yayımlanan en son kurumsal yönetim ve operasyonel açıklamalar rapor kapsamında değerlendirilmiştir.`,
      volumeLiquidityAnalysis: `Ortalama işlem hacmi BIST ortalamalarıyla uyumlu seyretmekte olup, kurumsal ve yabancı saklama oranları dengeli bir taban oluşturmaktadır.`,
      risksAndStress: `Faiz oranlarının yüksek seyrettiği ortamlarda finansman maliyetlerinin net marj üzerindeki etkisi stres testlerinde dikkate alınmalıdır.`,
      bullScenario: `BIST günlük fiyat marjı (+%9.99 tavan) kapsamında, %4.5 - %6.0 ara direnç seviyeleri pozitif akışta izlenmektedir.`,
      bearScenario: `Piyasa satış baskısında taban seviyesi (-%9.99) ve %4.0 - %5.0 ara destek seviyeleri risk tamponu olarak değerlendirilmelidir.`,
      keyLevels: {
        res2: Number((meta.basePrice * 1.099).toFixed(2)),
        res1: Number((meta.basePrice * 1.045).toFixed(2)),
        pivot: Number(meta.basePrice.toFixed(2)),
        sup1: Number((meta.basePrice * 0.955).toFixed(2)),
        sup2: Number((meta.basePrice * 0.901).toFixed(2)),
      },
      scoreRationale: `Temel kârlılık, bilanço yapısı ve piyasa likiditesi puanlamaya en yüksek katkıyı sağlamıştır.`,
      disclaimer: `Burada yer alan analiz ve model skorları yalnızca araştırma ve karar destek amaçlıdır. Kesinlikle al, sat veya tut yönünde bir yatırım tavsiyesi değildir. Nihai yatırım kararı kullanıcının kendi risk ve getiri tercihine aittir.`,
    },
    candles: {
      '1G': generateCandles(meta.basePrice * 0.99, 15, 0.005, 0.001),
      '5G': generateCandles(meta.basePrice * 0.98, 20, 0.009, 0.0015),
      '1A': generateCandles(meta.basePrice * 0.95, 25, 0.013, 0.002),
      '3A': generateCandles(meta.basePrice * 0.92, 30, 0.016, 0.002),
      '6A': generateCandles(meta.basePrice * 0.88, 35, 0.018, 0.0025),
      '1Y': generateCandles(meta.basePrice * 0.75, 45, 0.022, 0.003),
      '5Y': generateCandles(meta.basePrice * 0.35, 50, 0.03, 0.005),
    },
  };
}

// Build initial stocks for ALL 70+ BIST stocks in the directory!
export const INITIAL_STOCKS: Stock[] = BIST_ALL_STOCKS.map(buildStockFromMeta);

export const MOCK_KAP_NEWS: KAPNewsItem[] = [
  {
    id: 'kap-1',
    stockCode: 'ASELS',
    companyName: 'Aselsan Elektronik Sanayi',
    title: 'Yeni İş İlişkisi: 68.5 Milyon Dolar Tutarında İhracat Sözleşmesi',
    timestamp: 'Bugün 14:32',
    importance: 'Kritik',
    summary: 'Yurt dışı bir müşteri ile elektro-optik ve taktik haberleşme sistemleri tedarikine yönelik 68.520.000 ABD Doları tutarında yeni bir sözleşme imzalanmıştır.',
    fullContent: 'Şirketimiz ile uluslararası bir müşteri arasında, savunma sistemleri teçhizatı kapsamında toplam bedeli 68.520.000,- ABD Doları olan bir yurt dışı satış sözleşmesi imzalanmıştır. Teslimatlar 2025-2027 yılları arasında peyderpey gerçekleştirilecektir.',
    sentiment: 'Olumlu',
    category: 'İş İlişkisi',
  },
  {
    id: 'kap-2',
    stockCode: 'THYAO',
    companyName: 'Türk Hava Yolları A.O.',
    title: 'Aylık Trafik Sonuçları: Yolcu Sayısı ve Kargo Gelirlerinde Artış',
    timestamp: 'Bugün 11:15',
    importance: 'Yüksek',
    summary: 'Taşınan toplam yolcu sayısı geçen yılın aynı dönemine göre artış göstermiş, yolcu doluluk oranı %84.2 olarak gerçekleşmiştir.',
    fullContent: 'Ortaklığımızın dönemine ilişkin trafik sonuçlarına göre toplam yolcu sayısı ve doluluk oranları yükseliş eğilimini korumuştur.',
    sentiment: 'Olumlu',
    category: 'Özel Durum',
  },
  {
    id: 'kap-3',
    stockCode: 'GARAN',
    companyName: 'Garanti BBVA A.Ş.',
    title: 'Sendikasyon Kredisi Yenilemesi Hakkında Bildirim',
    timestamp: 'Dün 17:45',
    importance: 'Yüksek',
    summary: 'Banka, sürdürülebilirlik bağlantılı sendikasyon kredisini %115 oranında başarıyla yenilemiştir.',
    fullContent: 'Bankamız uluslararası piyasalardan sürdürülebilirlik temalı sendikasyon kredisi temin etmiş ve borçlanma maliyetlerinde iyileşme sağlamıştır.',
    sentiment: 'Olumlu',
    category: 'Finansal Rapor',
  },
  {
    id: 'kap-4',
    stockCode: 'TUPRS',
    companyName: 'Tüpraş Türkiye Petrol Rafinerileri A.Ş.',
    title: 'Yeşil Hidrojen ve Sıfır Karbon Dönüşüm Yatırımı',
    timestamp: 'Dün 16:10',
    importance: 'Kritik',
    summary: 'İzmit Rafinerisinde sıfır karbonlu yeşil hidrojen üretim ünitesi yatırımı için fizibilite onaylanmıştır.',
    fullContent: 'Şirketimizin Stratejik Dönüşüm Planı doğrultusunda, İzmit Rafinerisi bünyesinde planlanan yeşil hidrojen üretim tesisi yatırımına başlanmasına karar verilmiştir.',
    sentiment: 'Olumlu',
    category: 'Özel Durum',
  },
  {
    id: 'kap-5',
    stockCode: 'KCHOL',
    companyName: 'Koç Holding A.Ş.',
    title: 'Pay Geri Alım İşlemleri Bildirimi',
    timestamp: 'Dün 18:20',
    importance: 'Yüksek',
    summary: 'Yönetim Kurulu kararıyla başlatılan pay geri alım programı kapsamında 250.000 adet pay alımı gerçekleştirilmiştir.',
    fullContent: 'Şirketimiz Yönetim Kurulu kararı uyarınca pay fiyatının gerçek performansını yansıtması amacıyla Borsa İstanbul nezdinde geri alım işlemi yapılmıştır.',
    sentiment: 'Olumlu',
    category: 'Pay Alım/Satım',
  },
  {
    id: 'kap-6',
    stockCode: 'BIMAS',
    companyName: 'BİM Birleşik Mağazalar A.Ş.',
    title: 'Yeni Lojistik Merkezi ve Mağaza Sayısı Güncellemesi',
    timestamp: '2 gün önce',
    importance: 'Normal',
    summary: 'Yurt içi toplam mağaza sayısı 11.850 adede ulaşmış olup İç Anadolu yeni soğuk hava deposu faaliyete geçmiştir.',
    fullContent: 'Operasyonel verimlilik ve tedarik zinciri dayanıklılığı kapsamında tamamlanan depo yatırımı faaliyete başlamıştır.',
    sentiment: 'Olumlu',
    category: 'Özel Durum',
  },
  {
    id: 'kap-7',
    stockCode: 'ASTOR',
    companyName: 'Astor Enerji A.Ş.',
    title: 'Yeni İş İlişkisi: 28.4 Milyon Euro Transformatör Sözleşmesi',
    timestamp: '2 gün önce',
    importance: 'Kritik',
    summary: 'Avrupa merkezli bir enerji dağıtım operatörü ile yüksek gerilim transformatörleri tedarik anlaşması imzalanmıştır.',
    fullContent: 'Şirketimiz ile İspanya merkezli dağıtım şirketi arasında 28.400.000 EUR bedelli transformatör satış sözleşmesi bağıtlanmıştır.',
    sentiment: 'Olumlu',
    category: 'İş İlişkisi',
  },
  {
    id: 'kap-8',
    stockCode: 'SASA',
    companyName: 'Sasa Polyester Sanayi A.Ş.',
    title: 'PTA Üretim Tesisi Deneme Üretimi Başlangıcı',
    timestamp: '3 gün önce',
    importance: 'Yüksek',
    summary: 'Adana Yumurtalık yerleşkesinde yer alan 1.5 Milyon ton kapasiteli PTA tesisinde test aşaması başlatılmıştır.',
    fullContent: 'Şirketimizin cari açığı azaltmaya yönelik en büyük petrokimya yatırımı olan PTA tesisinde mekanik tamamlama sonrası deneme üretimine geçilmiştir.',
    sentiment: 'Olumlu',
    category: 'Özel Durum',
  },
  {
    id: 'kap-9',
    stockCode: 'SISE',
    companyName: 'Türkiye Şişe ve Cam Fabrikaları A.Ş.',
    title: 'Cam Ambalaj Fırını Soğuk Tamiri ve Kapasite Artışı',
    timestamp: '3 gün önce',
    importance: 'Normal',
    summary: 'Mersin Cam Ambalaj fabrikasında fırın yenilemesi tamamlanarak yıllık üretim kapasitesi %12 artırılmıştır.',
    fullContent: 'Yüksek enerji verimliliğine sahip yeni nesil cam ambalaj fırını devreye alınmış ve üretime başlanmıştır.',
    sentiment: 'Olumlu',
    category: 'Özel Durum',
  },
  {
    id: 'kap-10',
    stockCode: 'EKGYO',
    companyName: 'Emlak Konut Gayrimenkul Yatırım Ortaklığı',
    title: 'Arsa Satışı Karşılığı Gelir Paylaşımı İhale Sonucu',
    timestamp: '3 gün önce',
    importance: 'Yüksek',
    summary: 'İstanbul Başakşehir projesi ihalesinde toplam satış geliri taahhüdü 14.8 Milyar TL olarak tescil edilmiştir.',
    fullContent: 'İlgili ihalede Emlak Konut payı asgari %40 olarak belirlenmiş olup sözleşme imza sürecine geçilmiştir.',
    sentiment: 'Olumlu',
    category: 'İş İlişkisi',
  },
];

export const MOCK_RUMORS: RumorItem[] = [
  {
    id: 'rumor-1',
    stockCode: 'KCHOL',
    title: 'Yurt Dışı Finans Kuruluşu Satın Alma İddiası',
    timestamp: '2 saat önce',
    rumorSource: 'Sosyal Medya & Piyasa Dedikoduları',
    summary: 'Koç Holding’in Doğu Avrupa merkezli bir ticari bankanın hisselerini satın alacağı yönünde doğrulanmamış iddialar piyasa kanallarında dolaşmaktadır.',
    verificationStatus: 'Doğrulanmamış',
    warningNote: 'DİKKAT: Bu bilgi Kamuyu Aydınlatma Platformu (KAP) veya şirket resmi kanallarınca teyit edilmemiştir. Söylenti niteliğindedir.',
  },
  {
    id: 'rumor-2',
    stockCode: 'ASTOR',
    title: 'Kuzey Amerika Şebeke Tedariği Ortaklık Söylentisi',
    timestamp: '5 saat önce',
    rumorSource: 'Borsa Forumları & Mesaj Grupları',
    summary: 'Astor Enerji’nin ABD’li bir kamu enerji dağıtım şirketiyle büyük ölçekli anlaşma yapacağı iddiası konuşulmaktadır.',
    verificationStatus: 'Kaynak Teyidi Bekleniyor',
    warningNote: 'DİKKAT: Doğrulanmamış piyasa söylentisidir. Şirketin resmi bir özel durum açıklaması bulunmamaktadır.',
  },
];
