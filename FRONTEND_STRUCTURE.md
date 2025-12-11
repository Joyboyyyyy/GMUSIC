# Frontend Essential Structure

```
Gretex music Room/
│
├── App.tsx                          # Root component
├── app.json                         # Expo configuration
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── eas.json                         # EAS Build configuration
├── babel.config.js                  # Babel configuration
│
└── src/
    │
    ├── components/                  # Reusable UI components
    │   ├── LoginRequired.tsx
    │   ├── PackCard.tsx
    │   ├── ProtectedScreen.tsx
    │   └── TestimonialCard.tsx
    │
    ├── screens/                     # Screen components
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── SignupScreen.tsx
    │   ├── chat/
    │   │   └── ChatScreen.tsx
    │   ├── settings/
    │   │   └── NotificationSettingsScreen.tsx
    │   ├── BrowseScreen.tsx
    │   ├── CheckoutScreen.tsx       # Razorpay payment integration
    │   ├── DashboardScreen.tsx
    │   ├── EditProfileScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── LibraryScreen.tsx
    │   ├── PackDetailScreen.tsx
    │   ├── PaymentSuccessScreen.tsx
    │   ├── PaymentTestScreen.tsx    # Razorpay test screen
    │   ├── ProfileScreen.tsx
    │   └── TrackPlayerScreen.tsx
    │
    ├── navigation/                  # Navigation configuration
    │   ├── AuthNavigator.tsx        # Auth flow navigation
    │   ├── MainNavigator.tsx        # Main app navigation
    │   ├── RootNavigator.tsx        # Root stack navigator
    │   └── types.ts                 # Navigation type definitions
    │
    ├── store/                       # State management (Zustand)
    │   ├── authStore.ts             # Authentication state
    │   ├── libraryStore.ts          # Library/packs state
    │   ├── notificationStore.ts     # Notifications state
    │   ├── purchasedCoursesStore.ts # Purchased courses state
    │   └── tipsStore.ts             # Tips state
    │
    ├── config/                      # Configuration files
    │   └── api.ts                   # API base URL & helpers
    │
    ├── types/                       # TypeScript type definitions
    │   ├── index.ts
    │   └── react-native-razorpay.d.ts  # Razorpay type declarations
    │
    ├── data/                        # Static/mock data
    │   ├── mockData.ts
    │   └── practiceTips.ts
    │
    ├── utils/                       # Utility functions
    │   ├── haptics.ts               # Haptic feedback
    │   └── notifications.ts         # Push notifications
    │
    └── hooks/                       # Custom React hooks
        └── (empty - for future use)
```

## Key Features

### Payment Integration
- **CheckoutScreen.tsx**: Full Razorpay payment flow
- **PaymentTestScreen.tsx**: Razorpay testing screen
- **PaymentSuccessScreen.tsx**: Post-payment success screen

### Navigation
- **AuthNavigator**: Handles login/signup flow
- **MainNavigator**: Main app screens (Home, Browse, Library, Profile)
- **RootNavigator**: Root level navigation with auth checks

### State Management
- **authStore**: User authentication & session
- **libraryStore**: Music packs/library management
- **purchasedCoursesStore**: Purchased content tracking
- **notificationStore**: App notifications
- **tipsStore**: Practice tips management

### Configuration
- **api.ts**: Dynamic API URL (LAN IP for devices, localhost for simulators)
- **types/**: TypeScript definitions including Razorpay

