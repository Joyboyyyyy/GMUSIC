import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to, token, name) {
  const backendUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;
  const scheme = process.env.APP_SCHEME || 'gretexmusicroom://';
  const deepLinkUrl = `${scheme}verify?token=${encodeURIComponent(token)}`;

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
          .btn { display:inline-block; padding:12px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:6px; font-weight:600; }
          .foot { margin-top:20px; color:#666; font-size:13px; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="title">Verify your email</div>
          <div class="text">
            ${name ? `Hi ${name},` : 'Hello,'}<br/>
            Please confirm your email to complete your Gretex Music Room signup.
          </div>
          <a class="btn" href="${backendUrl}">Verify Email</a>
          <div class="foot">
            If the button doesn't work, copy this link:<br/>
            ${backendUrl}<br/><br/>
            Or use the app deep link:<br/>
            ${deepLinkUrl}
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Verify your Gretex Music Room account',
    html,
  });
}

