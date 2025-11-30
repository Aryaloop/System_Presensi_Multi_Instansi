import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

// 1. Config Environment
dotenv.config({ path: path.resolve("../../.env") });

// 2. Import Database & Routes Baru
import { db } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";

// 3. Import Routes Modular
import userRoutes from "./userRoutes/index.js";
import adminRoutes from "./adminRoutes/index.js";

// --- PERUBAHAN DISINI ---
// Import fungsi initDailyAttendance secara spesifik
// Pastikan path "./userRoutes/cronJobAbsenUser.js" sudah benar sesuai struktur foldermu
import { initDailyAttendance } from "./userRoutes/cronJobAbsenUser.js"; 

// 4. Import Routes Legacy
import registrasiRoute from "./registrasi.js";
import verifyRoute from "./verifikasi.js";
import resendVerifyRoute from "./resend-verification.js";
import checkVerifyRoute from "./check-verification.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ======================================================
// MIDDLEWARE GLOBAL
// ======================================================
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true                
}));
app.use(cookieParser());
app.use(express.json());

// ======================================================
// MOUNTING ROUTE 
// ======================================================
app.use("/api", authRoutes);
app.use("/api/register", registrasiRoute);
app.use("/api/verify", verifyRoute);
app.use("/api/resend-verification", resendVerifyRoute);
app.use("/api/check-verification", checkVerifyRoute);
app.use("/api/superadmin", superAdminRoutes);
app.use("/", userRoutes);
app.use("/", adminRoutes);

// ======================================================
// START SERVER
// ======================================================
(async () => {
  try {
    const { count } = await db.countAkun();
    console.log(`✅ Supabase terkoneksi. Jumlah akun terdaftar: ${count}`);
    
    app.listen(PORT, async () => {
      console.log(`✅ Backend berjalan di http://localhost:${PORT}`);
      
      // --- TAMBAHAN LOGIKA DEMO ---
      // Jalankan pengecekan absen setiap kali server start/restart.
      // Aman dilakukan berkali-kali karena di dalamnya sudah ada validasi cek duplikat.
      console.log("🔄 [STARTUP] Menjalankan sinkronisasi data absen harian...");
      await initDailyAttendance();
    });
    
  } catch (error) {
    console.error("❌ Gagal konek ke Supabase / Start Server", error);
  }
})();