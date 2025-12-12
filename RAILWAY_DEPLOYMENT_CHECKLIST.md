# 🚂 Railway Deployment Checklist

## ✅ Files Changed

### Backend Files Modified:
1. **`backend/package.json`**
   - ✅ Added `postinstall` script: `"postinstall": "prisma generate"`

2. **`backend/src/server.js`**
   - ✅ Removed hardcoded IP addresses (192.168.100.40)
   - ✅ Updated console logs to use dynamic port

3. **`backend/src/app.js`**
   - ✅ Enhanced CORS configuration with methods and headers
   - ✅ Already configured to use `FRONTEND_URL` env var or `*`

4. **`backend/Procfile`** (NEW)
   - ✅ Created with: `web: node src/server.js`

5. **`backend/railway.json`** (NEW)
   - ✅ Created with NIXPACKS builder configuration

### Frontend Files Modified:
1. **`src/utils/api.ts`**
   - ✅ Updated to use `EXPO_PUBLIC_API_URL` environment variable
   - ✅ Falls back to local dev URL if not set
   - ✅ Uses `Constants.expoConfig?.extra?.apiUrl` for runtime config

2. **`app.config.js`**
   - ✅ Added `apiUrl` to `extra` config
   - ✅ Uses `EXPO_PUBLIC_API_URL` environment variable
   - ✅ Falls back to local dev URL

---

## 📋 Railway Deployment Steps

### Step 1: Create Railway Account & Project
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo" (recommended) OR "Empty Project"

### Step 2: Connect Your Repository
1. If using GitHub:
   - Select your repository
   - Select the `backend` folder as the root directory
   - OR create a monorepo setup (see Railway docs)

2. If using Empty Project:
   - Install Railway CLI: `npm i -g @railway/cli`
   - Run `railway login`
   - Run `railway init` in the `backend` folder
   - Run `railway up` to deploy

### Step 3: Add PostgreSQL Database
1. In Railway dashboard, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a `DATABASE_URL` environment variable
4. **Note the database URL** - you'll need it for migrations

### Step 4: Set Environment Variables
In Railway dashboard, go to your service → Variables tab, add:

#### Required Variables:
```
PORT=3000
NODE_ENV=production
DATABASE_URL=<automatically set by Railway PostgreSQL>
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRES_IN=7d
PASSWORD_PEPPER=<generate a strong random string>
```

#### Email Configuration (Required for password reset):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
EMAIL_FROM=your_email@gmail.com
```

#### Backend URL (Important!):
```
BACKEND_URL=https://your-app-name.up.railway.app
```
**Note:** Railway provides `RAILWAY_PUBLIC_DOMAIN` automatically. You can use:
```
BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

#### App Configuration:
```
APP_SCHEME=gretexmusicroom://
FRONTEND_URL=*
```

#### Optional (Payment/CRM):
```
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
ZOHO_ORG_ID=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
STRIPE_SECRET_KEY=...
```

### Step 5: Run Database Migrations
1. In Railway dashboard, go to your service
2. Click on "Deployments" tab
3. Click on the latest deployment
4. Open the "Shell" tab
5. Run:
   ```bash
   npx prisma migrate deploy
   ```
   OR add this to your package.json scripts and run it in postinstall:
   ```json
   "postinstall": "prisma generate && prisma migrate deploy"
   ```

### Step 6: Deploy
1. Railway will automatically deploy when you push to your connected branch
2. OR manually trigger deployment from Railway dashboard
3. Wait for build to complete
4. Check logs for any errors

### Step 7: Get Your Railway URL
1. In Railway dashboard, go to your service
2. Click "Settings" → "Networking"
3. Generate a public domain (e.g., `your-app-name.up.railway.app`)
4. **Copy this URL** - you'll need it for the frontend

---

## 🧪 Testing API Endpoints

### Test Health Check:
```bash
curl https://your-app-name.up.railway.app/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Gretex Music Room API is running",
  "timestamp": "2024-..."
}
```

