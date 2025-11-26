// index.js
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import registrasiRoute from "./registrasi.js";
import verifyRoute from "./verifikasi.js";
import resendVerifyRoute from "./resend-verification.js";
import checkVerifyRoute from "./check-verification.js";
import { sendEmail } from "./emailService.js";
import { SuperAdminController } from "./superAdmin.js";
import { CreateAdminController } from "./createAdmin.js";
import path from "path";
// import userRoutes from "./user.js";
import userRoutes from "./userRoutes/index.js";
// import adminRoutes from "./admin.js";
import adminRoutes from "./adminRoutes/index.js";

import cookieParser from "cookie-parser"; // <-- Tambahan 1
import jwt from "jsonwebtoken";           // <-- Tambahan 2
import { verifyToken, verifyAdmin } from "./authMiddleware.js"; // Sesuaikan path


dotenv.config({ path: path.resolve("../../.env") });

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // <-- PENTING: Harus spesifik (jangan '*') supaya cookie bisa lewat
  credentials: true               // <-- PENTING: Izinkan cookie dikirim
}));
app.use(cookieParser());          // <-- Tambahan 3: Aktifkan parser
app.use(express.json());

// app.use("/api/register", registerRoute);
app.use("/api/register", registrasiRoute);
app.use("/api/verify", verifyRoute);
app.use("/api/resend-verification", resendVerifyRoute);
app.use("/api/check-verification", checkVerifyRoute);
// ======================================================
// 🧠 CLASS: DatabaseService → koneksi & query ke Supabase
// ======================================================
class DatabaseService {
  constructor() {
    this.client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  }

  async insertAkun(payload) {
    return await this.client.from("akun").insert(payload).select();
  }

  async findAkunByEmail(email) {
    return await this.client.from("akun").select("*").eq("email", email).single();
  }

  async findAkunById(id) {
    return await this.client.from("akun").select("*").eq("id_akun", id).single();
  }

