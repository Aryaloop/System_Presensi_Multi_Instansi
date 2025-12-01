import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { db, supabase } from "../config/db.js"; // Import dari config baru
import { sendEmail } from "../emailService.js"; // Asumsi file ini ada di root backend
import { logActivity } from "../utils/logger.js"; // <--- IMPORT HELPER
export class AuthController {
  // --- LOGIN ---
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // 1. Cek Email & Ambil Data Akun
      // Pastikan select mengambil status_akun juga
      const { data: akun, error } = await supabase
        .from("akun")
        .select("*, perusahaan:perusahaan(*)") // Join manual atau sesuaikan dengan query db helper Anda
        .eq("email", email)
        .single();

      if (error || !akun) return res.status(401).json({ message: "Email tidak terdaftar" });
 
      // LOGIC BARU: Cek Status Kepegawaian 
      if (akun.status_akun === 'NONAKTIF') {
        return res.status(403).json({
          message: "Akun Anda telah dinonaktifkan. Silakan hubungi Admin."
        });
      }
      // 2. Cek Status Perusahaan
      const { data: perusahaan, error: pError } = await supabase
        .from("perusahaan")
        .select("status_aktif")
        .eq("id_perusahaan", akun.id_perusahaan)
        .single();

      if (pError) throw pError;
      if (perusahaan && perusahaan.status_aktif === false) {
        return res.status(403).json({ message: "Akses perusahaan ini dinonaktifkan." });
      }

      // 3. Cek Password
      const valid = await bcrypt.compare(password, akun.password);
      if (!valid) return res.status(401).json({ message: "Password salah" });

      // 4. Buat Token
      const token = jwt.sign(
        { id_akun: akun.id_akun, role: akun.id_jabatan, id_perusahaan: akun.id_perusahaan },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // 5. Set Cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      // ==========================================
      // TAMBAHAN LOG AKTIVITAS (Implementasi)
      // ==========================================
      await logActivity({
        req: req,
        id_akun: akun.id_akun,
        id_perusahaan: akun.id_perusahaan,
        action: "LOGIN",
        details: {
          role: akun.id_jabatan,
          msg: "User berhasil login"
        }
      });

      // 6. Response JSON
      let roleString = "USER";
      if (akun.id_jabatan === "SPRADM") roleString = "SUPERADMIN";
      else if (akun.id_jabatan === "ADMIN") roleString = "ADMIN";
      else if (akun.id_jabatan === "SUBADMIN") roleString = "ADMIN"; // <-- Arahkan Sub Admin dianggap role "ADMIN" di frontend biar bisa masuk DashboardAdmin

      res.json({
        message: "Login berhasil",
        username: akun.username,
        id_jabatan: akun.id_jabatan, // Akan mengirim "SUBADMIN"
        role: roleString, // Frontend menggunakan ini untuk navigasi (navigate('/admin-dashboard'))
      });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  }

  // --- LOGOUT ---
  static async logout(req, res) {
    try {
      res.clearCookie("token");
      res.json({ message: "Logout berhasil" });
    } catch (err) {
      res.status(500).json({ message: "Gagal logout" });
    }
  }

  // --- HEALTH CHECK ---
  static async health(req, res) {
    try {
      const { count } = await db.countAkun();
      res.json({ status: "OK", total_users: count, message: "Server berjalan normal" });
    } catch (err) {
      res.status(500).json({ status: "ERROR", message: "Database bermasalah" });
    }
  }

  // --- FORGOT PASSWORD ---
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const { data: akun } = await supabase.from("akun").select("*").ilike("email", email).maybeSingle();

      if (!akun) return res.status(404).json({ message: "Email tidak ditemukan" });

      const resetToken = uuidv4();
      await supabase.from("akun").update({ token_reset: resetToken }).eq("id_akun", akun.id_akun);
      // LOG FORGOT PASSWORD REQUEST
      await logActivity({
        req: req,
        id_akun: akun.id_akun, // Akun yang minta reset
        id_perusahaan: akun.id_perusahaan,
        action: "REQUEST_RESET_PASSWORD",
        details: { email: email, msg: "Permintaan reset password dikirim" }
      });
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendEmail(email, "🔐 Reset Password", `Klik link ini: ${resetLink}`);

      res.json({ message: "Tautan reset password telah dikirim ke email Anda" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error server" });
    }
  }

  // --- RESET PASSWORD ---
  static async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const { data: akun } = await supabase.from("akun").select("*").eq("token_reset", token).maybeSingle();
      if (!akun) return res.status(400).json({ message: "Token invalid atau expired" });

      const hashed = await bcrypt.hash(password, 10);
      await supabase.from("akun").update({ password: hashed, token_reset: null }).eq("id_akun", akun.id_akun);
      await logActivity({
        req: req,
        id_akun: akun.id_akun,
        id_perusahaan: akun.id_perusahaan,
        action: "RESET_PASSWORD_SUCCESS",
        details: { msg: "User berhasil mengubah password via token" }
      });
      res.json({ message: "Password berhasil diubah" });
    } catch (error) {
      res.status(500).json({ message: "Error server" });
    }
  }
}