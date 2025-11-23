import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve("../.env") });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(to, subject, content, isHtml = false) {
  try {
    const info = await transporter.sendMail({
      from: `"KitaPresensi" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      [isHtml ? "html" : "text"]: content,
    });
    console.log("✅ Email terkirim:", info.response);
    return true; // tambahkan ini!
  } catch (error) {
    console.error("❌ Gagal kirim email:", error);
    return false; // dan ini!
  }
}

