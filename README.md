# Terra Pulse Watch - AI-Powered Environmental Monitoring

Real-time global environmental monitoring and anomaly detection platform using NASA satellite data, weather systems, and AI-powered analysis.

**Live URL**: https://terra-pulse-watch.lovable.app

## Features

- 🌍 **Interactive Global Map** - Real-time visualization of environmental anomalies worldwide
- 🤖 **AI Anomaly Detection** - Machine learning powered detection of environmental threats
- 📊 **Advanced Analytics** - 3D charts, radar diagrams, and predictive modeling
- 🔔 **Push Notifications** - Real-time alerts for critical environmental events
- 📚 **Learning Hub** - Interactive courses on environmental science
- 💬 **Live Chat** - Real-time community discussions with presence tracking

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **3D Graphics**: Three.js, React Three Fiber
- **Maps**: Leaflet, React-Leaflet
- **Charts**: Recharts

---

## 📱 Mobile Application

Terra Pulse Watch supports **two mobile deployment options**:

### Option 1: Progressive Web App (PWA) - Recommended

The easiest way to use Terra Pulse Watch on mobile. The app is installable directly from your browser!

#### Installation on Mobile:

**iOS (iPhone/iPad):**
1. Open Safari and visit https://terra-pulse-watch.lovable.app
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** to confirm
5. The app will appear on your home screen like a native app

**Android:**
1. Open Chrome and visit https://terra-pulse-watch.lovable.app
2. Tap the **three-dot menu** (⋮) in the top right
3. Tap **"Install app"** or **"Add to Home Screen"**
4. Confirm the installation
5. The app will appear in your app drawer

#### PWA Features:
- ✅ Works offline
- ✅ Fast loading with caching
- ✅ Push notifications
- ✅ Automatic updates
- ✅ No app store required

---

### Option 2: Native Mobile App (Capacitor)

For full native features (camera, sensors, etc.) and app store distribution.

#### Prerequisites:
- **Node.js** 18+ and npm
- **Git** for version control
- **For iOS**: Mac with Xcode 15+ installed
- **For Android**: Android Studio with SDK 33+

#### Setup Instructions:

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd terra-pulse-watch

# 2. Install dependencies
npm install

# 3. Add native platforms
npx cap add ios      # For iOS development
npx cap add android  # For Android development

# 4. Build the web app
npm run build

# 5. Sync web code to native projects
npx cap sync

# 6. Open in native IDE
npx cap open ios     # Opens Xcode
npx cap open android # Opens Android Studio
```

#### Running on Device/Emulator:

```bash
# Run on connected Android device or emulator
npx cap run android

# Run on iOS simulator or connected device
npx cap run ios
```

#### Hot Reload During Development:

The app is pre-configured for live reload. When running through Capacitor, it connects to the Lovable preview server, so changes you make in Lovable appear instantly on your device.

To switch to local development:

1. Edit `capacitor.config.ts`
2. Comment out or remove the `server.url` line
3. Run `npx cap sync` to use local builds instead

#### Building for Release:

**Android APK:**
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/
```

**iOS App Store:**
1. Open Xcode: `npx cap open ios`
2. Select your team in Signing & Capabilities
3. Product → Archive
4. Distribute via App Store Connect

---

## 🚀 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📂 Project Structure

```
terra-pulse-watch/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── 3D/           # Three.js/R3F components
│   │   ├── Chat/         # Real-time chat components
│   │   ├── Dashboard/    # Analytics charts
│   │   ├── Map/          # Leaflet map components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Route pages
│   ├── integrations/     # Supabase client & types
│   └── lib/              # Utility functions
├── supabase/
│   └── functions/        # Edge functions
├── public/               # Static assets
└── capacitor.config.ts   # Mobile app configuration
```

---

## 🔗 Useful Links

- [Lovable Project](https://lovable.dev/projects/a842b7d3-bde0-425e-baa9-259de51ba29a)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Supabase Documentation](https://supabase.com/docs)

---

## 📄 License

This project is built with [Lovable](https://lovable.dev).
