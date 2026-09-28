# Cloud Finance - BIST & KAP Veri Mimarisi

Bu doküman, Cloud Finance uygulamasının veri mimarisini, lisanslı BIST veri sağlayıcılarına bağlanma adımlarını ve güvenlik ilkelerini açıklamaktadır.

## 1. Mimari Katmanlar

```
┌─────────────────────────────────────────────────────────┐
│                    Kullanıcı Arayüzü                    │
│   (React + TypeScript + Canvas Interactive Charts)      │
└───────────────────────────▲─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│                 İstemci Servis Katmanı                  │
│       - stockService.ts (BIST Fiyat & Derinlik)         │
│       - kapService.ts (KAP & Ayrıştırılmış Söylenti)   │
│       - aiService.ts (6 Vadeli Skorlama & Rapor)        │
└───────────────────────────▲─────────────────────────────┘
                            │ (Güvenli WebSocket / REST)
┌───────────────────────────┴─────────────────────────────┐
│                 BFF / Backend Proxy Katmanı             │
│    (Node.js / Express / Next.js API Routes / Gateway)   │
│  - API Anahtarları ve Secret'lar burada saklanır       │
│  - Yetkilendirme & Hız Sınırlama (Rate Limiting)        │
└───────────────────────────▲─────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│   Lisanslı BIST Sağlayıcı │ │ KAP (Kamuyu Aydınlatma)   │
│ (Matriks / Foreks / FIX)  │ │ Resmi Bildirim Akışı      │
└───────────────────────────┘ └───────────────────────────┘
```

## 2. Güvenlik ve API Anahtarları Kuralı
- **API Anahtarları Asla Tarayıcıya Gönderilmez:** Lisanslı BIST veri sağlayıcılarının API anahtarları istemci tarafında (`window`, `localStorage`, veya client `.env`) bulunamaz. Tüm veri akışı backend proxy katmanı üzerinden geçirilir.
- **Hata Yönetimi ve Kesinti Toleransı:** Veri sağlayıcı API'sinde kesinti olması durumunda `stockService` otomatik olarak `feedState.status = 'error'` durumuna geçer. Kullanıcıya son geçerli veri, **"Veri güncellenemedi - Son geçerli veri gösteriliyor"** uyarısı ve net güncelleme zaman damgasıyla (`lastUpdated`) sunulur.

## 3. Canlı Veri Sağlayıcısına Geçiş Adımları
1. Backend sunucusuna `.env.example` dosyasındaki ortam değişkenlerini tanımlayın.
2. `stockService.ts` içindeki `startLiveSimulation()` metodunu lisanslı sağlayıcının WebSocket akışına bağlayın:
   ```typescript
   const ws = new WebSocket(process.env.BIST_WS_STREAM_URL);
   ws.onmessage = (event) => {
     const tick = JSON.parse(event.data);
     this.handleIncomingTick(tick);
   };
   ```
3. KAP duyuruları için `kapService.ts` içindeki `getAllNews()` metodunu backend'in `/api/kap/feed` uç noktasına bağlayın.
