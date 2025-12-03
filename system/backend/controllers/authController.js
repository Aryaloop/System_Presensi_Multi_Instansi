import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db, supabase } from "../config/db.js";
import { sendEmail } from "../utils/emailService.js"; // Pastikan path ini sesuai lokasi file emailService kamu
import { logActivity } from "../utils/logger.js";

export class AuthController {

  // =========================================================================
  // 1. REGISTER (Menggantikan registrasi.js)
  // =========================================================================
  static async register(req, res) {
    try {
      const { username, email, password, id_perusahaan } = req.body;

      // Validasi Input
      if (!username || !email || !password || !id_perusahaan)
        return res.status(400).json({ message: "Lengkapi semua field" });

      // Cek Email Duplikat
      const { data: existing } = await supabase
        .from("akun")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ message: "Email sudah terdaftar, silakan login." });
      }

      // Hash Password & Buat Token Verifikasi
      const hashed = await bcrypt.hash(password, 10);
      const tokenVerifikasi = crypto.randomBytes(32).toString("hex");

      // Insert Data Akun Baru
      const { error: insertError } = await supabase.from("akun").insert([
        {
          id_akun: uuidv4(),
          username,
          email,
          password: hashed,
          id_jabatan: "USER",
          id_perusahaan,
          token_verifikasi: tokenVerifikasi,
          email_verified: false,
          status_akun: "AKTIF", // Default aktif tapi belum verifikasi email
          created_at: new Date(),
        },
      ]);

      if (insertError) throw insertError;

      // Log Aktivitas
      await logActivity({
        req: req,
        id_akun: null, // User belum login
        id_perusahaan: id_perusahaan,
        action: "REGISTER_USER",
        target_table: "akun",
        details: { username, email, msg: "User mendaftar mandiri" }
      });

      // Kirim Email Verifikasi
      const verifyLink = `${process.env.FRONTEND_URL}/verify/${tokenVerifikasi}`;
      const htmlContent = `
        <div style="font-family:sans-serif;padding:20px;text-align:center;">
          <h2 style="color:#4f46e5;">Verifikasi Akun KitaPresensi</h2>
          <p>Halo <b>${username}</b>, klik tombol di bawah ini untuk memverifikasi akunmu:</p>
          <a href="${verifyLink}" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Verifikasi Sekarang</a>
          <p style="font-size:12px;color:#555;">Tautan berlaku selama 3 menit.</p>
        </div>
      `;

      await sendEmail(email, "Verifikasi Akun KitaPresensi", htmlContent, true);

      // Response Sukses
      // Catatan: setTimeout penghapusan akun dipindahkan ke CronJob (Scheduler) agar server lebih stabil
      res.json({
        success: true,
        message: "Registrasi berhasil! Silakan verifikasi email kamu dalam 3 menit.",
        token_verifikasi: tokenVerifikasi // Opsional: dikirim jika frontend butuh redirect langsung
      });

    } catch (err) {
      console.error("Error Registrasi:", err);
      res.status(500).json({ message: "Terjadi kesalahan server saat registrasi" });
    }
  }

  // =========================================================================
  // 2. VERIFY EMAIL (Menggantikan verifikasi.js)
  // =========================================================================
  static async verifyEmail(req, res) {
    const { token } = req.params;
    try {
      // Cari akun berdasarkan token
      const { data: akun } = await supabase
        .from("akun")
        .select("*")
        .eq("token_verifikasi", token)
        .maybeSingle();

      if (!akun) {
        // Cek jika sudah terverifikasi sebelumnya (Token null tapi email_verified true)
        const { data: sudahVerif } = await supabase
          .from("akun")
          .select("*")
          .is("token_verifikasi", null)
          .eq("email_verified", true)
          .maybeSingle(); // Logic ini bisa disesuaikan, tapi standarnya cek token lgsg

        if (sudahVerif) {
          return res.json({ success: true, message: "Akun sudah diverifikasi sebelumnya." });
        }
        return res.status(400).json({ success: false, message: "Token tidak valid atau sudah kadaluwarsa." });
      }

      // Update Database: Hapus token, set verified = true
      await supabase
        .from("akun")
        .update({ email_verified: true })
        .eq("id_akun", akun.id_akun);

      // Log Aktivitas
      await logActivity({
        req: req,
        id_akun: akun.id_akun,
        id_perusahaan: akun.id_perusahaan,
        action: "VERIFY_EMAIL",
        details: { msg: "User berhasil verifikasi email via token" }
      });

      res.json({
        success: true,
        message: "✅ Verifikasi berhasil. Anda dapat login sekarang.",
      });

    } catch (err) {
      console.error("Error Verifikasi:", err);
      res.status(500).json({ success: false, message: "Gagal memverifikasi akun." });
    }
  }

  // =========================================================================
  // 3. RESEND VERIFICATION (Menggantikan resend-verification.js)
  // =========================================================================
  static async resendVerification(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email wajib diisi" });

      const { data: akun } = await supabase
        .from("akun")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!akun) return res.status(404).json({ success: false, message: "Email tidak ditemukan." });
      if (akun.email_verified) return res.status(400).json({ success: false, message: "Email sudah diverifikasi." });

      // Buat token baru
      const newToken = crypto.randomBytes(32).toString("hex"); // Atau uuidv4()

      // Update di DB
      await supabase
        .from("akun")
        .update({ token_verifikasi: newToken })
        .eq("id_akun", akun.id_akun);

      // Kirim Email Ulang
      const verifyLink = `${process.env.FRONTEND_URL}/verify/${newToken}`;
      await sendEmail(
        email,
        "Kirim Ulang Verifikasi",
        `Halo ${akun.username},\n\nBerikut tautan baru: ${verifyLink}\n\nBerlaku 3 menit.`
      );

      res.json({ success: true, message: "Email verifikasi telah dikirim ulang." });

    } catch (err) {
      console.error("Error Resend:", err);
      res.status(500).json({ success: false, message: "Gagal mengirim ulang email." });
    }
  }

  // =========================================================================
  // 4. CHECK VERIFICATION STATUS (Menggantikan check-verification.js)
  // =========================================================================
  static async checkVerificationStatus(req, res) {
    const { token } = req.params;
    try {
      const { data: akun } = await supabase
        .from("akun")
        .select("email_verified")
        .eq("token_verifikasi", token)
        .maybeSingle();

      res.json({ verified: akun?.email_verified || false });
    } catch (err) {
      res.json({ verified: false });
    }
  }

  // =========================================================================
  // 5. LOGIN (Tetap seperti sebelumnya)
  // =========================================================================
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // 1. Ambil Data Akun & Perusahaan
      const { data: akun, error } = await supabase
        .from("akun")
        .select("*, perusahaan:perusahaan(*)")
        .eq("email", email)
        .maybeSingle(); // Gunakan maybeSingle agar tidak error jika null

      if (error || !akun) return res.status(401).json({ message: "Email tidak terdaftar" });

      // 2. Cek Status Akun
      if (akun.status_akun === 'NONAKTIF') {
        return res.status(403).json({ message: "Akun Anda telah dinonaktifkan." });
      }

      // 3. Cek Status Perusahaan
      // Pastikan relasi 'perusahaan' ada, jika tidak query terpisah
      let statusPerusahaanAktif = true;
      if (akun.perusahaan) {
        statusPerusahaanAktif = akun.perusahaan.status_aktif;
      } else {
        // Fallback jika join tidak jalan/structure beda
        const { data: pt } = await supabase.from("perusahaan").select("status_aktif").eq("id_perusahaan", akun.id_perusahaan).single();
        if (pt) statusPerusahaanAktif = pt.status_aktif;
      }

      if (!statusPerusahaanAktif) {
        return res.status(403).json({ message: "Akses perusahaan ini dinonaktifkan." });
      }

      // 4. Cek Password
      const valid = await bcrypt.compare(password, akun.password);
      if (!valid) return res.status(401).json({ message: "Password salah" });

      // 5. Cek Verifikasi Email (Opsional: jika wajib verif sebelum login)
      if (!akun.email_verified) {
        return res.status(403).json({ message: "Silakan verifikasi email Anda terlebih dahulu." });
      }

      // Bersihkan token verifikasi saat user login pertama kali
      if (akun.token_verifikasi) {
        await supabase
          .from("akun")
          .update({ token_verifikasi: null })
          .eq("id_akun", akun.id_akun);
      }

      // 6. Buat Token JWT
      const token = jwt.sign(
        { id_akun: akun.id_akun, role: akun.id_jabatan, id_perusahaan: akun.id_perusahaan },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // 7. Set Cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      // 8. Log Login
      await logActivity({
        req: req,
        id_akun: akun.id_akun,
        id_perusahaan: akun.id_perusahaan,
        action: "LOGIN",
        details: { role: akun.id_jabatan, msg: "User berhasil login" }
      });

      // 9. Return Response
      let roleString = "USER";
      if (akun.id_jabatan === "SPRADM") roleString = "SUPERADMIN";
      else if (akun.id_jabatan === "ADMIN") roleString = "ADMIN";
      else if (akun.id_jabatan === "SUBADMIN") roleString = "ADMIN";

      res.json({
        message: "Login berhasil",
        username: akun.username,
        id_jabatan: akun.id_jabatan,
        role: roleString,
      });

    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  }

  // =========================================================================
  // 6. LOGOUT
  // =========================================================================
  static async logout(req, res) {
    try {
      res.clearCookie("token");
      res.json({ message: "Logout berhasil" });
    } catch (err) {
      res.status(500).json({ message: "Gagal logout" });
    }
  }

  // =========================================================================
  // 7. HEALTH CHECK
  // =========================================================================
  static async health(req, res) {
    try {
      const { count } = await db.countAkun(); // Pastikan helper db.countAkun ada
      res.json({ status: "OK", total_users: count, message: "Server berjalan normal" });
    } catch (err) {
      res.status(500).json({ status: "ERROR", message: "Database bermasalah" });
    }
  }

  // =========================================================================
  // 8. FORGOT PASSWORD (BEST PRACTICE VERSION)
  // =========================================================================
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // 1. Cari user berdasarkan email
      // Kita hanya butuh ID-nya saja untuk update
      const { data: akun } = await supabase
        .from("akun")
        .select("id_akun, email")
        .ilike("email", email)
        .maybeSingle();

      // 2. USER ENUMERATION PROTECTION (Penting!)
      // Jika email tidak ketemu, jangan bilang "Email tidak ditemukan".
      // Hacker bisa nebak-nebak email mana yang terdaftar.
      // Berikan respon sukses palsu tapi dengan delay (biar seolah-olah memproses).
      if (!akun) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Delay 1.5 detik
        return res.json({ message: "Jika email terdaftar, tautan reset telah dikirim." });
      }

      // 3. GENERATE TOKEN BARU (OVERWRITE)
      // Tidak perlu cek token lama. Langsung timpa saja.
      const resetToken = uuidv4();

      // 4. Update Database
      const { error } = await supabase
        .from("akun")
        .update({ token_reset: resetToken }) // Token lama otomatis hilang tertimpa ini
        .eq("id_akun", akun.id_akun);

      if (error) throw error;

      // 5. Log Aktivitas
      // Log ini penting untuk audit trail jika ada spamming
      await logActivity({
        req: req,
        id_akun: akun.id_akun,
        id_perusahaan: null,
        action: "REQUEST_RESET_PASSWORD",
        details: { email: email, msg: "User meminta reset password" }
      });

      // 6. Kirim Email
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      // Gunakan "await" agar kita tahu jika email gagal (opsional, bisa dibuat background)
      await sendEmail(
        email,
        "🔐 Reset Password - KitaPresensi",
        `Halo,\n\nSeseorang meminta untuk mereset password akun Anda.\n\nKlik tautan di bawah ini untuk membuat password baru:\n${resetLink}\n\nHiraukan email ini jika Anda tidak memintanya.\nTautan ini akan valid sampai Anda mereset password.`
      );

      // 7. Response Sukses
      // Pesannya sama persis dengan jika email tidak ditemukan (Konsisten)
      res.json({ message: "Jika email terdaftar, tautan reset telah dikirim." });

    } catch (error) {
      console.error("Forgot Password Error:", error);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  }

  // =========================================================================
  // 9. RESET PASSWORD
  // =========================================================================
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

      res.json({ message: "Password berhasil diubah, silakan login kembali." });
    } catch (error) {
      res.status(500).json({ message: "Error server" });
    }
  }
}