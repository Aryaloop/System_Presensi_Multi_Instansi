import express from "express";
import { supabase } from "../config/db.js"; // IMPORT DARI DB.JS

const router = express.Router();

// 👤 GET: Profil User
router.get("/api/user/profile", async (req, res) => {
  try {
    const id_akun = req.user.id_akun;
    const { data, error } = await supabase
      .from("akun")
      .select("username, email, no_tlp, alamat_karyawan, id_shift, jabatan(nama_jabatan)") // + jabatan jika perlu
      .eq("id_akun", id_akun)
      .single();

    if (error) throw error;
    res.json({ data }); // Bungkus dalam 'data' agar konsisten
  } catch (err) {
    console.error(" Error ambil profil:", err);
    res.status(500).json({ message: "Gagal mengambil profil pengguna" });
  }
});

export default router;