import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';

// 1. Import Middleware Rate Limiter (KEAMANAN)
import { authLimiter } from "./middleware/limiter.js";

// Config Environment & Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") }); // Pastikan path .env benar

// Import Routes
import { db } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./userRoutes/index.js";
import adminRoutes from "./adminRoutes/index.js";
import superAdminRoutes from "./superAdminRoutes/index.js";

// Import Routes Legacy
import registrasiRoute from "./registrasi.js";
import verifyRoute from "./verifikasi.js";
import resendVerifyRoute from "./resend-verification.js";
import checkVerifyRoute from "./check-verification.js";

// Cron Job
import { initDailyAttendance } from "./userRoutes/cronJobAbsenUser.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ======================================================
// 1. CONFIG PROXY (WAJIB UNTUK RATE LIMITER)
// ======================================================
// Agar express membaca IP asli user, bukan IP localhost/proxy
app.set('trust proxy', 1); 

// ======================================================
// 2. MIDDLEWARE GLOBAL
// ======================================================
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true                
}));
app.use(cookieParser());
app.use(express.json());

// ======================================================
// 3. SECURITY: RATE LIMITER (PASANG SEBELUM ROUTES)
// ======================================================
// Blokir IP jika mencoba login/register > 5-10 kali dalam 15 menit
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/forgot-password", authLimiter);
app.use("/api/resend-verification", authLimiter);
app.use("/api/reset-password", authLimiter);

// ======================================================
// 4. MOUNTING ROUTES
// ======================================================
app.use("/api", authRoutes); // Di dalamnya ada /login, logout, forgot-pass
app.use("/api/register", registrasiRoute);
app.use("/api/verify", verifyRoute);
app.use("/api/resend-verification", resendVerifyRoute);
app.use("/api/check-verification", checkVerifyRoute);
app.use("/api/superadmin", superAdminRoutes);

// Route User & Admin
app.use("/", userRoutes);
app.use("/", adminRoutes);

// ======================================================
// SERVER START
// ======================================================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
  console.log(`🛡️ Rate Limiter aktif pada endpoint Auth`);
  
  // Jalankan Cron Job (Opsional: log jika sukses)
  try {
    initDailyAttendance(); 
    console.log("⏰ Cron Job Absensi Harian diaktifkan");
  } catch (e) {
    console.error("❌ Gagal menjalanan Cron Job:", e);
  }
});