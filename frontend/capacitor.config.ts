import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bloodpressure.app',
  appName: '血压记录APP',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#1890FF",
      sound: "beep.wav",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 1000,
      backgroundColor: "#1890FF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#FFFFFF",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    StatusBar: {
      backgroundColor: "#1890FF",
      style: "LIGHT",
      overlaysWebView: false
    },
    App: {
      disallowOverscroll: true
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
    Device: {
      // Device info for health tracking
    },
    Haptics: {
      // For feedback on button presses - helpful for elderly users
    }
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#1890FF"
  },
  android: {
    backgroundColor: "#1890FF",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: "BloodPressureApp/1.0",
    overrideUserAgent: undefined,
    hideLogs: true,
    minWebViewVersion: 60
  }
};

export default config;
