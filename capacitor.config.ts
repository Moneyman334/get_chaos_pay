import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chaoscrypto.casino',
  appName: 'Chaos Crypto Casino',
  webDir: 'dist/public',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a0b2e",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#a855f7"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: "#1a0b2e"
    }
  }
};

export default config;
