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
import userRoute from "./user.js";
import adminRoutes from "./admin.js";

dotenv.config({ path: path.resolve("../.env") });

const app = express();
app.use(cors());
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

  // Di dalam class AuthController
  async login(req, res) {
    try {
      const { email, password, captcha } = req.body;

      // === ✅ Verifikasi reCAPTCHA dulu ===
      // if (!captcha) {
      //   return res.status(400).json({ message: "Captcha diperlukan" });
      // }

      // const secret = process.env.RECAPTCHA_SECRET;
      // const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${captcha}`;
      // const response = await fetch(verifyUrl, { method: "POST" });
      // const data = await response.json();

      // if (!data.success) {
      //   return res.status(403).json({ message: "Verifikasi captcha gagal." });
      // }

      // === Lanjut ke proses login normal ===
      const { data: akun, error } = await db.findAkunByEmail(email);
      if (error || !akun)
        return res.status(401).json({ message: "Email tidak terdaftar" });

      // Cek status perusahaan
      const { data: perusahaan, error: perusahaanError } = await db.client
        .from("perusahaan")
        .select("status_aktif")
        .eq("id_perusahaan", akun.id_perusahaan)
        .single();

      if (perusahaanError) throw perusahaanError;

      if (perusahaan && perusahaan.status_aktif === false) {
        return res.status(403).json({
          message:
            "Akses perusahaan ini sedang dinonaktifkan. Hubungi Super Admin.",
        });
      }

      // Cek password
      const valid = await bcrypt.compare(password, akun.password);
      if (!valid) return res.status(401).json({ message: "Password salah" });

      // ✅ Login sukses
      res.json({
        message: "Login berhasil",
        id_akun: akun.id_akun,
        id_jabatan: akun.id_jabatan,
        username: akun.username,
        id_perusahaan: akun.id_perusahaan, // 🟢 tambahkan ini
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

  async getUser(req, res) {
    try {
      const { id } = req.params;
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
app.get("/api/user/:id", (req, res) => auth.getUser(req, res));
app.get("/api/health", (req, res) => auth.health(req, res));

// ✅ FORGOT PASSWORD
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
app.get("/api/superadmin/perusahaan", SuperAdminController.getAllPerusahaan);
app.get("/api/superadmin/admins", SuperAdminController.getAllAdmins);
app.put("/api/superadmin/suspend/:id", SuperAdminController.suspendPerusahaan);
app.post("/api/superadmin/perusahaan", SuperAdminController.createPerusahaan);
app.put("/api/superadmin/perusahaan/:id", SuperAdminController.updatePerusahaan);
app.delete("/api/superadmin/perusahaan/:id", SuperAdminController.deletePerusahaan);
app.post("/api/superadmin/create-admin", CreateAdminController.createAdmin);



// Routing User
app.use("/api/user", userRoute);

// Admin Routing
app.use("/", adminRoutes);


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

