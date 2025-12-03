import express from "express";
import { supabase } from "../config/db.js"; // IMPORT DARI DB.JS

const router = express.Router();

// GET Perusahaan
router.get("/api/admin/perusahaan", async (req, res) => {
  try {
    const id_perusahaan = req.user.id_perusahaan;
    console.log(" GET Perusahaan untuk ID:", id_perusahaan);

    const { data, error } = await supabase
      .from("perusahaan")
      .select("*")
      .eq("id_perusahaan", id_perusahaan)
      .single();

    if (error) throw error;
    res.json({ message: " Data perusahaan ditemukan", data });
  } catch (err) {
    console.error(" Gagal memuat perusahaan:", err.message);
    res.status(500).json({ message: "Gagal memuat perusahaan" });
  }
});

// PUT Perusahaan
router.put("/api/admin/perusahaan", async (req, res) => {
  try {
    // 1. Cek User ID dari Token
    const id_perusahaan = req.user?.id_perusahaan;
    if (!id_perusahaan) {
        console.error(" ID Perusahaan tidak ditemukan di token (req.user kosong)");
        return res.status(401).json({ message: "Unauthorized: Token invalid" });
    }

    // 2. Cek Data Body
    const { latitude, longitude, alamat, radius_m } = req.body;
    console.log(" Request Update Masuk:", { id_perusahaan, latitude, longitude, alamat, radius_m });

    // 3. Eksekusi Update
    const { data, error } = await supabase
      .from("perusahaan")
      .update({ 
        latitude: parseFloat(latitude),   // Pastikan tipe data float
        longitude: parseFloat(longitude), // Pastikan tipe data float
        alamat: alamat,
        radius_m: parseInt(radius_m)      // Pastikan tipe data integer
      })
      .eq("id_perusahaan", id_perusahaan)
      .select()
      .single();

    // 4. Cek Error Supabase
    if (error) {
        console.error(" Supabase Error:", error);
        throw error;
    }

    console.log(" Update Sukses. Data baru:", data);
    res.json({ message: " Perusahaan diperbarui", data });

  } catch (err) {
    console.error(" Gagal update server:", err);
    res.status(500).json({ message: "Gagal update perusahaan" });
  }
});

export default router;