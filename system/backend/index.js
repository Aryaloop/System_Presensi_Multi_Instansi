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

// 3. Import Routes Modular (User & Admin yang sudah kamu pecah sebelumnya)
import userRoutes from "./userRoutes/index.js";
import adminRoutes from "./adminRoutes/index.js";

// 4. Import Routes Legacy (Registrasi/Verifikasi - Biarkan dulu di root)
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
  origin: 'http://localhost:3000', // Sesuaikan dengan Frontend
  credentials: true                // Izinkan Cookie
}));
app.use(cookieParser());
app.use(express.json());

// ======================================================
// MOUNTING ROUTE (Pemasangan Jalur)
// ======================================================

// 1. Auth & Core (Login, Logout, Health, Forgot Pass)
app.use("/api", authRoutes);

// 2. Registrasi & Verifikasi
app.use("/api/register", registrasiRoute);
app.use("/api/verify", verifyRoute);
app.use("/api/resend-verification", resendVerifyRoute);
app.use("/api/check-verification", checkVerifyRoute);

// 3. Super Admin Routes
app.use("/api/superadmin", superAdminRoutes);

// 4. User Routes (Modular)
// Prefix "/" karena di dalam filenya sudah ada "/api/user/..."
app.use("/", userRoutes);

// 5. Admin Routes (Modular)
// Prefix "/" karena di dalam filenya sudah ada "/api/admin/..."
app.use("/", adminRoutes);

// ======================================================
// START SERVER
// ======================================================
(async () => {
  try {
    const { count } = await db.countAkun();
    console.log(`✅ Supabase terkoneksi. Jumlah akun terdaftar: ${count}`);
    app.listen(PORT, () => {
      console.log(`✅ Backend berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Gagal konek ke Supabase / Start Server", error);
  }
})();