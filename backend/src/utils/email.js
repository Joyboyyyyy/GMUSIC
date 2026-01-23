import { Resend } from 'resend';

// Helper function to safely get environment variable with fallback
function getEnvVar(key, fallback = '') {
  const value = process.env[key];
  return value !== undefined && value !== null ? String(value) : fallback;
}

// Lazy Resend client creation
let resendClient = null;

function getResendClient() {
  if (resendClient !== null) {
    return resendClient;
  }

  const apiKey = getEnvVar('RESEND_API_KEY', '');

  if (!apiKey) {
    console.warn('[Email] ⚠️  RESEND_API_KEY not configured');
    return null;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function verifySMTPConnection() {
  try {
    const client = getResendClient();
    if (!client) {
      console.warn('[Email] ⚠️  Resend not configured');
      return false;
    }
    console.log('[Email] ✅ Resend API configured');
    return true;
  } catch (error) {
    console.error('[Email] ❌ Resend verification failed:', error.message);
    return false;
  }
}

export async function sendVerificationEmail(to, token, name) {
  try {
    const client = getResendClient();
    if (!client) {
      console.error('[Email] ❌ Resend not configured');
      return;
    }

    const backendUrl = getEnvVar('BACKEND_URL', '').trim().replace(/\/+$/, '');
    if (!backendUrl) {
      console.error('[Email] ❌ BACKEND_URL not configured');
      return;
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
          </div>
        </div>
      </body>
    </html>
  `;

    const emailFrom = getEnvVar('EMAIL_FROM', 'noreply@gretexindustries.com');

    await client.emails.send({
      from: emailFrom,
      to: to,
      subject: 'Verify your Gretex Music Room account',
      html,
    });

    console.log("📨 VERIFICATION EMAIL SENT to", to);
  } catch (error) {
    const skipErrors = getEnvVar('SKIP_EMAIL_ERRORS', 'false') === 'true';
    
    if (skipErrors) {
      console.warn(`[Email] ⚠️  Email sending skipped (development mode): ${error.message}`);
      console.warn(`[Email] ℹ️  User can still login - email verification is bypassed`);
    } else {
      console.error(`[Email] ❌ Error sending verification email:`, error.message);
    }
  }
}

export const sendPasswordResetEmail = async (email, token) => {
  try {
    const client = getResendClient();
    if (!client) {
      console.error('[Email] ❌ Resend not configured');
      return null;
    }

    const backendUrl = getEnvVar('BACKEND_URL', '').trim().replace(/\/+$/, '');
    if (!backendUrl) {
      console.error('[Email] ❌ BACKEND_URL not configured');
      return null;
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
            You requested to reset your password for Gretex Music Room.
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
          </div>
        </div>
      </body>
    </html>
  `;

    const emailFrom = getEnvVar('EMAIL_FROM', 'noreply@gretexindustries.com');

    const info = await client.emails.send({
      from: emailFrom,
      to: email,
      subject: 'Reset your password',
      html,
    });

    console.log(`[Email] ✅ Password reset email sent to ${email}`);
    return info;
  } catch (error) {
    console.error(`[Email] ❌ Error sending password reset email:`, error.message);
    return null;
  }
};


export async function sendInvoiceEmail(paymentId, pdfBuffer) {
  try {
    const client = getResendClient();
    if (!client) {
      console.error('[Email] ❌ Resend not configured');
      return null;
    }

    const db = (await import('../lib/db.js')).default;
    
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment || !payment.student?.email) {
      console.error('[Email] ❌ Cannot send invoice - payment or user email not found');
      return null;
    }

    const userName = payment.student.name || 'Customer';
    const userEmail = payment.student.email;
    const invoiceNumber = `INV-${paymentId.slice(0, 8).toUpperCase()}`;
    const invoiceDate = new Date(payment.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const amount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: payment.currency || 'INR',
      minimumFractionDigits: 0,
    }).format(payment.amount);

    console.log(`[Email] Sending invoice to: ${userEmail}`);

    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; margin:0; padding:0; background:#f5f6f8; }
          .box { max-width:600px; margin:30px auto; background:white; border-radius:12px; padding:32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align:center; margin-bottom:24px; border-bottom: 2px solid #7c3aed; padding-bottom: 16px; }
          .logo { font-size:24px; font-weight:700; color:#7c3aed; }
          .title { font-size:20px; font-weight:600; margin:20px 0 12px; color:#1f2937; }
          .text { color:#4b5563; margin-bottom:16px; line-height:1.6; }
          .details { background:#f9fafb; border-radius:8px; padding:16px; margin:20px 0; }
          .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom:none; }
          .detail-label { color:#6b7280; font-size:14px; }
          .detail-value { color:#1f2937; font-weight:500; font-size:14px; }
          .amount { font-size:28px; font-weight:700; color:#7c3aed; text-align:center; margin:24px 0; }
          .footer { margin-top:24px; padding-top:16px; border-top:1px solid #e5e7eb; text-align:center; color:#9ca3af; font-size:12px; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="header">
            <div class="logo">🎵 GRETEX MUSIC ROOM</div>
          </div>
          
          <div class="title">Payment Receipt</div>
          <div class="text">
            Hi ${userName},<br/><br/>
            Thank you for your payment! Your invoice is attached to this email.
          </div>
          
          <div class="amount">${amount}</div>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Invoice Number</span>
              <span class="detail-value">${invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${invoiceDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value" style="color:#10b981;">✓ ${payment.status}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment ID</span>
              <span class="detail-value">${payment.gatewayPaymentId || paymentId.slice(0, 12)}</span>
            </div>
          </div>
          
          <div class="text" style="text-align:center;">
            Please find your detailed invoice attached as a PDF.
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Gretex Music Room!</p>
            <p>For any queries, contact us at info@gretexindustries.com</p>
          </div>
        </div>
      </body>
    </html>
    `;

    const emailFrom = getEnvVar('EMAIL_FROM', 'noreply@gretexindustries.com');

    const info = await client.emails.send({
      from: emailFrom,
      to: userEmail,
      subject: `Your Invoice ${invoiceNumber} - Gretex Music Room`,
      html,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log(`[Email] ✅ Invoice email sent to ${userEmail}`);
    return info;
  } catch (error) {
    console.error(`[Email] ❌ Error sending invoice email:`, error.message);
    return null;
  }
}