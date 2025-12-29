export default {
    expo: {
      name: "Gretex Music Room",
      slug: "gretex-music-room",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      scheme: "gretexmusicroom",
      jsEngine: "hermes",
  
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#5b21b6"
      },
  
      assetBundlePatterns: ["**/*"],
  
      plugins: [
        "expo-dev-client",
        "expo-secure-store",
        "expo-apple-authentication"
      ],
  
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.gretexmusicroom.app",
        buildNumber: "1",
        infoPlist: {
          LSApplicationQueriesSchemes: [
            "razorpay",
            "tez",
            "phonepe",
            "paytmmp",
            "gpay",
            "upi"
          ],
          CFBundleURLTypes: [
            {
              CFBundleURLSchemes: ["gretexmusicroom"]
            }
          ],
          NSAppTransportSecurity: {
            NSAllowsArbitraryLoads: true
          },
          UIBackgroundModes: ["audio"]
        },
        usesAppleSignIn: true,
        associatedDomains: [
          "applinks:gretexmusicroom.com"
        ]
      },
  
      android: {
        package: "com.rogerr6969.gretexmusicroom",
        versionCode: 1,
        usesCleartextTraffic: true,
        intentFilters: [
          {
            action: "VIEW",
            data: [
              {
                scheme: "gretexmusicroom"
              }
            ],
            category: ["BROWSABLE", "DEFAULT"]
          }
        ],
        permissions: [
          "android.permission.INTERNET",
          "android.permission.ACCESS_NETWORK_STATE"
        ]
      },
  
      extra: {
        apiUrl: process.env.EXPO_PUBLIC_API_URL,
        eas: {
          projectId: "1fbc2dfb-9dbd-4f70-9059-0115a156ff04"
        }
      }
    }
  };
  