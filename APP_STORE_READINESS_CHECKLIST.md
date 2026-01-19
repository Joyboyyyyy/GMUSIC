# 📱 App Store Submission Readiness Checklist

**App Name:** Gretex Music Room  
**Package:** com.gretexmusicroom.app  
**Version:** 1.0.1  
**Date:** January 16, 2026

---

## ✅ Technical Requirements

### App Configuration
- ✅ App name: "Gretex Music Room"
- ✅ Package ID: com.gretexmusicroom.app (Android)
- ✅ Bundle ID: com.gretexmusicroom.app (iOS)
- ✅ Version: 1.0.1
- ✅ Build number: 2 (Android), 1 (iOS)
- ✅ Orientation: Portrait
- ✅ Deep linking configured: gretexmusicroom://
- ✅ Error boundary implemented
- ✅ Dark mode support

### Permissions & Capabilities
- ✅ Location permissions (for nearby buildings)
- ✅ Camera permissions (for profile picture)
- ✅ Photo library permissions
- ✅ Internet permission
- ✅ Network state permission
- ✅ Apple Sign-In configured
- ✅ Google Sign-In configured
- ✅ Razorpay payment integration

### Platform-Specific Configuration

#### Android
- ✅ Package: com.gretexmusicroom.app
- ✅ Version code: 2
- ✅ Adaptive icon configured
- ✅ Intent filters for deep linking
- ✅ All required permissions listed
- ✅ Google Maps API key configured

#### iOS
- ✅ Bundle ID: com.gretexmusicroom.app
- ✅ Build number: 1
- ✅ Tablet support enabled
- ✅ Apple Sign-In enabled
- ✅ URL schemes configured
- ✅ Associated domains configured
- ✅ Location usage descriptions
- ✅ NSAppTransportSecurity configured
- ✅ Audio background mode enabled

---

## 🔴 CRITICAL - Must Fix Before Submission

### 1. Privacy Policy & Terms of Service
**Status:** ❌ NOT CREATED  
**Required:** Yes (mandatory for both stores)  
**Action Items:**
- [ ] Create comprehensive Privacy Policy
  - Data collection practices
  - Data usage and storage
  - Third-party services (Razorpay, Google, Supabase)
  - User rights and data deletion
  - Contact information
- [ ] Create Terms of Service
  - User responsibilities
  - Acceptable use policy
  - Limitation of liability
  - Dispute resolution
- [ ] Host on accessible URLs
- [ ] Add links in app (Settings > About > Terms & Conditions, Privacy Policy)

**Timeline:** 1-2 days

