# Local Development Mode - Active

**Date**: January 21, 2026  
**Status**: Disconnected from Render, using local backend

## Current Configuration

### Backend (.env)
```
BACKEND_URL=https://gmusic-ivdh.onrender.com  # For email links
PORT=3002
NODE_ENV=development
```

**Note**: `BACKEND_URL` points to Render so verification email links work globally. Your local backend still runs on port 3002.

### Frontend (.env)
```
EXPO_PUBLIC_API_URL=http://192.168.2.131:3002
```

## What This Means

- ✅ Backend runs on your local machine (port 3002)
- ✅ Frontend connects to local backend via WiFi
- ✅ Database still uses Supabase (cloud)
- ✅ Email still uses Resend (cloud) - configured in backend/.env
- ✅ Email verification links use Render URL (so they work globally)
- ⚠️ Verification requests go to Render backend (not local)
- ❌ Only accessible on your local network (except email verification)

## How to Start Development

### 1. Start Backend Server
```powershell
cd backend
npm start
```

Backend will be available at: `http://192.168.2.131:3002`

### 2. Start Frontend
```powershell
npx expo start --clear
```

Scan QR code with Expo Go app on your phone.

### 3. Verify Connection
- Backend logs should show: `Server running on port 3002`
- Frontend should connect without errors
- Test signup/login to verify everything works

## Email Configuration (Local)

Your local backend is configured to use **Resend** for emails:
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_NJYjYq4i_5Ls3FF6JRVYv4NDWAnyYy6UV
EMAIL_FROM=onboarding@resend.dev
```

**Important - Testing Mode Restriction**:
- ⚠️ Resend free tier can only send to verified email: `pradhanrocky774@gmail.com`
- ⚠️ To send to other emails, verify a domain at https://resend.com/domains
- ✅ Free tier: 3,000 emails/month, 100 emails/day
- ✅ Fast delivery (emails arrive within seconds)

**For Testing**:
- Use `pradhanrocky774@gmail.com` for signup/verification testing
- Or verify your domain to send to any email address

## Switching Back to Render

When you want to reconnect to Render:

### Option 1: Use Render Backend (Recommended for Testing)
Update `.env`:
```
EXPO_PUBLIC_API_URL=https://gmusic-ivdh.onrender.com
```

### Option 2: Use ngrok for Remote Access
1. Start ngrok: `ngrok http 3002`
2. Update `backend/.env`: `BACKEND_URL=https://your-ngrok-url.ngrok-free.dev`
3. Update `.env`: `EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.dev`

## Network Requirements

For local development to work:
- ✅ Phone and computer on same WiFi network
- ✅ Firewall allows port 3002
- ✅ IP address `192.168.2.131` is correct (check with `ipconfig`)

## Troubleshooting

### Backend Not Starting
```powershell
cd backend
npm install
npm start
```

### Frontend Can't Connect
1. Check backend is running: `http://192.168.2.131:3002` in browser
2. Verify IP address: `ipconfig` (look for IPv4 Address)
3. Check firewall settings
4. Restart Expo: `npx expo start --clear`

### Email Not Sending Locally
- Resend testing mode only sends to `pradhanrocky774@gmail.com`
- To send to other emails, verify a domain at https://resend.com/domains
- Check backend logs for email send confirmation
- Verify SMTP credentials in `backend/.env`

## Database Access

Database remains on Supabase regardless of local/remote:
- Connection string in `backend/.env`
- No changes needed for local development
- All data persists across local/remote switches

## Development Workflow

1. **Local Development** (Current)
   - Fast iteration
   - Immediate feedback
   - Full debugging capabilities
   - Only accessible on local network

2. **Render Deployment** (Production)
   - Accessible from anywhere
   - Stable for testing
   - Slower deployment cycle
   - Production-like environment

## Quick Commands

### Check Backend Status
```powershell
curl http://192.168.2.131:3002/api/health
```

### Restart Everything
```powershell
# Stop all processes (Ctrl+C)
cd backend
npm start

# In new terminal
npx expo start --clear
```

### View Backend Logs
Backend logs appear in the terminal where you ran `npm start`

---

**Current Mode**: 🏠 Local Development  
**Backend**: http://192.168.2.131:3002  
**Database**: Supabase (Cloud)  
**Email**: Resend (Testing Mode - sends to pradhanrocky774@gmail.com only) ⚠️
