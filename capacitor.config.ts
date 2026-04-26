import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.Terra.a842b7d3bde0425ebaa9259de51ba29a',
  appName: 'TerraGuardians',
  webDir: 'dist',
  android: {
    // Performance + UX hardening for Android WebView
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0F172A',
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#0F172A',
  },
  // Use https scheme on Android so localStorage / cookies behave like web
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#0F172A',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
  // For production APKs, bundle the built `dist` (default behavior).
};

export default config;
