/**
 * Quick verification script for Google OAuth setup
 * Run with: node verify-google-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Google OAuth Setup...\n');

// Check frontend .env
const frontendEnvPath = path.join(__dirname, '.env');
let frontendEnvOk = false;
if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  if (frontendEnv.includes('EXPO_PUBLIC_GOOGLE_CLIENT_ID')) {
    const match = frontendEnv.match(/EXPO_PUBLIC_GOOGLE_CLIENT_ID=(.+)/);
    if (match && match[1].trim()) {
      console.log('✅ Frontend .env: EXPO_PUBLIC_GOOGLE_CLIENT_ID is set');
      frontendEnvOk = true;
    } else {
      console.log('❌ Frontend .env: EXPO_PUBLIC_GOOGLE_CLIENT_ID is empty');
    }
  } else {
    console.log('❌ Frontend .env: EXPO_PUBLIC_GOOGLE_CLIENT_ID not found');
  }
} else {
  console.log('❌ Frontend .env: File not found');
}

// Check backend .env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
let backendEnvOk = false;
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  if (backendEnv.includes('GOOGLE_CLIENT_ID')) {
    const match = backendEnv.match(/GOOGLE_CLIENT_ID=(.+)/);
    if (match && match[1].trim()) {
      console.log('✅ Backend .env: GOOGLE_CLIENT_ID is set');
      backendEnvOk = true;
    } else {
      console.log('❌ Backend .env: GOOGLE_CLIENT_ID is empty');
    }
  } else {
    console.log('❌ Backend .env: GOOGLE_CLIENT_ID not found');
  }
} else {
  console.log('❌ Backend .env: File not found');
}

// Check backend package.json
const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
if (fs.existsSync(backendPackagePath)) {
  const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
  if (backendPackage.dependencies && backendPackage.dependencies['google-auth-library']) {
    console.log('✅ Backend package.json: google-auth-library dependency found');
  } else {
    console.log('❌ Backend package.json: google-auth-library dependency missing');
  }
}

// Check backend route
const backendRoutePath = path.join(__dirname, 'backend', 'src', 'routes', 'auth.routes.js');
if (fs.existsSync(backendRoutePath)) {
  const routeContent = fs.readFileSync(backendRoutePath, 'utf8');
  if (routeContent.includes('/google') && routeContent.includes('googleLogin')) {
    console.log('✅ Backend route: POST /api/auth/google exists');
  } else {
    console.log('❌ Backend route: POST /api/auth/google not found');
  }
}

// Check frontend LoginScreen
const loginScreenPath = path.join(__dirname, 'src', 'screens', 'auth', 'LoginScreen.tsx');
if (fs.existsSync(loginScreenPath)) {
  const loginContent = fs.readFileSync(loginScreenPath, 'utf8');
  if (loginContent.includes('useProxy: true') && loginContent.includes('responseType: \'id_token\'')) {
    console.log('✅ Frontend LoginScreen: Google OAuth configured correctly');
  } else {
    console.log('❌ Frontend LoginScreen: Google OAuth configuration missing');
  }
}

console.log('\n📝 Next Steps:');
if (!frontendEnvOk) {
  console.log('1. Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to frontend .env file');
}
if (!backendEnvOk) {
  console.log('2. Add GOOGLE_CLIENT_ID to backend .env file');
}
console.log('3. Configure Google Cloud Console redirect URIs');
console.log('4. Run: cd backend && npm install');
console.log('5. Start backend: npm run dev');
console.log('6. Start frontend: npm start');
console.log('7. Test Google Sign-In button\n');

