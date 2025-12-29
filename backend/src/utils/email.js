import nodemailer from 'nodemailer';

// Helper function to safely get environment variable with fallback
function getEnvVar(key, fallback = '') {
  const value = process.env[key];
  return value !== undefined && value !== null ? String(value) : fallback;
}

// Helper function to safely get number from environment variable
function getEnvNumber(key, fallback = 587) {
  const value = process.env[key];
  if (value === undefined || value === null) {
    return fallback;
  }
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

// Lazy transporter creation to avoid issues with undefined env vars at module load
let transporter = null;

// Function to get or create transporter with safe defaults
function getTransporter() {
  if (transporter !== null) {
    return transporter;
  }

  const smtpHost = getEnvVar('SMTP_HOST', '');
  const smtpPort = getEnvNumber('SMTP_PORT', 587);
  const smtpUser = getEnvVar('SMTP_USER', '');
  const smtpPass = getEnvVar('SMTP_PASS', '');

  // Validate required SMTP configuration
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[Email] ⚠️  SMTP configuration incomplete - email functionality will be limited');
    console.warn('[Email] Required: SMTP_HOST, SMTP_USER, SMTP_PASS');
  }

  // Create transporter with safe defaults
  transporter = nodemailer.createTransport({
    host: smtpHost || 'localhost',
    port: smtpPort,
    secure: smtpPort === 465, // Hardcoded: true for port 465, false otherwise
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

// Export verify function for server startup (non-fatal)
export async function verifySMTPConnection() {
  try {
    const transporterInstance = getTransporter();
    const smtpHost = getEnvVar('SMTP_HOST', '');
    const smtpUser = getEnvVar('SMTP_USER', '');

    // Skip verification if SMTP is not configured
    if (!smtpHost || !smtpUser) {
      console.warn('[Email] ⚠️  SMTP not configured - skipping verification');
      return false;
    }

    await transporterInstance.verify();
    console.log('[Email] ✅ SMTP connection verified');
    return true;
  } catch (error) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('[Email] ❌ SMTP verification failed:', errorMessage);
    // Non-fatal: return false instead of throwing
    return false;
  }
}

export async function sendVerificationEmail(to, token, name) {
  try {
    // Get BACKEND_URL for email links
    const backendUrlRaw = getEnvVar('BACKEND_URL', '');
    
    if (!backendUrlRaw) {
      console.error('[Email] ❌ BACKEND_URL not configured - cannot send verification email');
      return;
    }
    
    const backendUrl = backendUrlRaw.trim().replace(/\/+$/, '');
    
    // Warn if using local IP (emails won't work from external email clients)
    if (backendUrl.includes('192.168') || 
        backendUrl.includes('localhost') || 
        backendUrl.includes('127.0.0.1') ||
        backendUrl.includes('10.0.0')) {
      console.warn('[Email] ⚠️  BACKEND_URL is a local IP - email links will only work on local network');
      console.warn('[Email] ⚠️  For production, use a public URL (e.g., ngrok or deployed server)');
    }
    
    const verifyLink = `${backendUrl}/api/auth/verify-email?token=${encodeURIComponent(token || '')}`;
    
    console.log("📧 Verification email link:", verifyLink);

    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; margin:0; padding:0; background:#f5f6f8; }
          .box { max-width:600px; margin:30px auto; background:white; border-radius:8px; padding:24px; }
          .title { font-size:22px; font-weight:600; margin-bottom:12px; }
          .text { color:#444; margin-bottom:20px; line-height:1.5; }
          .foot { margin-top:20px; color:#666; font-size:13px; word-break:break-all; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="title">Verify your email</div>
          <div class="text">
            ${name ? `Hi ${name},` : 'Hello,'}<br/>
            Please confirm your email to complete your Gretex Music Room signup.
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
            <tr>
              <td align="center" style="background:#5b21b6; border-radius:8px;">
                <a href="${verifyLink}" style="display:inline-block; padding:14px 22px; background:#5b21b6; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px;">Verify Email</a>
              </td>
            </tr>
          </table>
          <div class="foot">
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p style="font-family:monospace; background:#f3f4f6; padding:8px; border-radius:4px; word-break:break-all;">${verifyLink}</p>
            <p style="margin-top:8px; font-size:12px; color:#9ca3af;">Clicking this link will open the Gretex Music Room app to verify your email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    // Verify SMTP before sending (non-fatal)
    const transporterInstance = getTransporter();
    const smtpHost = getEnvVar('SMTP_HOST', '');
    const smtpUser = getEnvVar('SMTP_USER', '');

    if (!smtpHost || !smtpUser) {
      console.error('[Email] ❌ SMTP not configured - cannot send verification email');
      // Non-fatal: log error but don't throw
      return;
    }

    try {
      await transporterInstance.verify();
      console.log("[Email] SMTP transporter verified");
    } catch (verifyError) {
      const errorMessage = verifyError?.message || 'Unknown verification error';
      console.error("[Email] SMTP verification failed:", errorMessage);
      // Non-fatal: log error but continue (email might still work)
    }

    // Safely get 'from' address with fallback
    const emailFrom = getEnvVar('EMAIL_FROM', '');
    const smtpUserFrom = getEnvVar('SMTP_USER', '');
    const fromAddress = emailFrom || smtpUserFrom || 'noreply@gretexindustries.com';

    if (!fromAddress || fromAddress === 'noreply@gretexindustries.com') {
      console.warn('[Email] ⚠️  Using default from address - EMAIL_FROM and SMTP_USER not set');
    }

    const mailOptions = {
      from: fromAddress,
      to: to || '',
      subject: 'Verify your Gretex Music Room account',
      html,
    };

    // Validate required fields
    if (!mailOptions.to) {
      console.error('[Email] ❌ Cannot send verification email - recipient address is missing');
      return;
    }

    try {
      const info = await transporterInstance.sendMail(mailOptions);
      const messageId = info?.messageId || 'unknown';
      console.log("📨 VERIFICATION EMAIL SENT", messageId);
    } catch (sendError) {
      const errorMessage = sendError?.message || 'Unknown send error';
      console.error(`[Email] ❌ Failed to send verification email: ${errorMessage}`);
      // Non-fatal: log error but don't throw
    }
  } catch (error) {
    const errorMessage = error?.message || 'Unknown error';
    console.error(`[Email] ❌ Error in sendVerificationEmail: ${errorMessage}`);
    // Non-fatal: log error but don't throw (allow signup to proceed)
  }
}

export const sendPasswordResetEmail = async (email, token) => {
  try {
    // Get BACKEND_URL for email links
    const backendUrlRaw = getEnvVar('BACKEND_URL', '');
    
    if (!backendUrlRaw) {
      console.error('[Email] ❌ BACKEND_URL not configured - cannot send password reset email');
      return;
    }
    
    const backendUrl = backendUrlRaw.trim().replace(/\/+$/, '');
    
    // Warn if using local IP (emails won't work from external email clients)
    if (backendUrl.includes('192.168') || 
        backendUrl.includes('localhost') || 
        backendUrl.includes('127.0.0.1') ||
        backendUrl.includes('10.0.0')) {
      console.warn('[Email] ⚠️  BACKEND_URL is a local IP - email links will only work on local network');
      console.warn('[Email] ⚠️  For production, use a public URL (e.g., ngrok or deployed server)');
    }
    
    const resetLink = `${backendUrl}/api/auth/reset-password/${encodeURIComponent(token || '')}`;
    
    console.log("📧 Password reset email link:", resetLink);

    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; margin:0; padding:0; background:#f5f6f8; }
          .box { max-width:600px; margin:30px auto; background:white; border-radius:8px; padding:24px; }
          .title { font-size:22px; font-weight:600; margin-bottom:12px; }
          .text { color:#444; margin-bottom:20px; line-height:1.5; }
          .foot { margin-top:20px; color:#666; font-size:13px; word-break:break-all; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="title">Reset your password</div>
          <div class="text">
            Hello,<br/>
            You requested to reset your password for Gretex Music Room. Tap the button below to reset your password in the app.
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
            <tr>
              <td align="center" style="background:#5b21b6; border-radius:8px;">
                <a href="${resetLink}" style="display:inline-block; padding:14px 22px; background:#5b21b6; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px;">Reset Password</a>
              </td>
            </tr>
          </table>
          <div class="foot">
            <p>If the button does not work, copy and paste this link:</p>
            <p style="font-family:monospace; background:#f3f4f6; padding:8px; border-radius:4px; word-break:break-all;">${resetLink}</p>
            <p style="margin-top:8px; font-size:12px; color:#9ca3af;">This link will open the app to reset your password.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    // Safely get 'from' address with fallback
    const emailFrom = getEnvVar('EMAIL_FROM', '');
    const smtpUserFrom = getEnvVar('SMTP_USER', '');
    const fromAddress = emailFrom || smtpUserFrom || 'noreply@gretexindustries.com';

    if (!fromAddress || fromAddress === 'noreply@gretexindustries.com') {
      console.warn('[Email] ⚠️  Using default from address - EMAIL_FROM and SMTP_USER not set');
    }

    const mailOptions = {
      from: fromAddress,
      to: email || '',
      subject: "Reset your password",
      html,
    };

    // Validate required fields
    if (!mailOptions.to) {
      console.error('[Email] ❌ Cannot send password reset email - recipient address is missing');
      return;
    }

    // Log SMTP details safely
    const smtpHost = getEnvVar('SMTP_HOST', 'not configured');
    const smtpPort = getEnvVar('SMTP_PORT', 'not configured');
    console.log(`[Email] SMTP Host: ${smtpHost}`);
    console.log(`[Email] SMTP Port: ${smtpPort}`);
    console.log(`[Email] From: ${mailOptions.from}`);
    console.log(`[Email] To: ${mailOptions.to}`);

    // Get transporter and check SMTP configuration
    const transporterInstance = getTransporter();
    const configuredSmtpHost = getEnvVar('SMTP_HOST', '');
    const configuredSmtpUser = getEnvVar('SMTP_USER', '');

    if (!configuredSmtpHost || !configuredSmtpUser) {
      console.error('[Email] ❌ SMTP not configured - cannot send password reset email');
      // Non-fatal: log error but don't throw
      return;
    }

    try {
      const info = await transporterInstance.sendMail(mailOptions);
      const messageId = info?.messageId || 'unknown';
      console.log(`[Email] ✅ Email sent - MessageId: ${messageId}`);
      return info;
    } catch (sendError) {
      const errorMessage = sendError?.message || 'Unknown send error';
      console.error(`[Email] ❌ Email send failed: ${errorMessage}`);
      // Non-fatal: log error but don't throw
      return null;
    }
  } catch (error) {
    const errorMessage = error?.message || 'Unknown error';
    console.error(`[Email] ❌ Error in sendPasswordResetEmail: ${errorMessage}`);
    // Non-fatal: log error but don't throw
    return null;
  }
};
