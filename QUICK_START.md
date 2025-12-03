# ⚡ Quick Start - Get Running in 5 Minutes

## 🎯 Step-by-Step

### 1️⃣ Install Dependencies (First Time Only)
```bash
cd "Gretex music Room"
npm install
```

### 2️⃣ Start the App
```bash
npm start
```

### 3️⃣ Open on Your Device
- **Phone**: Scan QR code with Expo Go app
- **iOS Simulator**: Press `i` in terminal
- **Android Emulator**: Press `a` in terminal

## 🎮 Test the App

### Test Login
```
1. App opens to Login screen
2. Enter ANY email and password
3. Click "Login"
4. You're in! 🎉
```

### Test Signup
```
1. Click "Don't have an account? Sign up"
2. Fill in name, email, password
3. Confirm password
4. Click "Sign Up"
5. You're in! 🎉
```

### Test Purchase Flow
```
1. Browse packs on Home screen
2. Click any pack
3. View details
4. Click "Buy Now"
5. Review order
6. Click "Complete Payment"
7. Success! Check Library
```

### Test Preview Tracks
```
1. Open any pack
2. Click tracks with "Preview" badge
3. They play without purchase
4. Locked tracks show alert
```

## 🎨 What You'll See

### Home Screen
- Personalized greeting
- Featured lessons
- Category cards
- Featured teachers
- Trending packs
- New releases

### Browse Screen
- Category filters
- All packs in grid
- Filter by: Guitar, Piano, Drums, Vocal, Production, DJ, Songwriting

### Pack Detail
- Beautiful pack page (Udemy-style)
- Teacher info
- Stats (lessons, duration, rating)
- Complete track list
- Preview indicators
- Buy button

### Library
- All purchased packs
- Learning stats
- Continue learning section

### Profile
- User info
- Statistics
- Settings menu
- Logout

## 📱 Screenshots Expected

You should see:
- ✅ Purple theme throughout
- ✅ Modern, clean design
- ✅ Tab bar at bottom (Home, Browse, Library, Profile)
- ✅ Smooth navigation
- ✅ Beautiful cards and images
- ✅ Professional typography

## 🐛 Troubleshooting

### Can't scan QR code?
- Make sure Expo Go app is installed
- Make sure phone and computer are on same WiFi
- Try `npx expo start --tunnel`

### App won't start?
```bash
# Clear cache and restart
npx expo start -c
```

### Something looks broken?
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
npm start
```

## 🎯 Common Commands

```bash
# Start normally
npm start

# Start with cache clear
npx expo start -c

# Start on specific platform
npx expo start --ios
npx expo start --android

# Install new package
npm install package-name
```

## 🎨 Customization Quick Tips

### Change Primary Color
Find and replace `#7c3aed` with your color in all files

### Add More Mock Packs
Edit `src/data/mockData.ts` → `mockPacks` array

### Change App Name
Edit `app.json` → `name` and `slug`

## 🚀 You're Ready!

The app is fully functional with:
- ✅ 10 complete screens
- ✅ Full navigation
- ✅ Authentication flow
- ✅ Purchase flow
- ✅ Mock data
- ✅ Beautiful UI

Just run `npm start` and start exploring!

## 📚 Need More Help?

- **Setup Details**: See `SETUP_GUIDE.md`
- **Full Documentation**: See `README.md`
- **Project Overview**: See `PROJECT_SUMMARY.md`

---

**Happy coding! 🎵 Your Udemy-style music app is ready to rock!**

