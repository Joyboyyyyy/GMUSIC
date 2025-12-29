#!/usr/bin/env node

/**
 * Helper script to update BACKEND_URL in .env file
 * Run: node update-backend-url.js
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

const envPath = path.join(__dirname, '.env');
const detectedIP = getLocalIPv4();
const port = process.env.PORT || 3000;
const newBackendUrl = detectedIP ? `http://${detectedIP}:${port}` : null;

console.log('\n🔧 BACKEND_URL Updater\n');

if (!detectedIP) {
  console.error('❌ Could not detect your IP address');
  console.log('Please set BACKEND_URL manually in .env file');
  process.exit(1);
}

console.log(`📱 Detected IP: ${detectedIP}`);
console.log(`🔗 Backend URL: ${newBackendUrl}\n`);

if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found');
  console.log(`Creating .env file with BACKEND_URL=${newBackendUrl}\n`);
  
  const envContent = `# Backend URL (auto-updated)\nBACKEND_URL=${newBackendUrl}\n`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
} else {
  let envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  let updated = false;
  let found = false;

  const newLines = lines.map(line => {
    if (line.trim().startsWith('BACKEND_URL=') || line.trim().startsWith('#BACKEND_URL')) {
      found = true;
      if (!line.trim().startsWith('#')) {
        updated = true;
        return `BACKEND_URL=${newBackendUrl}`;
      }
    }
    return line;
  });

  if (!found) {
    // Add BACKEND_URL if it doesn't exist
    newLines.push(`BACKEND_URL=${newBackendUrl}`);
    updated = true;
  } else if (!updated) {
    // Uncomment if it was commented
    const uncommentedLines = lines.map(line => {
      if (line.trim().startsWith('#BACKEND_URL')) {
        updated = true;
        return `BACKEND_URL=${newBackendUrl}`;
      }
      return line;
    });
    envContent = uncommentedLines.join('\n');
  } else {
    envContent = newLines.join('\n');
  }

  if (updated) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated BACKEND_URL in .env file');
  } else {
    console.log('✅ BACKEND_URL already set correctly');
  }
}

console.log(`\n📝 BACKEND_URL is now: ${newBackendUrl}`);
console.log('\n🔄 Restart your backend server for changes to take effect\n');

