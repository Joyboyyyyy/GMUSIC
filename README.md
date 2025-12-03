# 🎵 Gretex Music Room - Music Learning Platform

A beautiful, Udemy-style music learning app built with React Native and Expo. Learn music from the best instructors with interactive lessons, video tutorials, and comprehensive course content.

## ✨ Features

### 🎯 Core Features
- **User Authentication** - Login and signup with form validation
- **Browse by Category** - Guitar, Piano, Drums, Vocal Training, Music Production, DJ & Mixing, Songwriting
- **Featured Content** - Trending lessons, featured teachers, and new releases
- **Pack Details** - Comprehensive course pages similar to Udemy
- **Preview Lessons** - Try before you buy with free preview tracks
- **Secure Checkout** - Multi-step checkout process with payment options
- **My Library** - Access all purchased lesson packs
- **Track Player** - Video/audio player with playlist support
- **User Profile** - Manage account settings and preferences

### 🔐 Login Required Logic
- Users can browse all content freely
- Purchase requires authentication (redirects to login)
- Mock authentication system (ready for backend integration)

### 🎨 Beautiful UI/UX
- Modern, clean design inspired by Udemy
- Smooth animations and transitions
- Responsive layouts
- Tab-based navigation
- Stack-based navigation for details

## 📂 Project Structure

```
gretex-music-room/
├── App.tsx                          # Main app entry point
├── src/
│   ├── components/
│   │   └── PackCard.tsx            # Reusable pack card component
│   ├── data/
│   │   └── mockData.ts             # Mock data for testing
│   ├── navigation/
│   │   ├── RootNavigator.tsx       # Root navigation logic
│   │   ├── AuthNavigator.tsx       # Auth stack (Login/Signup)
│   │   ├── MainNavigator.tsx       # Main tab navigator
│   │   └── types.ts                # Navigation type definitions
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
│   │   ├── HomeScreen.tsx          # Featured content
│   │   ├── BrowseScreen.tsx        # Browse by category
│   │   ├── PackDetailScreen.tsx    # Course detail page
│   │   ├── TrackPlayerScreen.tsx   # Video/audio player
│   │   ├── CheckoutScreen.tsx      # Payment & checkout
│   │   ├── LibraryScreen.tsx       # Purchased packs
│   │   └── ProfileScreen.tsx       # User profile
│   ├── store/
│   │   ├── authStore.ts            # Authentication state (Zustand)
│   │   └── libraryStore.ts         # Library/purchases state
│   └── types/
│       └── index.ts                # TypeScript type definitions
├── package.json
├── tsconfig.json
├── app.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Navigate to the project directory:**
```bash
cd "Gretex music Room"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm start
```

4. **Run on your device:**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 📱 App Flow

### 1. Authentication
- New users are greeted with the Login screen
- Can switch to Signup to create an account
- Mock authentication (any email/password works for demo)

### 2. Home Screen
- Featured lessons
- Browse by category quick access
- Featured teachers
- Trending and new releases

### 3. Browse Screen
- Filter lessons by category
- Grid view of all packs
- Real-time filtering

### 4. Pack Detail Screen (Udemy-style)
- Course overview
- Teacher information
- Stats (lessons, duration, rating, students)
- Complete track listing
- Preview badges for free tracks
- Buy Now button (requires login)

### 5. Checkout Screen
- Order summary
- Payment method selection (Card/UPI/Net Banking)
- Price breakdown with GST
- Secure payment notice
- **Login Required** - redirects if not authenticated

### 6. Track Player
- Video/audio playback interface
- Progress bar with time tracking
- Play/Pause controls
- Previous/Next track navigation
- Full playlist view
- Additional controls (repeat, volume, settings, download)

### 7. Library Screen
- All purchased packs
- Learning statistics
- Continue learning section
- Empty state with call-to-action

### 8. Profile Screen
- User information
- Learning statistics
- Settings and preferences
- Logout functionality

## 🎨 Design Highlights

### Color Scheme
- Primary: `#7c3aed` (Purple)
- Secondary: `#5b21b6` (Dark Purple)
- Background: `#f9fafb` (Light Gray)
- Text: `#1f2937` (Dark Gray)
- Accent: Various category colors

