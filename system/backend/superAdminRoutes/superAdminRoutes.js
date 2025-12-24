// backend/superAdminRoutes/index.js
import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

// Import Controller yang sudah dipisah
import * as PerusahaanCtrl from "./controllers/perusahaanController.js";
import * as AdminCtrl from "./controllers/adminManagementController.js";
import * as LogCtrl from "./controllers/activityLogController.js";
import * as PaketCtrl from "./controllers/paketController.js";
const router = express.Router();

// Middleware Global: SuperAdmin yang bisa akses
router.use(verifyToken, verifyAdmin);

// ================= PERUSAHAAN ROUTES =================
router.get("/perusahaan", PerusahaanCtrl.getAllPerusahaan);
router.put("/suspend/:id_perusahaan", PerusahaanCtrl.suspendPerusahaan);
router.get("/paket-langganan", PerusahaanCtrl.getAllPaket); // <--- Route Baru untuk Dropdown
router.post("/perusahaan", PerusahaanCtrl.createPerusahaan); // <--- Logic Create yang sudah diupdate
// router.post("/perusahaan", PerusahaanCtrl.createPerusahaan);
router.put("/perusahaan/:id_perusahaan", PerusahaanCtrl.updatePerusahaan);
router.delete("/perusahaan/:id_perusahaan", PerusahaanCtrl.deletePerusahaan);
// ================= ADMIN MANAGEMENT ROUTES =================
router.get("/admins", AdminCtrl.getAllAdmins);
router.post("/create-admin", AdminCtrl.createAdmin);
router.delete("/admins/:id_akun", AdminCtrl.deleteAdmin);

// ============= Activity Log ========================
router.get("/activity-logs", LogCtrl.getActivityLogs);

// ================= PAKET LANGGANAN ROUTES (BARU) =================
router.get("/paket", PaketCtrl.getAllPaket);          // Get List
router.post("/paket", PaketCtrl.createPaket);         // Create
router.put("/paket/:id_paket", PaketCtrl.updatePaket);// Edit
router.delete("/paket/:id_paket", PaketCtrl.deletePaket); // Delete

export default router;