  async countAkun() {
    return await this.client.from("akun").select("*", { count: "exact", head: true });
  }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const db = new DatabaseService();
const PORT = process.env.PORT || 3001;
const saltRounds = 10;

// ======================================================
// CLASS: AuthController → handle route logic
// ======================================================
class AuthController {
  // --- REGISTER (Tetap sama, tidak perlu diubah) ---
  async register(req, res) {
    try {
      const { username, email, password, id_jabatan, id_perusahaan } = req.body;

      if (!username || !email || !password || !id_jabatan || !id_perusahaan)
        return res.status(400).json({ message: "Lengkapi semua field" });

      const { data: existing } = await db.findAkunByEmail(email);
      if (existing) return res.status(409).json({ message: "Email sudah terdaftar" });

      const hashed = await bcrypt.hash(password, saltRounds);
      const payload = {
        id_akun: uuidv4(),
        username,
        email,
        password: hashed,
        id_jabatan,
        id_perusahaan,
        created_at: new Date(),
      };

      const { data, error } = await db.insertAkun(payload);
      if (error) throw error;

      res.status(201).json({ message: "Registrasi berhasil", data });
    } catch (err) {
      console.error("Register Error:", err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  }

  // --- LOGIN BARU (Dengan JWT & Cookie) ---
  // --- LOGIN (TANPA CAPTCHA) ---
  async login(req, res) {
    try {
      // 1. Hapus 'captcha' dari request body
      const { email, password } = req.body;

      // 2. Cek Email
      const { data: akun, error } = await db.findAkunByEmail(email);
      if (error || !akun)
        return res.status(401).json({ message: "Email tidak terdaftar" });

      // 3. Cek Status Perusahaan
      const { data: perusahaan, error: perusahaanError } = await db.client
        .from("perusahaan")
        .select("status_aktif")
        .eq("id_perusahaan", akun.id_perusahaan)
        .single();

      if (perusahaanError) throw perusahaanError;

      if (perusahaan && perusahaan.status_aktif === false) {
        return res.status(403).json({
          message: "Akses perusahaan ini sedang dinonaktifkan. Hubungi Super Admin.",
        });
      }

      // 4. Cek Password
      const valid = await bcrypt.compare(password, akun.password);
      if (!valid) return res.status(401).json({ message: "Password salah" });

      // 5. Generate JWT Token
      const token = jwt.sign(
        {
          id_akun: akun.id_akun,
          role: akun.id_jabatan,
          id_perusahaan: akun.id_perusahaan,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // 6. Simpan Token di HttpOnly Cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      // 7. Response ke Frontend (Pastikan id_jabatan ada!)
      res.json({
        message: "Login berhasil",
        username: akun.username,
        id_jabatan: akun.id_jabatan, // ✅ WAJIB ADA
        role:
          akun.id_jabatan === "SPRADM"
            ? "SUPERADMIN"
            : akun.id_jabatan === "ADMIN"
              ? "ADMIN"
              : "USER",
      });

    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  }

  // ---  LOGOUT ---
  async logout(req, res) {
    try {
      // Hapus cookie 'token' dari browser user
      res.clearCookie("token");
      res.json({ message: "Logout berhasil" });
    } catch (err) {
      console.error("Logout Error:", err);
      res.status(500).json({ message: "Gagal logout" });
    }
  }

  // --- GET USER & HEALTH (Tetap sama) ---
  async getUser(req, res) {
    try {
      // Sekarang ID diambil dari token middleware (req.user.id_akun), bukan params
      // Tapi untuk menjaga kompatibilitas kode lama, kita bisa pakai logika fallback
      const id = req.user?.id_akun || req.params.id;

      const { data: user, error } = await db.findAkunById(id);
      if (error || !user) return res.status(404).json({ message: "User tidak ditemukan" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  }

  async health(req, res) {
    try {
      const { count, error } = await db.countAkun();
      if (error) throw error;
      res.json({
        status: "OK",
        message: "Server berjalan normal",
        supabase_connected: true,
        total_users: count,
      });
    } catch (err) {
      res.status(500).json({
        status: "ERROR",
        message: "Koneksi database bermasalah",
        supabase_connected: false,
      });
    }
  }
}


const auth = new AuthController();

// ======================================================
//  ROUTING API
// ======================================================
app.post("/api/login", (req, res) => auth.login(req, res));
// app.get("/api/user/:id", (req, res) => auth.getUser(req, res));
app.get("/api/health", (req, res) => auth.health(req, res));

//  FORGOT PASSWORD
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📩 Email diterima:", email);

    const { data: akun, error: findError } = await supabase
      .from("akun")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (findError) throw findError;
    console.log("📊 Hasil query akun:", akun);

    if (!akun) return res.status(404).json({ message: "Email tidak ditemukan" });

    const resetToken = uuidv4();
    const { error: updateError } = await supabase
      .from("akun")
      .update({ token_reset: resetToken })
      .eq("id_akun", akun.id_akun);
    if (updateError) throw updateError;

    console.log("✅ Token reset disimpan:", resetToken);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail(
      email,
      "🔐 Reset Password Akun KitaPresensi",
      `Halo ${akun.username},

Kami menerima permintaan untuk mengatur ulang password akun Anda.
Klik tautan berikut untuk membuat password baru:
${resetLink}

Jika Anda tidak meminta reset password, abaikan email ini.

Salam,
Tim KitaPresensi`
    );

    res.json({ message: "Tautan reset password telah dikirim ke email Anda" });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});


// ✅ RESET PASSWORD
app.post("/api/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const { data: akun } = await supabase.from("akun").select("*").eq("token_reset", token).maybeSingle();
    if (!akun) return res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa" });

    const hashed = await bcrypt.hash(password, 10);
    await supabase
      .from("akun")
      .update({ password: hashed, token_reset: null })
      .eq("id_akun", akun.id_akun);

    res.json({ message: "Password berhasil diubah. Silakan login kembali." });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});


// Super Admin Routing
const superAdminRouter = express.Router();
superAdminRouter.use(verifyToken, verifyAdmin);


superAdminRouter.get("/perusahaan", SuperAdminController.getAllPerusahaan);
superAdminRouter.get("/admins", SuperAdminController.getAllAdmins);
superAdminRouter.put("/suspend/:id", SuperAdminController.suspendPerusahaan);
superAdminRouter.post("/perusahaan", SuperAdminController.createPerusahaan);
superAdminRouter.put("/perusahaan/:id", SuperAdminController.updatePerusahaan);
superAdminRouter.delete("/perusahaan/:id", SuperAdminController.deletePerusahaan);
superAdminRouter.post("/create-admin", CreateAdminController.createAdmin);
app.use("/api/superadmin", superAdminRouter);


// Routing User
app.use("/", userRoutes);
// Note: Kenapa "/", bukan "/api/user"? 
// Karena di dalam file userAbsen.js dkk, kita sudah menulis "/api/user/..." secara lengkap.
// Jika di sini ditulis "/api/user" lagi, nanti jadinya "/api/user/api/user/..." (double).

// Admin Routing
app.use("/", adminRoutes);       // admin.js sudah pakai verifyToken di dalamnya

// Logout Routing
app.post("/api/logout", (req, res) => auth.logout(req, res));

// ======================================================
// 🌐 START SERVER
// ======================================================
(async () => {
  try {
    const { count } = await db.countAkun();
    console.log(`✅ Supabase terkoneksi. Jumlah akun terdaftar: ${count}`);
  } catch {
    console.error("❌ Gagal konek ke Supabase");
  }
})();

app.listen(PORT, () => {
  console.log(`✅ Backend berjalan di http://localhost:${PORT}`);
});