### Typography
- Consistent font sizes and weights
- Clear hierarchy
- Readable line heights

### Components
- Rounded corners (12px radius)
- Subtle shadows for depth
- Smooth transitions
- Loading states
- Empty states

## 🔌 Backend Integration Ready

The app uses Zustand for state management and is ready for backend integration:

### Authentication (`authStore.ts`)
```typescript
// Replace mock login with real API call
await fetch('YOUR_API/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})
```

### Data Fetching
Replace mock data imports with API calls:
- `GET /packs` - Get all music packs
- `GET /packs/:id` - Get pack details
- `GET /packs/:id/tracks` - Get pack tracks
- `POST /orders` - Create order
- `GET /library` - Get user's purchased packs

## 🎯 Key Features Implementation

### Login-Required Logic
```typescript
const handleBuyNow = () => {
  if (!isAuthenticated) {
    Alert.alert('Login Required', 'Please login to purchase', [
      { text: 'Login', onPress: () => navigate('Auth') }
    ]);
    return;
  }
  navigation.navigate('Checkout', { pack });
};
```

### Preview vs Locked Content
```typescript
const handleTrackPress = (trackId) => {
  const track = tracks.find(t => t.id === trackId);
  if (track.isPreview || isPurchased) {
    // Play track
  } else {
    Alert.alert('Premium Content', 'Purchase to access');
  }
};
```

## 📦 Dependencies

### Core Framework
- **expo** ~54.0.0 - Development platform (SDK 54)
- **react** 19.1.0 - React 19 with latest features
- **react-native** 0.81.5 - Latest stable

### UI & Navigation
- **@react-navigation/native** - Navigation library
- **@react-navigation/bottom-tabs** - Tab navigation
- **@react-navigation/native-stack** - Stack navigation
- **@expo/vector-icons** ^15.0.3 - Icon library

### Features
- **zustand** - State management
- **expo-av** ~16.0.7 - Audio/video playback
- **expo-linear-gradient** ~15.0.7 - Gradient backgrounds
- **expo-status-bar** ~3.0.8 - Status bar control

## 🔧 Customization

### Adding New Categories
Edit `src/data/mockData.ts`:
```typescript
export const categories = [
  { name: 'YourCategory', icon: '🎼', color: '#color' },
  // ...
];
```

### Changing Theme Colors
Update color values throughout the stylesheets:
```typescript
const PRIMARY_COLOR = '#7c3aed';
const SECONDARY_COLOR = '#5b21b6';
```

## 📝 Mock Data

The app includes comprehensive mock data for testing:
- 4 Teachers with realistic profiles
- 8 Music Packs across all categories
- Track listings with preview flags
- Realistic pricing and statistics

## 🚀 Production Checklist

Before deploying to production:

1. ✅ Replace mock authentication with real API
2. ✅ Implement actual payment gateway (Stripe/Razorpay)
3. ✅ Connect to real backend API
4. ✅ Add error handling and retry logic
5. ✅ Implement video/audio streaming
6. ✅ Add analytics tracking
7. ✅ Set up push notifications
8. ✅ Add proper image assets
9. ✅ Configure app icons and splash screen
10. ✅ Test on physical devices

## 📄 License

MIT License - feel free to use this project for learning or as a base for your own app.

## 🤝 Contributing

Contributions are welcome! This is a demonstration project showing best practices for:
- React Native app architecture
- Navigation patterns
- State management
- UI/UX design
- TypeScript usage

## 📧 Support

For questions or issues, please open an issue on the repository.

---

Built with ❤️ using React Native & Expo

**Happy Learning! 🎵**

