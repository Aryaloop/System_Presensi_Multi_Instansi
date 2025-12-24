import express from "express";
import compression from "compression";
// Import file-file pecahan tadi
import karyawanRoutes from "./adminKaryawan.js";
import shiftRoutes from "./adminShift.js";
import izinRoutes from "./adminIzin.js";
import perusahaanRoutes from "./adminPerusahaan.js";
import absenRoutes from "./adminAbsen.js";
import createSubAdmin from "./createSubAdmin.js";
// Import Middleware (sesuaikan path mundur satu folder)
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(compression());

// ===================================================================
//  PASANG SATPAM (Middleware) DI SINI
// Semua route di bawah ini otomatis terproteksi
// ===================================================================
router.use(verifyToken, verifyAdmin);

// Gabungkan Route
router.use(karyawanRoutes);
router.use(shiftRoutes);
router.use(izinRoutes);
router.use(perusahaanRoutes);
router.use(absenRoutes);
// Contoh di route file
router.use(createSubAdmin);
export default router;