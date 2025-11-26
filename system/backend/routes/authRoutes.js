import express from "express";
import { AuthController } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/health", AuthController.health);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password/:token", AuthController.resetPassword);

export default router;