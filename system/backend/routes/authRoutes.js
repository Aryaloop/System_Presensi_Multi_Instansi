// routes/authRoutes.js
import express from "express";
import { AuthController } from "../controllers/authController.js";

const router = express.Router();

// === URL yang dipanggil Frontend ===
// Karena di index.js nanti kita pasang di "/api",
// maka di sini kita set path lanjutannya.

// Frontend: axios.post("/api/register")
router.post("/register", AuthController.register);

// Frontend: axios.get("/api/verify/:token")
router.get("/verify/:token", AuthController.verifyEmail);

// Frontend: axios.post("/api/resend-verification")
router.post("/resend-verification", AuthController.resendVerification);

// Frontend: axios.get("/api/check-verification/:token")
router.get("/check-verification/:token", AuthController.checkVerificationStatus);

// Frontend: axios.post("/api/login")
router.post("/login", AuthController.login);

// Lainnya
router.post("/logout", AuthController.logout);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password/:token", AuthController.resetPassword);
router.get("/health", AuthController.health);

export default router;