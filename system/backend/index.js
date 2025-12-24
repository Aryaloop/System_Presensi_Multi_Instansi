// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';
import morgan from "morgan";
import helmet from "helmet";
// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });


import authRoutes from "./routes/authRoutes.js"; 
import userRoutes from "./userRoutes/userRoutes.js";
import adminRoutes from "./adminRoutes/adminRoutes.js";
import superAdminRoutes from "./superAdminRoutes/superAdminRoutes.js";
import { initDailyAttendance } from "./userRoutes/cronJobAbsenUser.js"; // cronjob untuk absensi status awal hari
import startCleanupJob from "./utils/scheduler.js"; // Untuk cek email sampah setiap 3 menit
import { authLimiter } from "./middleware/limiter.js"; // Limiter Log dari ip yang sama 10/15 menit
import { verifyCsrfToken } from "./middleware/csrfMiddleware.js";
import "./utils/cronSubscription.js"; // Pastikan file ini sudah Anda buat sesuai jawaban sebelumnya
const app = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', 1); 
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser());
app.use(express.json());
// Morgan Log
// Opsi A: Mode Development (Warna-warni, enak dilihat)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan("dev")); 
} else {
  // Opsi B: Mode Production (Lebih simpel/standar, hemat memori console)
  app.use(morgan("combined")); 
}

// Security
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/forgot-password", authLimiter);
// ... limiter lain

// ======================================================
// MOUNTING ROUTES (BAGIAN PENTING)
// ======================================================
app.use("/api", authRoutes); 
app.use("/api/superadmin", verifyCsrfToken, superAdminRoutes);
app.use("/", verifyCsrfToken, userRoutes);
app.use("/", verifyCsrfToken, adminRoutes);
 
// Server Start
app.listen(PORT, () => {
  console.log(` Server berjalan di port ${PORT}`);
  try {
    initDailyAttendance(); 
    startCleanupJob(); // Cron Job pembersih
  } catch (e) { console.error(e); }
});