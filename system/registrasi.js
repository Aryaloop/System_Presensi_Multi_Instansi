// registrasi.js (versi fix)
import express from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { sendEmail } from "./emailService.js";

dotenv.config({ path: path.resolve("../.env") });
const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.post("/", async (req, res) => {
  try {
    const { username, email, password, id_perusahaan } = req.body;
    if (!username || !email || !password || !id_perusahaan)
      return res.status(400).json({ message: "Lengkapi semua field" });

    // 🔍 Cek apakah email sudah terdaftar
    const { data: existing } = await supabase
      .from("akun")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ message: "Email sudah terdaftar, silakan login." });
    }

    // 🔒 Enkripsi password dan buat token verifikasi
    const hashed = await bcrypt.hash(password, 10);
    const tokenVerifikasi = crypto.randomBytes(32).toString("hex");

    // 🧩 Simpan data akun baru
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
        created_at: new Date(),
      },
    ]);

    if (insertError) throw insertError;

    // 📧 Kirim email verifikasi
    const verifyLink = `${process.env.FRONTEND_URL}/verify/${tokenVerifikasi}`;
    const htmlContent = `
      <div style="font-family:sans-serif;padding:20px;text-align:center;">
        <h2 style="color:#4f46e5;">Verifikasi Akun KitaPresensi</h2>
        <p>Halo <b>${username}</b>, klik tombol di bawah ini untuk memverifikasi akunmu:</p>
        <a href="${verifyLink}" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Verifikasi Sekarang</a>
        <p style="font-size:12px;color:#555;">Tautan berlaku selama 3 menit.</p>
      </div>
    `;

    const sent = await sendEmail(email, "Verifikasi Akun KitaPresensi", htmlContent, true);
    if (!sent) {
      console.error("❌ Email verifikasi gagal dikirim");
      return res.status(500).json({ message: "Gagal mengirim email verifikasi." });
    }

    // ✅ Kirim respons ke frontend
    res.json({
      success: true,
      message: "Registrasi berhasil! Silakan verifikasi email kamu dalam 3 menit.",
    });

    // 🕒 Hapus akun otomatis jika belum diverifikasi dalam 3 menit
    setTimeout(async () => {
      const { data: akun } = await supabase
        .from("akun")
        .select("email_verified")
        .eq("token_verifikasi", tokenVerifikasi)
        .maybeSingle();

      if (akun && !akun.email_verified) {
        await supabase.from("akun").delete().eq("token_verifikasi", tokenVerifikasi);
        console.log(`⏱️ Akun ${email} dihapus otomatis (tidak diverifikasi dalam 3 menit).`);
      }
    }, 3 * 60 * 1000);
  } catch (err) {
    console.error("Error registrasi:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});


export default router;
