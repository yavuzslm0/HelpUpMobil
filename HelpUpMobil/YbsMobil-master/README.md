# YbsMobil

React Native (Expo) tabanlı mobil uygulama projesi. Proje **frontend** ve **backend** olmak üzere iki ayrı modülden oluşmaktadır.

---

## 📁 Proje Yapısı

```
YbsMobil-master/
├── .gitignore
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── index.js
│   ├── package-lock.json
│   ├── package.json
│   ├── models/
│   │   ├── Asset.js
│   │   ├── Report.js
│   │   ├── Ticket.js
│   │   └── User.js
│   └── routes/
│       ├── assets.js
│       ├── auth.js
│       ├── reports.js
│       └── tickets.js
├── frontend/
│   ├── .expo/                  # Expo meta verileri
│   ├── .gitignore
│   ├── App.js
│   ├── app.json
│   ├── index.js
│   ├── package-lock.json
│   ├── package.json
│   ├── assets/
│   │   ├── android-icon-background.png
│   │   ├── android-icon-foreground.png
│   │   ├── android-icon-monochrome.png
│   │   ├── favicon.png
│   │   ├── icon.png
│   │   └── splash-icon.png
│   └── src/
│       ├── components/
│       │   ├── BottomTabs.js
│       │   └── Sidebar.js
│       ├── constants/
│       │   └── color.js
│       ├── navigation/
│       │   └── AppNavigator.js
│       ├── screens/
│       │   ├── AssetsScreen.js
│       │   ├── CreateTicketScreen.js
│       │   ├── DashboardScreen.js
│       │   ├── LoginScreen.js
│       │   ├── ProfileScreen.js
│       │   ├── ReportsScreen.js
│       │   └── TicketsScreen.js
│       ├── styles/
│       │   └── global.js
│       └── config.js
```

---

## 🚀 Kurulum ve Çalıştırma

### Backend

```bash
cd backend
npm install
# .env.example dosyasını .env olarak kopyala ve düzenle
copy .env.example .env
```

`.env` içinde aşağıdaki değerleri ayarlayın:

```env
MONGO_URI=mongodb+srv://<kullanici>:<sifre>@cluster0.xxxxx.mongodb.net/<veritabani>?appName=Cluster0
PORT=5000
JWT_SECRET=gizli_anahtar_buraya
```

Çalıştırma:

```bash
npm run dev       # Geliştirme (nodemon ile)
npm run start     # Prodüksiyon
```

### Frontend

```bash
cd frontend
npm install
npx expo start    # Expo geliştirme sunucusu
```

### Ngrok ve mobil cihazlarda test

1. `backend` klasöründe yeni bir terminal açın.
2. `npx ngrok http 5000` komutunu çalıştırın.
3. Terminaldeki `Forwarding` satırındaki `https://...ngrok-free.dev` adresini kopyalayın.
4. `frontend/src/config.js` içindeki `TUNNEL_URL` değerini bu adrese yapıştırın.

> `frontend/src/config.js` içinde `Platform.OS === 'web'` için `http://localhost:5000`, mobil için ise `ngrok` adresi kullanılıyor.

---

## 🛠️ Teknoloji Yığını

| Katman    | Teknoloji                          |
|-----------|------------------------------------|
| Frontend  | React Native, Expo                 |
| Backend   | Node.js, Express.js                |
| Veritabanı| MongoDB (Mongoose)                 |
| Auth      | JWT (jsonwebtoken), bcryptjs       |

---

## 🔧 Paket Komutları

### Backend

- `npm run dev` — Geliştirme sunucusu (nodemon)
- `npm run start` — Prodüksiyon sunucusu

### Frontend

- `npm start` — Expo Metro başlatır
- `npm run android` — Android emülatör veya bağlı cihazda açar
- `npm run ios` — iOS simülatörde açar
- `npm run web` — Web tarayıcıda çalıştırır

---

## 📡 API Endpointleri

| Method | Endpoint                      | Açıklama                                  | Yetki |
|--------|-------------------------------|-------------------------------------------|-------|
| POST   | `/api/auth/login`             | Kullanıcı girişi                          | Herkes |
| POST   | `/api/auth/register`          | Yeni kullanıcı kaydı                      | Herkes |
| PUT    | `/api/auth/profile`           | Profil güncelleme                         | Auth |
| PUT    | `/api/auth/password`          | Şifre değiştirme                          | Auth |
| GET    | `/api/tickets`                | Talepleri listele                         | Herkes |
| POST   | `/api/tickets`                | Yeni talep oluştur                        | Herkes |
| GET    | `/api/tickets/stats`          | Dashboard istatistikleri                  | Herkes |
| GET    | `/api/tickets/:id`            | Tek talep getir                            | Herkes |
| PUT    | `/api/tickets/:id/approve`    | Talebi onayla                             | Herkes |
| PUT    | `/api/tickets/:id/reject`     | Talebi reddet                             | Herkes |
| PUT    | `/api/tickets/:id/status`     | Talep durumunu güncelle                   | Herkes |
| GET    | `/api/assets`                 | Varlıkları listele                        | Herkes |
| POST   | `/api/assets`                 | Yeni varlık ekle                          | Herkes |
| GET    | `/api/reports`                | Raporları listele                         | Auth (ADMIN/MANAGER) |
| POST   | `/api/reports`                | Yeni rapor oluştur                        | Manager |
| PUT    | `/api/reports/:id`            | Raporu güncelle                           | Manager |
| DELETE | `/api/reports/:id`            | Raporu sil                               | Manager |
| PUT    | `/api/reports/:id/grant`      | Admin'e rapor erişim yetkisi ver         | Manager |
| PUT    | `/api/reports/:id/revoke`     | Admin erişimini kaldır                   | Manager |
| GET    | `/api/reports/admins`         | Admin listesini getir                     | Manager |
| POST   | `/api/reports/auto-generate`  | Otomatik performans raporu oluştur        | Manager |

---

## 📌 Önemli Notlar

- `backend/.env` dosyası git'e dahil edilmemelidir.
- `frontend/src/config.js` içinde mobil test için `TUNNEL_URL` güncellenmelidir.
- Backend `index.js` `MONGO_URI` ve `JWT_SECRET` ortam değişkenlerini kullanır.
- Protected rapor rotaları için `Authorization: Bearer <token>` başlığı gereklidir.
