# 🚀 Gretex Music Room Backend - Complete Setup Guide

## Prerequisites

Before you begin, ensure you have:
- ✅ **Node.js** 18.x or higher
- ✅ **PostgreSQL** 14.x or higher
- ✅ **npm** or **yarn**
- ✅ **Git** (for version control)

---

## 📦 Step 1: Install Dependencies

```bash
cd backend
npm install
```

This will install:
- Express.js (web framework)
- Prisma (ORM)
- JWT (authentication)
- Bcrypt (password hashing)
- Stripe (payments)
- Zoho client dependencies

---

## 🗄️ Step 2: Set Up PostgreSQL Database

### Option A: Local PostgreSQL

1. **Install PostgreSQL** (if not already installed)
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14

   # Windows
   # Download from postgresql.org

   # Linux
   sudo apt-get install postgresql-14
   ```

2. **Create Database**
   ```bash
   psql postgres
   CREATE DATABASE gretex_music_room;
   CREATE USER gretex_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE gretex_music_room TO gretex_user;
   \q
   ```

### Option B: Cloud PostgreSQL

Use a hosted service:
- **Supabase** (recommended, free tier)
- **Neon** (serverless PostgreSQL)
- **Railway** (easy deployment)
- **Heroku Postgres**

---

## ⚙️ Step 3: Configure Environment Variables

1. **Copy template:**
   ```bash
   cp ENV_TEMPLATE.txt .env
   ```

2. **Edit `.env` file:**

```env
# Server
PORT=3000
NODE_ENV=development

# Database (replace with your connection string)
DATABASE_URL="postgresql://gretex_user:your_password@localhost:5432/gretex_music_room"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=gSK9mN2pQ8rT5vX7zY4bC6dE1fG3hJ8kL0mN

# Zoho CRM (get from Zoho Developer Console)
ZOHO_CLIENT_ID=1000.ABC123XYZ
ZOHO_CLIENT_SECRET=your_secret_here
ZOHO_REFRESH_TOKEN=1000.refresh_token_here
ZOHO_ORG_ID=12345678

# Stripe (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_51AbCd...

# Frontend URL
FRONTEND_URL=http://localhost:8081
```

---

## 🔑 Step 4: Get API Keys

### Zoho CRM Setup:

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Create new Server-based Application
3. Get Client ID and Client Secret
4. Generate Refresh Token using OAuth flow
5. Note your Organization ID

### Stripe Setup:

1. Create account at [Stripe](https://stripe.com)
2. Go to Developers → API Keys
3. Copy your Secret Key (starts with `sk_test_`)
4. For production, use `sk_live_` key

---

## 🗃️ Step 5: Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate
# When prompted, name it: "init"

# (Optional) Seed initial data
# You can add seed script in package.json
```

---

## 🚀 Step 6: Start the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

**Expected Output:**
```
✅ Database connected successfully

🚀 Gretex Music Room API Server
📡 Server running on http://localhost:3000
🌍 Environment: development
📚 API Documentation: http://localhost:3000/health

✨ Ready to serve music education!
```

---

## ✅ Step 7: Verify Installation

### Test Health Endpoint:
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Gretex Music Room API is running",
  "timestamp": "2024-12-05T10:00:00.000Z"
}
```

### Test Database Connection:
```bash
npm run prisma:studio
```

This opens Prisma Studio at `http://localhost:5555` where you can:
- View database tables
- Add/edit data manually
- Test queries

---

## 📡 Step 8: Test API Endpoints

### Register a Test User:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Save the token from response!**

### Get User Profile:
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎨 Step 9: Connect to Mobile App

### Update Mobile App Config:

In your React Native app, update the API base URL:

```typescript
// src/config/api.ts
export const API_BASE_URL = 'http://localhost:3000/api';
// For physical device: use your computer's IP
// export const API_BASE_URL = 'http://192.168.1.100:3000/api';
```

### iOS Simulator:
```
http://localhost:3000
```

### Android Emulator:
```
http://10.0.2.2:3000
```

### Physical Device:
```
http://YOUR_COMPUTER_IP:3000
// Example: http://192.168.1.100:3000
```

---

## 🐛 Troubleshooting

### Database Connection Error:
```
Error: Can't reach database server
```
**Solution:**
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Check database exists: `psql -l`

### Port Already in Use:
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
- Change PORT in .env
- Or kill process: `lsof -ti:3000 | xargs kill -9`

### Prisma Generate Error:
```
Error: Prisma schema not found
```
**Solution:**
- Run from backend directory: `cd backend`
- Check schema.prisma exists in prisma/

### JWT Error:
```
Error: secretOrPrivateKey must have a value
```
**Solution:**
- Set JWT_SECRET in .env file
- Restart server after changing .env

---

## 📊 Database Migrations

### Create New Migration:
```bash
npm run prisma:migrate
# Name it: "add_chat_feature"
```

### Reset Database (DANGER - deletes all data):
```bash
npx prisma migrate reset
```

### View Migration Status:
```bash
npx prisma migrate status
```

---

## 🔐 Security Checklist

Before going to production:

- [ ] Change JWT_SECRET to a strong random key
- [ ] Use production Stripe keys
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure CORS properly (not *)
- [ ] Add rate limiting
- [ ] Enable database SSL
- [ ] Review all API endpoints
- [ ] Add input validation
- [ ] Set up monitoring

---

## 📈 Monitoring & Logs

### View Server Logs:
```bash
# If using PM2
pm2 logs

# If using nodemon
# Logs appear in terminal
```

### Monitor Database:
```bash
npm run prisma:studio
```

---

## 🎯 Next Steps

1. ✅ Set up database
2. ✅ Configure environment variables
3. ✅ Run migrations
4. ✅ Start server
5. ✅ Test API endpoints
6. ✅ Connect mobile app
7. 🔮 Add more features (webhooks, notifications, etc.)

---

## 📚 Additional Resources

- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Zoho CRM API](https://www.zoho.com/crm/developer/docs/api/)
- [JWT.io](https://jwt.io/)

---

*Setup Guide - December 2024*  
*Version: 1.0.0*

