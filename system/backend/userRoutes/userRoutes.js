import express from "express";
import compression from "compression";

// Import Modul Pecahan
import absenRoutes from "./userAbsen.js";
import izinRoutes from "./userIzin.js";
import kehadiranRoutes from "./userKehadiran.js";
import profileRoutes from "./userProfile.js";

// Import Middleware (Mundur satu folder)
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(compression());
 
// ===================================================================
// GLOBAL MIDDLEWARE
// Semua route user di bawah ini WAJIB pakai Token User
// ===================================================================
router.use(verifyToken);

// Gabungkan route
router.use(absenRoutes);
router.use(izinRoutes);
router.use(kehadiranRoutes);
router.use(profileRoutes);

export default router;