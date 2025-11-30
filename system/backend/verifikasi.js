// verifikasi.js
import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { logActivity } from "./utils/logger.js";
dotenv.config({ path: path.resolve("../../.env") });
const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.get("/:token", async (req, res) => {
  const { token } = req.params;

  try {
    // 🔹 Cari akun berdasarkan token
    const { data: akun } = await supabase
      .from("akun")
      .select("*")
      .eq("token_verifikasi", token)
      .maybeSingle();

    if (!akun) {
      // 🔸 Cek apakah sudah diverifikasi sebelumnya
      const { data: sudahVerif } = await supabase
        .from("akun")
        .select("*")
        .is("token_verifikasi", null)
        .eq("email_verified", true)
        .maybeSingle();

      if (sudahVerif) {
        return res.json({
          success: true,
          message: "Akun sudah diverifikasi sebelumnya.",
        });
      }

      return res
        .status(400)
        .json({ success: false, message: "Token tidak valid atau sudah kedaluwarsa." });
    }

    // ✅ Langsung kirim respon sukses dulu
    res.json({
      success: true,
      message: "✅ Verifikasi berhasil. Anda dapat login sekarang.",
    });

    // 🔹 Setelah kirim respon, baru update database (non-blocking)
    setTimeout(async () => {
      await supabase
        .from("akun")
        .update({ email_verified: true, token_verifikasi: null })
        .eq("id_akun", akun.id_akun);
      await logActivity({
        req: req, // Untuk ambil IP user
        id_akun: akun.id_akun, // ID user yang sedang verifikasi
        id_perusahaan: akun.id_perusahaan,
        action: "VERIFY_EMAIL",
        details: { msg: "User berhasil verifikasi email via token" }
      });
      console.log(`✅ Akun ${akun.email} berhasil diverifikasi dan token dihapus.`);
    }, 500); // jeda 0.5 detik biar respon frontend sempat diterima
  } catch (err) {
    console.error("❌ Error verifikasi:", err);
    res
      .status(500)
      .json({ success: false, message: "Gagal memverifikasi akun. Coba lagi nanti." });
  }
});

export default router;