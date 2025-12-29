import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

async function testSMTP() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log("⏳ Testing SMTP connection...");

    await transporter.verify();

    console.log("✅ SMTP Connected Successfully!");
  } catch (error) {
    console.error("❌ SMTP Connection Failed:");
    console.error(error);
  }
}

testSMTP();