### Test API Endpoints:
```bash
# Register
curl -X POST https://your-app-name.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Login
curl -X POST https://your-app-name.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

### Test from Frontend:
1. Update your `.env` file (or set environment variable):
   ```
   EXPO_PUBLIC_API_URL=https://your-app-name.up.railway.app
   ```
2. Restart Expo: `expo start -c`
3. Test login, signup, forgot password flows

---

## 📱 Update Frontend for Production

### Option 1: Using Environment Variable (Recommended)
1. Create `.env` file in project root:
   ```
   EXPO_PUBLIC_API_URL=https://your-app-name.up.railway.app
   ```
2. Install `dotenv` if not already installed:
   ```bash
   npm install dotenv
   ```
3. Update `app.config.js` to load env:
   ```js
   require('dotenv').config();
   
   export default {
     expo: {
       // ... rest of config
       extra: {
         apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.40:3000",
       }
     }
   };
   ```

### Option 2: Hardcode for Production Build
1. Update `app.config.js`:
   ```js
   extra: {
     apiUrl: "https://your-app-name.up.railway.app",
   }
   ```

### Option 3: Use EAS Environment Variables
1. Install EAS CLI: `npm install -g eas-cli`
2. Set environment variable:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-app-name.up.railway.app
   ```
3. Rebuild your app

---

## 🔨 Rebuild APK with New Backend URL

### Using EAS Build (Recommended):

1. **Install EAS CLI** (if not already):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS**:
   ```bash
   eas login
   ```

3. **Configure EAS** (if not done):
   ```bash
   eas build:configure
   ```

4. **Set Environment Variable**:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-app-name.up.railway.app
   ```

5. **Build APK**:
   ```bash
   eas build --platform android --profile production
   ```

6. **Download APK**:
   - EAS will provide a download link when build completes
   - Or check: https://expo.dev/accounts/[your-account]/projects/gretex-music-room/builds

### Using Local Build:

1. **Update `app.config.js`** with Railway URL:
   ```js
   extra: {
     apiUrl: "https://your-app-name.up.railway.app",
   }
   ```

2. **Build APK locally**:
   ```bash
   expo build:android
   ```
   OR with EAS:
   ```bash
   eas build --platform android --local
   ```

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Health endpoint responds: `/health`
- [ ] Database connection works (check Railway logs)
- [ ] User registration works
- [ ] User login works
- [ ] Email verification emails are sent
- [ ] Password reset emails are sent
- [ ] Password reset flow works end-to-end
- [ ] JWT tokens are generated correctly
- [ ] Protected routes require authentication
- [ ] CORS allows frontend requests
- [ ] Frontend can connect to Railway backend
- [ ] All API endpoints respond correctly

---

## 🐛 Troubleshooting

### Database Connection Issues:
- Check `DATABASE_URL` is set correctly in Railway
- Verify PostgreSQL service is running
- Check Railway logs for connection errors
- Run `npx prisma migrate deploy` manually

### CORS Issues:
- Verify `FRONTEND_URL` is set to `*` or your frontend domain
- Check browser console for CORS errors
- Verify `credentials: true` in CORS config

### Environment Variables Not Working:
- Restart Railway service after adding variables
- Check variable names match exactly (case-sensitive)
- Verify variables are set in correct service

### Build Failures:
- Check Railway build logs
- Verify `package.json` has correct scripts
- Ensure `postinstall` script runs `prisma generate`
- Check Node.js version compatibility

### Email Not Sending:
- Verify SMTP credentials are correct
- Check Railway logs for email errors
- Test SMTP connection separately
- Verify `BACKEND_URL` is set correctly for email links

---

## 📝 Important Notes

1. **Database Migrations**: Run `prisma migrate deploy` after first deployment
2. **Environment Variables**: Never commit `.env` file to git
3. **JWT Secret**: Use a strong, random secret in production
4. **CORS**: Consider restricting `FRONTEND_URL` to your actual frontend domain in production
5. **Backend URL**: Update `BACKEND_URL` in Railway to match your public domain
6. **Email Links**: Ensure `BACKEND_URL` is correct for password reset links
7. **Monitoring**: Set up Railway monitoring/alerts for production

---

## 🎉 Success!

Once all steps are complete:
- ✅ Backend is deployed on Railway
- ✅ Database is connected and migrated
- ✅ Frontend connects to Railway backend
- ✅ All features work (login, signup, password reset, etc.)
- ✅ APK is rebuilt with new backend URL

Your app is now ready for production! 🚀

