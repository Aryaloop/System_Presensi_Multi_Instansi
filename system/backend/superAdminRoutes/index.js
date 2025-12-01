// backend/superAdminRoutes/index.js
import express from "express";
import { verifyToken, verifyAdmin } from "../authMiddleware.js";

// Import Controller yang sudah dipisah
import * as PerusahaanCtrl from "./controllers/perusahaanController.js";
import * as AdminCtrl from "./controllers/adminManagementController.js";

const router = express.Router();

// Middleware Global: Hanya Admin/SuperAdmin yang bisa akses
router.use(verifyToken, verifyAdmin);

// ================= PERUSAHAAN ROUTES =================
router.get("/perusahaan", PerusahaanCtrl.getAllPerusahaan);
router.post("/perusahaan", PerusahaanCtrl.createPerusahaan);
router.put("/perusahaan/:id", PerusahaanCtrl.updatePerusahaan);
router.delete("/perusahaan/:id", PerusahaanCtrl.deletePerusahaan);
router.put("/suspend/:id", PerusahaanCtrl.suspendPerusahaan);

// ================= ADMIN MANAGEMENT ROUTES =================
router.get("/admins", AdminCtrl.getAllAdmins);
router.post("/create-admin", AdminCtrl.createAdmin);
router.delete("/admins/:id", AdminCtrl.deleteAdmin);

export default router;