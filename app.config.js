export default {
    expo: {
      name: "Gretex Music Room",
      slug: "gretex-music-room",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      scheme: "gretexmusicroom",
  
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
  
      assetBundlePatterns: ["**/*"],
  
      plugins: [
        "expo-secure-store"
      ],
  
      android: {
        package: "com.rogerr6969.gretexmusicroom"
      },
  
      extra: {
        BACKEND_BASE_URL: "http://192.168.100.40:3000",
  
        eas: {
          projectId: "1fbc2dfb-9dbd-4f70-9059-0115a156ff04"
        }
      }
    }
  };
  