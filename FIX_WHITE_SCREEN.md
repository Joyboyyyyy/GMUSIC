# Fix White Screen / import.meta Error on Web

## Problem
Web build crashes with: `Uncaught SyntaxError: Cannot use 'import.meta' outside a module`

This happens because Hermes is being used for web, which is not compatible.

## Solution - Step by Step

### Step 1: Install cross-env (if not installed)
```powershell
cd "Gretex music Room"
npm install --save-dev cross-env
```

### Step 2: Hard Reset (CRITICAL - Must Delete Cache)
```powershell
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web-build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

### Step 3: Start Web Using Correct Command
**DO NOT use:** `npx expo start --web`  
**ALWAYS use:** `npm run web`

```powershell
npm run web
```

### Step 4: Verify Fix
1. Open browser DevTools (F12)
2. Go to Sources/Network tab
3. Find the script tag with `AppEntry.bundle`
4. Check URL parameters:
   - ✅ **Correct**: `transform.engine=jsc` or no engine parameter
   - ❌ **Wrong**: `transform.engine=hermes`

If you still see `hermes`, repeat Step 2 (hard reset) and Step 3.

## Configuration Files (Already Set)

- ✅ `app.config.js` - Has `web: { jsEngine: "jsc" }`
- ✅ `package.json` - Has web script with `EXPO_USE_HERMES=false`
- ✅ `metro.config.js` - Created to support web platform

## Why This Works

The `EXPO_USE_HERMES=false` environment variable in the npm script forces Expo to use JSC instead of Hermes for web builds, preventing the `import.meta` error.

