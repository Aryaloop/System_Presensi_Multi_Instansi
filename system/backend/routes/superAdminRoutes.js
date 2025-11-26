import express from "express";
// Import controller lama (asumsi file ini masih ada di root backend)
import { SuperAdminController } from "../superAdmin.js"; 
import { CreateAdminController } from "../createAdmin.js";
import { verifyToken, verifyAdmin } from "../authMiddleware.js";

const router = express.Router();

// Middleware Global untuk router ini (Wajib Login & Wajib Admin/SuperAdmin)
router.use(verifyToken, verifyAdmin);

router.get("/perusahaan", SuperAdminController.getAllPerusahaan);
router.get("/admins", SuperAdminController.getAllAdmins);
router.put("/suspend/:id", SuperAdminController.suspendPerusahaan);
router.post("/perusahaan", SuperAdminController.createPerusahaan);
router.put("/perusahaan/:id", SuperAdminController.updatePerusahaan);
router.delete("/perusahaan/:id", SuperAdminController.deletePerusahaan);
router.post("/create-admin", CreateAdminController.createAdmin);

export default router;