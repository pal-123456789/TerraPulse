# 🌍 TerraGuardians — AI-Powered Environmental Monitoring

> Real-time global environmental anomaly detection powered by NASA satellite data, weather APIs, and AI.

<p align="center">
  <a href="https://terraguardians.us"><img alt="Live demo" src="https://img.shields.io/badge/demo-live-00d9ff?style=for-the-badge"></a>
  <img alt="React" src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge">
</p>

**Live demo:** https://terra-pulse-watch.lovable.app

---

## ✨ Features

- 🌍 **Interactive global map** — Real-time anomaly visualization with 3D pulsating markers (Leaflet)
- 🤖 **AI anomaly detection** — Gemini-powered analysis of NASA satellite + weather data via Supabase Edge Functions
- 📊 **Advanced analytics** — 3D charts, radar diagrams, predictive modeling (React Three Fiber + Recharts)
- 🛰️ **Live satellite tracking** — Terra, Aqua, Aura, NOAA imagery via NASA EPIC/Earth APIs
- 🔔 **Multi-channel alerts** — Browser push, email (SendGrid), and in-app notifications
- 💬 **Realtime community chat** — Supabase Realtime with presence tracking
- 📚 **Learning hub** — Interactive courses with video, text, and quiz content
- 📱 **PWA + Native** — Installable on mobile, plus iOS/Android builds via Capacitor

---

## 🛠 Tech stack

| Layer | Tools |
|---|---|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **3D / VFX** | Three.js, React Three Fiber, Drei |
| **Maps** | Leaflet, React-Leaflet |
| **Charts** | Recharts |
| **Backend** | Supabase (Postgres, Auth, RLS, Edge Functions, Realtime, Storage) |
| **AI** | Google Gemini (via Lovable AI Gateway) |
| **Mobile** | Capacitor (iOS + Android) |

---

## 🚀 Quick start

### Prerequisites
- **Node.js** 18+ and npm
- A **Supabase** project (free tier works)

### Install & run

```bash
# 1. Clone
git clone https://github.com/<your-org>/terra-pulse-watch.git
cd terra-pulse-watch

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 4. Run dev server
npm run dev
```

Open http://localhost:8080.

### Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Vite dev server (port 8080) |
| `npm run build` | Production build → `dist/` |
| `npm run build:dev` | Dev-mode build (with source maps + tagger) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## 🌐 Deploying

### Option A — GitHub Pages (one-click via included workflow)

This repo ships with `.github/workflows/deploy.yml`. To use it:

1. **Repo Settings → Pages** → set **Source = GitHub Actions**
2. **Repo Settings → Secrets and variables → Actions** → add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Push to `main` — the site deploys automatically

You can also trigger it manually from the **Actions** tab.

### Option B — Vercel / Netlify / Cloudflare Pages

1. Import the repo
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add the same env vars


## 📱 Mobile

### PWA (recommended)
Visit the site on mobile → Browser menu → **Add to Home Screen**. Works offline, supports push notifications.

### Native (Capacitor)
```bash
npm run build
npx cap add ios       # or android
npx cap sync
npx cap open ios      # or android
```
See [capacitor.config.ts](capacitor.config.ts) for hot-reload setup.

---

## 📂 Project structure

```
terra-pulse-watch/
├── .github/
│   ├── workflows/         # CI + GitHub Pages deploy
│   └── ISSUE_TEMPLATE/
├── public/                # Static assets, manifest, robots.txt
├── src/
│   ├── components/
│   │   ├── 3D/            # Three.js / R3F effects
│   │   ├── Auth/          # Sign-in, user menu
│   │   ├── Chat/          # Realtime chat
│   │   ├── Dashboard/     # Charts and gauges
│   │   ├── Map/           # Leaflet map + overlays
│   │   └── ui/            # shadcn/ui primitives
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Route components
│   ├── integrations/
│   │   └── supabase/      # Generated Supabase client + types
│   ├── lib/               # Utilities
│   └── utils/             # Data export, helpers
├── supabase/
│   ├── functions/         # Edge functions (AI, alerts, predictions)
│   └── migrations/        # SQL migrations
├── capacitor.config.ts    # iOS / Android config
├── tailwind.config.ts
└── vite.config.ts
```

---

## 🔐 Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon (publishable) key |
| `VITE_SUPABASE_PROJECT_ID` | ⚪ | Used by some Supabase tooling |

> 🔒 Never commit private keys. Edge function secrets (Gemini API key, SendGrid API key, etc.) live in **Supabase → Edge Functions → Secrets**, not in the repo.

---

## ⚡ Performance

- React 18 + lazy-loaded routes (every page is a separate chunk)
- Vite auto code-splitting (no manual chunks → no race conditions)
- CSS code splitting + asset inlining for files <4 KB
- Three.js components mounted only on routes that need them
- Lenis smooth scroll **on mobile only**, native scroll on desktop
- `prefers-reduced-motion` respected everywhere
- Capacitor uses native WebView momentum on iOS/Android

---

## 🤝 Contributing

Pull requests welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, code style, and commit conventions.

---

## 📜 License

[MIT](LICENSE) © TerraGuardians

---

## 🔗 Links

- 🌐 [Live app](https://terraguardians.us)
- 📚 [Supabase docs](https://supabase.com/docs)
- 📱 [Capacitor docs](https://capacitorjs.com/docs)
- 🎓 [PWA guide](https://web.dev/progressive-web-apps/)