### 2. Backend Deployment
**Status:** ❌ NOT DEPLOYED  
**Required:** Yes (app won't work without it)  
**Action Items:**
- [ ] Deploy backend to Railway
- [ ] Set production environment variables
- [ ] Run database migrations
- [ ] Test all API endpoints
- [ ] Get production URL
- [ ] Update `.env` with production URL

**Timeline:** 1-2 days

### 3. Google Maps API Key
**Status:** ✅ NOT NEEDED  
**Note:** Maps feature is "Coming Soon" with lock overlay - no API key required

### 4. App Store Assets
**Status:** ❌ NOT PREPARED  
**Required:** Yes (for store listing)  
**Action Items:**

#### Screenshots (Google Play Store)
- [ ] Phone screenshots (5-8 images)
  - Login screen
  - Home/Browse screen
  - Course detail screen
  - Checkout screen
  - Dashboard screen
  - Profile screen
- [ ] Tablet screenshots (optional but recommended)
- [ ] 7-inch tablet screenshots
- [ ] 10-inch tablet screenshots
- [ ] All screenshots must be 1080x1920px or 1440x2560px
- [ ] Add captions/text overlays explaining features

#### Screenshots (Apple App Store)
- [ ] iPhone screenshots (5-8 images)
  - 6.7" display (iPhone 14 Pro Max)
  - 5.5" display (iPhone 8 Plus)
- [ ] iPad screenshots (optional)
- [ ] All screenshots must be exact device dimensions
- [ ] Add captions/text overlays

#### App Icon
- [ ] 1024x1024px PNG (required)
- [ ] No rounded corners (system applies them)
- [ ] No transparency
- [ ] Verify at: `./assets/icon.png`

#### App Description
- [ ] Short description (80 characters max)
  - Example: "Learn music from expert instructors. Book classes, purchase courses, and master your instrument."
- [ ] Full description (4000 characters max)
  - Features overview
  - Key benefits
  - Supported instruments
  - Teacher qualifications
  - Booking system
  - Payment methods

#### Keywords/Tags
- [ ] Music learning
- [ ] Online courses
- [ ] Guitar lessons
- [ ] Piano lessons
- [ ] Music education
- [ ] Instrument learning
- [ ] Music classes
- [ ] Online tutoring

#### Promotional Text
- [ ] Short promotional message (170 characters)
  - Example: "Master music with expert instructors. Book flexible time slots and learn at your pace."

#### Support URL
- [ ] Create support page
- [ ] Add contact email
- [ ] Add FAQ section

#### Privacy Policy URL
- [ ] Host privacy policy online
- [ ] Ensure it's accessible from app

---

## 🟡 Important - Should Fix Before Submission

### 5. Razorpay Live Keys
**Status:** ⚠️ USING TEST KEYS  
**Current:** `RAZORPAY_KEY_ID=rzp_test_*`  
**Action Items:**
- [ ] Complete Razorpay KYC verification
- [ ] Get live API keys
- [ ] Update in Railway environment variables
- [ ] Test payment flow with live keys
- [ ] Verify payment processing

**Timeline:** 1-3 days (KYC approval)

### 6. Email Configuration
**Status:** ⚠️ NEEDS VERIFICATION  
**Current:** Using Hostinger SMTP  
**Action Items:**
- [ ] Test email sending in production
- [ ] Verify password reset emails work
- [ ] Verify verification emails work
- [ ] Check email deliverability
- [ ] Consider using SendGrid or AWS SES for better reliability

**Timeline:** 1 day

### 7. Content Rating
**Status:** ⚠️ NOT COMPLETED  
**Required:** Yes (for store submission)  
**Action Items:**

#### Google Play Store
- [ ] Complete content rating questionnaire
- [ ] Select appropriate rating (Everyone, Teen, Mature, etc.)
- [ ] Answer questions about:
  - Violence
  - Sexual content
  - Profanity
  - Alcohol/tobacco
  - Gambling
  - Other content

#### Apple App Store
- [ ] Complete age rating questionnaire
- [ ] Select appropriate rating (4+, 12+, 17+)
- [ ] Answer questions about content

**Timeline:** 30 minutes

### 8. Testing on Real Devices
**Status:** ⚠️ NEEDS VERIFICATION  
**Action Items:**
- [ ] Test on Android device (physical phone)
- [ ] Test on iOS device (physical iPhone) - if submitting to App Store
- [ ] Test all user flows:
  - [ ] Sign up / Login
  - [ ] Email verification
  - [ ] Password reset
  - [ ] Browse courses
  - [ ] Search functionality
  - [ ] Course details
  - [ ] Add to cart
  - [ ] Checkout
  - [ ] Payment (test mode)
  - [ ] Dashboard
  - [ ] Profile
  - [ ] Dark mode toggle
  - [ ] Notifications
  - [ ] Deep linking
- [ ] Test on different screen sizes
- [ ] Test with slow internet
- [ ] Test offline behavior

**Timeline:** 2-3 days

---

## 🟢 Minor - Nice to Have

### 9. Error Tracking
**Status:** ❌ NOT CONFIGURED  
**Recommendation:** Add Sentry for production error tracking  
**Action Items:**
- [ ] Install Sentry SDK
- [ ] Configure error reporting
- [ ] Test error tracking
- [ ] Set up alerts

### 10. Analytics
**Status:** ❌ NOT CONFIGURED  
**Recommendation:** Add Firebase Analytics  
**Action Items:**
- [ ] Set up Firebase project
- [ ] Install Firebase SDK
- [ ] Track key events
- [ ] Monitor user behavior

### 11. App Store Optimization (ASO)
**Status:** ⚠️ BASIC  
**Action Items:**
- [ ] Research keywords
- [ ] Optimize app title
- [ ] Optimize description
- [ ] A/B test screenshots
- [ ] Monitor reviews and ratings

---

## 📋 Google Play Store Submission Checklist

### Before Submission
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Accept Google Play Developer Program Policies
- [ ] Set up payment method
- [ ] Create app listing
- [ ] Fill in all required fields:
  - [ ] App name
  - [ ] Short description
  - [ ] Full description
  - [ ] Screenshots (minimum 2)
  - [ ] Feature graphic (1024x500px)
  - [ ] Icon (512x512px)
  - [ ] Category
  - [ ] Content rating
  - [ ] Privacy policy URL
  - [ ] Support email
  - [ ] Support website (optional)

### Build & Upload
- [ ] Build production AAB (Android App Bundle)
  ```bash
  eas build --platform android --profile production
  ```
- [ ] Download AAB file
- [ ] Upload to Google Play Console
- [ ] Review app details
- [ ] Set pricing (free or paid)
- [ ] Select countries/regions
- [ ] Submit for review

### After Submission
- [ ] Monitor review status (typically 2-4 hours)
- [ ] Address any rejection reasons
- [ ] Resubmit if rejected
- [ ] Monitor for crashes after launch
- [ ] Respond to user reviews

---

## 📋 Apple App Store Submission Checklist

### Before Submission
- [ ] Create Apple Developer account ($99/year)
- [ ] Accept Apple Developer Program Agreement
- [ ] Create App ID in App Store Connect
- [ ] Create app listing:
  - [ ] App name
  - [ ] Subtitle
  - [ ] Description
  - [ ] Keywords
  - [ ] Support URL
  - [ ] Privacy policy URL
  - [ ] Screenshots (minimum 2 per device)
  - [ ] Preview video (optional)
  - [ ] App icon (1024x1024px)
  - [ ] Category
  - [ ] Content rating
  - [ ] Age rating

### Build & Upload
- [ ] Build production IPA
  ```bash
  eas build --platform ios --profile production
  ```
- [ ] Download IPA file
- [ ] Upload to App Store Connect using Transporter
- [ ] Review app details
- [ ] Set pricing (free or paid)
- [ ] Select territories
- [ ] Submit for review

### After Submission
- [ ] Monitor review status (typically 1-3 days)
- [ ] Address any rejection reasons
- [ ] Resubmit if rejected
- [ ] Monitor for crashes after launch
- [ ] Respond to user reviews

---

## 🚀 Submission Timeline

### Week 1
- **Day 1-2:** Create privacy policy & terms
- **Day 2-3:** Deploy backend to Railway
- **Day 3:** Get Google Maps API key
- **Day 3-4:** Prepare app store assets (screenshots, descriptions)
- **Day 4:** Complete content rating questionnaire

### Week 2
- **Day 1:** Final testing on real devices
- **Day 1-2:** Build production APK/AAB
- **Day 2:** Submit to Google Play Store
- **Day 2-3:** Wait for review (typically 2-4 hours)
- **Day 3:** App goes live on Google Play Store

### Week 3 (iOS - if applicable)
- **Day 1:** Build production IPA
- **Day 1:** Submit to Apple App Store
- **Day 1-3:** Wait for review (typically 1-3 days)
- **Day 3-4:** App goes live on Apple App Store

---

## ⚠️ Common Rejection Reasons to Avoid

### Google Play Store
- ❌ Broken links or non-functional features
- ❌ Crashes on startup
- ❌ Missing privacy policy
- ❌ Misleading app description
- ❌ Inappropriate content
- ❌ Excessive ads
- ❌ Spam or repetitive content
- ❌ Violating payment policies

### Apple App Store
- ❌ Crashes or bugs
- ❌ Incomplete app (placeholder content)
- ❌ Missing privacy policy
- ❌ Misleading screenshots
- ❌ Violating App Store guidelines
- ❌ Requiring account creation without clear benefit
- ❌ Excessive permissions requests
- ❌ Broken links

---

## 📞 Support & Resources

### Documentation
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Apple App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Razorpay Documentation](https://razorpay.com/docs/)

### Tools
- [App Store Screenshot Generator](https://www.appscreenshotgenerator.com/)
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
- [Terms of Service Generator](https://www.termsfeed.com/terms-service-generator/)

---

## ✅ Final Checklist Before Clicking "Submit"

- [ ] All critical issues fixed
- [ ] Privacy policy & terms created and linked
- [ ] Backend deployed and tested
- [ ] Google Maps API key configured
- [ ] App store assets prepared
- [ ] Content rating completed
- [ ] Tested on real devices
- [ ] No crashes or major bugs
- [ ] All features working
- [ ] Payment flow tested (test mode)
- [ ] Deep linking tested
- [ ] Dark mode tested
- [ ] Permissions working correctly
- [ ] App icon and screenshots look good
- [ ] Description is accurate and compelling
- [ ] Support contact information provided
- [ ] Privacy policy URL is accessible
- [ ] No hardcoded test data
- [ ] No console errors or warnings
- [ ] App version incremented

---

## 🎯 Current Status: 70% Ready for App Store

### ✅ Ready (70%)
- App architecture and code quality
- All features implemented
- Authentication system
- Payment integration
- Design system
- Error handling
- Deep linking
- Maps feature (Coming Soon - no API needed)

### ❌ Not Ready (30%)
- Privacy policy & terms (CRITICAL)
- Backend deployment (CRITICAL)
- App store assets (CRITICAL)
- Content rating (IMPORTANT)
- Real device testing (IMPORTANT)

### 🎯 Next Steps
1. **Today:** Create privacy policy & terms
2. **Tomorrow:** Deploy backend to Railway
3. **Day 3:** Get Google Maps API key
4. **Day 4:** Prepare app store assets
5. **Day 5:** Complete content rating
6. **Day 6-7:** Final testing and submission

---

**Estimated time to submission: 5-7 days**  
**Estimated time to approval: 2-4 hours (Google Play) + 1-3 days (Apple)**

Good luck with your submission! 🚀
