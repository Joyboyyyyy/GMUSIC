# Quick Start Guide - Backend Server

## Problem: Network Error "Cannot reach server"

This error means the backend server is not running or not accessible.

## Solution: Start the Backend Server

### Step 1: Navigate to Backend Directory
```bash
cd "Gretex music Room/backend"
```

### Step 2: Install Dependencies (if not done)
```bash
npm install
```

### Step 3: Check Environment Variables
Ensure `.env` file exists with:
- `DATABASE_URL` - Your database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- `BACKEND_URL` - Backend URL (e.g., `http://192.168.2.122:3000`)

### Step 4: Start the Server
```bash
npm start
```

Or with nodemon (auto-restart on changes):
```bash
npm run dev
```

### Step 5: Verify Server is Running
You should see:
```
✅ Database connected successfully
✅ Database query test passed
✅ SMTP connection verified
🚀 Gretex API running on:
- Local:   http://localhost:3000
- Network: http://192.168.2.122:3000
```

### Step 6: Test Health Endpoint
Open browser or use curl:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "success": true,
  "message": "Gretex API running",
  "database": "connected",
  "timestamp": "..."
}
```

## Troubleshooting

### Port 3000 Already in Use
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with number from above)
taskkill /PID <PID> /F
```

### Database Connection Failed
1. Check `DATABASE_URL` in `.env`
2. Ensure database server is running
3. Verify network connectivity
4. Check database credentials

### Network Error from Mobile App
1. **Android Emulator**: Uses `http://10.0.2.2:3000` (auto-detected)
2. **iOS Simulator**: Uses `http://localhost:3000` (auto-detected)
3. **Real Device**: Uses `http://192.168.2.122:3000` (update LAN_IP in `src/config/api.ts`)

Ensure:
- Backend server is running
- Phone and computer are on same Wi-Fi network
- Firewall allows connections on port 3000
- LAN_IP matches your computer's IP address

## Database Not Taking Data

If requests reach the server but database doesn't save:

1. **Check Database Connection**: Server startup should show "✅ Database connected successfully"
2. **Check Prisma Client**: Run `npx prisma generate` if schema changed
3. **Check Logs**: Look for database errors in server console
4. **Test Health Endpoint**: Should show `"database": "connected"`

## Next Steps

Once server is running:
1. Test registration endpoint: `POST http://localhost:3000/api/auth/register`
2. Check server logs for any errors
3. Verify database connection in health endpoint
4. Test from mobile app

