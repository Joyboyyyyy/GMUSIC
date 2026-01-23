# Signup Timeout Fix - Render Cold Start Issue

## The Problem

When trying to signup, the app shows this error:

```
Signup Failed
Cannot connect to server at https://gmusic-ivdh.onrender.com. Please ensure:
1. Backend server is running
2. Network connection is active  
3. Server is accessible from this device
```

## Root Cause

**Render Free Tier Cold Starts**: 
- Render puts free-tier services to sleep after 15 minutes of inactivity
- When a request comes in, it takes 30-60 seconds to wake up
- The app's timeout was set to only 10 seconds
- Result: Request times out before server wakes up

## The Fix Applied

### Increased API Timeout

**Before** (`src/utils/api.ts`):
```typescript
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds - TOO SHORT!
});
```

**After**:
```typescript
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds - allows for cold starts
});
```

### Improved Error Message

Added note about cold starts:
```
Note: First request may take 30-60 seconds as server wakes up.
```

## How It Works Now

### First Request (Cold Start):
1. User tries to signup
2. Request sent to Render
3. Render wakes up the server (30-60 seconds)
4. Server processes request
5. Signup succeeds!

### Subsequent Requests (Warm):
1. Server is already awake
2. Requests complete in < 1 second
3. Fast and responsive!

## New Build Required

A new APK needs to be built with this fix. Run:

```bash
eas build --platform android --profile preview
```

## Temporary Workaround (Current APK)

If you want to use the current APK before the new build:

### Option 1: Wake Up the Server First
1. Open browser on your phone
2. Go to: https://gmusic-ivdh.onrender.com/health
3. Wait for it to load (30-60 seconds first time)
4. Once it shows "Gretex API running", go back to app
5. Try signup again - should work now!

### Option 2: Be Patient
1. Try to signup
2. Wait 60 seconds (even if it shows error)
3. Try again - server should be awake now
4. Should work on second attempt

## Long-Term Solutions

### Option A: Keep Server Awake (Free)
Use a service like UptimeRobot or Cron-job.org to ping your server every 10 minutes:
- URL to ping: https://gmusic-ivdh.onrender.com/health
- Frequency: Every 10 minutes
- Keeps server always warm

### Option B: Upgrade Render Plan (Paid)
- Upgrade to Render's paid plan ($7/month)
- Server never sleeps
- Always fast response times
- No cold starts

### Option C: Use Different Host
- Deploy to Railway, Fly.io, or Heroku
- Some have better free tiers
- May have faster cold starts

## Testing the Fix

After installing the new APK:

1. **First Test** (Cold Start):
   - Wait 20 minutes (let server sleep)
   - Try to signup
   - Should take 30-60 seconds but succeed
   - Loading indicator should show

2. **Second Test** (Warm):
   - Try to signup again immediately
   - Should complete in < 2 seconds
   - Fast and responsive

## Current Status

- ✅ Backend running: https://gmusic-ivdh.onrender.com
- ✅ Timeout increased to 60 seconds
- ✅ Error message improved
- 🔄 New build needed
- ⏳ Workaround available (wake server first)

## Summary

**Problem**: 10-second timeout too short for Render cold starts  
**Solution**: Increased timeout to 60 seconds  
**Workaround**: Wake server by visiting health endpoint first  
**Long-term**: Use UptimeRobot to keep server awake (free)  

---

**Next Steps**:
1. Build new APK with timeout fix
2. OR use workaround with current APK
3. Consider setting up UptimeRobot for always-warm server
