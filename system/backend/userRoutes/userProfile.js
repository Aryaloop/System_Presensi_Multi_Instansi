import express from "express";
import { supabase } from "../config/db.js"; // IMPORT DARI DB.JS

const router = express.Router();

//  GET: Profil User
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


// PUT: Update Profil (Hanya No HP & Alamat)
router.put("/api/user/profile", async (req, res) => {
  try {
    const id_akun = req.user.id_akun; // Dari middleware auth
    const { no_tlp, alamat_karyawan } = req.body;

    // Validasi sederhana
    if (!no_tlp && !alamat_karyawan) {
      return res.status(400).json({ message: "Tidak ada data yang diubah" });
    }

    // Update ke Supabase
    const { error } = await supabase
      .from("akun")
      .update({
        no_tlp: no_tlp,
        alamat_karyawan: alamat_karyawan,
        // Kita tidak update email/username/jabatan disini demi keamanan
      })
      .eq("id_akun", id_akun);

    if (error) throw error;

    res.json({
      success: true,
      message: "Profil berhasil diperbarui",
    });

  } catch (err) {
    console.error("Error update profil:", err);
    res.status(500).json({ message: "Gagal memperbarui profil" });
  }
});

export default router;