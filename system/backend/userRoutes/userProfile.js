import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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
    console.error("❌ Error ambil profil:", err);
    res.status(500).json({ message: "Gagal mengambil profil pengguna" });
  }
});

export default router;