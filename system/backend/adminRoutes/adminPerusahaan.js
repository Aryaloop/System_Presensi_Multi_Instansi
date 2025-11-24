import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET Perusahaan
router.get("/api/admin/perusahaan", async (req, res) => {
  try {
    const id_perusahaan = req.user.id_perusahaan;
    const { data, error } = await supabase.from("perusahaan").select("*").eq("id_perusahaan", id_perusahaan).single();
    if (error) throw error;
    res.json({ message: "✅ Data perusahaan ditemukan", data });
  } catch (err) {
    res.status(500).json({ message: "Gagal memuat perusahaan" });
  }
});

// PUT Perusahaan
router.put("/api/admin/perusahaan", async (req, res) => {
  try {
    const id_perusahaan = req.user.id_perusahaan;
    const { latitude, longitude, alamat, radius_m } = req.body;
    const { data, error } = await supabase
      .from("perusahaan")
      .update({ latitude, longitude, alamat, radius_m })
      .eq("id_perusahaan", id_perusahaan)
      .select().single();

    if (error) throw error;
    res.json({ message: "✅ Perusahaan diperbarui", data });
  } catch (err) {
    res.status(500).json({ message: "Gagal update perusahaan" });
  }
});

export default router;