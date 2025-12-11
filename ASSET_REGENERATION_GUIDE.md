# Asset Regeneration Guide

## Required Assets

Expo Doctor detected that the following assets need to be regenerated with correct dimensions:

### 1. icon.png
- **Required Size:** 1024×1024 pixels (square)
- **Background:** Transparent
- **Content:** Centered logo
- **Current Issue:** 1248×832 (not square)

### 2. adaptive-icon.png  
- **Required Size:** 1024×1024 pixels (square)
- **Background:** Transparent foreground
- **Current Issue:** 900×500 (not square)

### 3. splash.png
- **Recommended Size:** 1284×2778 pixels (portrait)
- **Background:** #5b21b6 (purple)
- **Content:** Centered logo
- **Note:** Current file may need resizing/regeneration

## How to Regenerate Assets

### Option 1: Using Expo Tools
1. Place your source logo/icon (PNG with transparent background) in a temporary folder
2. Use an image editor (Photoshop, GIMP, Figma) to create:
   - **icon.png**: 1024×1024, centered logo, transparent background
   - **adaptive-icon.png**: 1024×1024, logo only (no background), transparent
   - **splash.png**: 1284×2778, centered logo on #5b21b6 background

### Option 2: Online Tools
- Use https://www.appicon.co/ or similar tools
- Upload your logo and generate all required sizes

### Option 3: Manual Creation
1. Open your logo in an image editor
2. Create new canvas with required dimensions
3. Center the logo
4. Export as PNG

## After Regeneration

Replace the files in `/assets` directory:
- `assets/icon.png`
- `assets/adaptive-icon.png`  
- `assets/splash.png`

Then run:
```bash
npx expo-doctor
```

This should clear the asset validation errors.

