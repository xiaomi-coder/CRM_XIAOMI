import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.eduprocrm.app',
  appName: 'EduControl Pro',
  webDir: 'dist',
  server: {
    // Production uchun - web saytingizdan yuklaydi
    url: 'https://eduprocrm.uz',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#059669',
      showSpinner: true,
      spinnerColor: '#ffffff'
    }
  }
};

export default config;
