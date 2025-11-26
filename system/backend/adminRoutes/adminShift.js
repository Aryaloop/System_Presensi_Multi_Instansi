import express from "express";
import { createClient } from "@supabase/supabase-js";
import { customAlphabet } from "nanoid";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const makeShiftId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

// GET Shift
router.get("/api/admin/shift", async (req, res) => {
  try {
    const id_perusahaan = req.user.id_perusahaan;
    const { data, error } = await supabase.from("shift").select("*").eq("id_perusahaan", id_perusahaan);
    if (error) throw error;
    res.json({ message: "✅ Data shift ditemukan", data });
  } catch (err) {
    res.status(500).json({ message: "Gagal memuat shift" });
  }
});

// POST Shift
router.post("/api/admin/shift", async (req, res) => {
  try {
    const { nama_shift, jam_masuk, jam_pulang, hari_shift } = req.body;
    const id_perusahaan = req.user.id_perusahaan;

    const { data, error } = await supabase.from("shift").insert([
      {
        id_shift: makeShiftId(),
        nama_shift,
        jam_masuk,
        jam_pulang,
        hari_shift,
        id_perusahaan,
      },
    ]);

    if (error) throw error;
    res.json({ message: "✅ Shift berhasil ditambahkan", data });
  } catch (err) {
    res.status(500).json({ message: "Gagal menambah shift" });
  }
});

// PUT Shift
router.put("/api/admin/shift/:id_shift", async (req, res) => {
  try {
    const { id_shift } = req.params;
    const { nama_shift, jam_masuk, jam_pulang, hari_shift } = req.body;
    const { data, error } = await supabase
      .from("shift")
      .update({ nama_shift, jam_masuk, jam_pulang, hari_shift })
      .eq("id_shift", id_shift)
      .select().single();
    if (error) throw error;
    res.json({ message: "✅ Shift berhasil diperbarui", data });
  } catch (err) {
    res.status(500).json({ message: "Gagal update shift" });
  }
});

// DELETE Shift
router.delete("/api/admin/shift/:id_shift", async (req, res) => {
  try {
    const { id_shift } = req.params;
    const { error } = await supabase.from("shift").delete().eq("id_shift", id_shift);
    if (error) throw error;
    res.json({ message: "🗑️ Shift berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal hapus shift" });
  }
});

export default router;