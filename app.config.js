export default {
    expo: {
      name: "Gretex Music Room",
      slug: "gretex-music-room",
      version: "1.0.1",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      scheme: "gretexmusicroom",
      jsEngine: "hermes",
  
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#000000"
      },
  
      assetBundlePatterns: ["**/*"],
  
      plugins: [
        "expo-dev-client",
        "expo-secure-store",
        "expo-apple-authentication",
        [
          "expo-location",
          {
            locationAlwaysAndWhenInUsePermission: "Allow Gretex Music Room to use your location to find nearby music buildings."
          }
        ],
        "@maplibre/maplibre-react-native",
        [
          "@react-native-google-signin/google-signin",
          {
            iosUrlScheme: "com.googleusercontent.apps.600437075384-kk1rfkb9jmmqgm3413iddam4hrhf717k"
          }
        ]
      ],
  
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.gretexmusicroom.app",
        buildNumber: "1",
        config: {
          googleMapsApiKey: "AIzaSyBJEnDWhnnqJgdnmGv84ATJ0QDm60Jo19U"
        },
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
          UIBackgroundModes: ["audio"],
          NSLocationWhenInUseUsageDescription: "Allow Gretex Music Room to use your location to find nearby music buildings.",
          NSLocationAlwaysUsageDescription: "Allow Gretex Music Room to use your location to find nearby music buildings."
        },
        usesAppleSignIn: true,
        associatedDomains: [
          "applinks:gretexmusicroom.com"
        ]
      },
  
      android: {
        package: "com.gretexmusicroom.app",
        versionCode: 2,
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#000000"
        },
        config: {
          googleMaps: {
            apiKey: "AIzaSyBJEnDWhnnqJgdnmGv84ATJ0QDm60Jo19U"
          }
        },
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
          "android.permission.ACCESS_NETWORK_STATE",
          "android.permission.ACCESS_FINE_LOCATION",
          "android.permission.ACCESS_COARSE_LOCATION"
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
  