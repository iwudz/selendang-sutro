import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.selendangsutro.app',
  appName: 'Selendang Sutro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10b981',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#10b981'
    }
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'true',
      Orientation: 'portrait',
      BackgroundColor: '0xffffffff',
      DisallowOverscroll: 'true',
      UIWebViewDecelerationSpeed: 'fast'
    }
  }
};

export default config;
