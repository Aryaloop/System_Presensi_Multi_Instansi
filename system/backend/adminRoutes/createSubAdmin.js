import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { supabase } from "../config/db.js"; // IMPORT DARI DB.JS

import { sendEmail } from "../utils/emailService.js"; 

const router = express.Router();

// ==========================================
// POST: Create Sub Admin
// ==========================================
// Middleware verifyToken & verifyAdmin sudah dipasang di index.js
// Jadi req.user.id_perusahaan pasti tersedia di sini.

router.post("/api/admin/create-subadmin", async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Ambil ID Perusahaan dari Admin yang sedang login
    const adminIdPerusahaan = req.user.id_perusahaan;

    // Validasi Input Dasar
    if (!username || !email) {
      return res.status(400).json({ message: "Username dan Email wajib diisi." });
    }

    // 1. Cek apakah email sudah ada di database
    const { data: existing, error: checkError } = await supabase
      .from("akun")
      .select("id_akun")
      .eq("email", email)
      .single();

    // Abaikan error jika data tidak ditemukan (PGRST116), tapi lempar error lain
    if (checkError && checkError.code !== "PGRST116") throw checkError;
    
    if (existing) {
      return res.status(400).json({ message: "Email sudah terdaftar di sistem." });
    }

    // 2. Generate Password Sementara & Token Verifikasi
    const tempPassword = crypto.randomBytes(4).toString("hex"); // misal: a1b2c3d4
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const tokenVerifikasi = crypto.randomUUID();

    // 3. Insert ke Tabel Akun
    // PENTING: id_jabatan diset 'SUBADMIN' & id_perusahaan ikut admin pembuat
    const { error: insertError } = await supabase
      .from("akun")
      .insert([
        {
          username,
          email,
          password: hashedPassword,
          id_jabatan: "SUBADMIN", 
          id_perusahaan: adminIdPerusahaan, 
          email_verified: true, // Langsung verified karena dibuat oleh admin
          token_verifikasi: tokenVerifikasi,
          created_at: new Date(),
        },
      ]);

    if (insertError) throw insertError;

    // 4. Siapkan Email Notifikasi
    const html = `
      <div style="font-family:sans-serif;background:#f6f7fb;padding:30px;">
        <div style="background:#fff;padding:20px;border-radius:8px;max-width:500px;margin:auto;">
          <h2 style="color:#4f46e5;">Halo Sub-Admin Baru!</h2>
          <p>Halo <b>${username}</b>, akun Sub-Admin Anda telah dibuat oleh Admin.</p>
          <p>Anda sekarang dapat mengakses dashboard manajemen karyawan.</p>
          <hr style="border:0; border-top:1px solid #eee; margin:20px 0;"/>
          <p style="font-size:14px; color:#555;">Berikut detail login Anda:</p>
          <p><b>Email:</b> ${email}<br/><b>Password Sementara:</b> <span style="background:#eee; padding:2px 6px; rounded:4px;">${tempPassword}</span></p>
          <hr style="border:0; border-top:1px solid #eee; margin:20px 0;"/>
          <p style="font-size:12px; color:#888;">Silakan login dan segera ubah password Anda demi keamanan.</p>
        </div>
      </div>
    `;

    // 5. Kirim Email
    const emailSent = await sendEmail(email, "Akses Sub-Admin Diberikan - KitaPresensi", html, true);
    
    if (!emailSent) {
      // Opsional: Anda bisa menghapus akun yang baru dibuat jika email gagal, 
      // atau biarkan saja dan minta admin reset password manual.
      console.warn(" Email gagal terkirim ke Sub Admin baru");
    }

    return res.json({
      message: `Sub Admin ${username} berhasil dibuat. Detail login dikirim ke email.`,
    });

  } catch (err) {
    console.error(" Create SubAdmin Error:", err);
    return res.status(500).json({ 
      message: err.message || "Gagal membuat sub admin." 
    });
  }
});

export default router;