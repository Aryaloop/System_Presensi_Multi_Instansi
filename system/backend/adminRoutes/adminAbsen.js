import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET Kehadiran Bulanan
router.get("/api/admin/kehadiran-bulanan", async (req, res) => {
  try {
    const id_perusahaan = req.user.id_perusahaan;
    const { bulan, tahun } = req.query;
    const start = new Date(tahun, bulan - 1, 1).toISOString();
    const end = new Date(tahun, bulan, 0).toISOString();

    const { data, error } = await supabase
      .from("kehadiran")
      .select(`
        id_kehadiran, id_akun, jam_masuk, jam_pulang, status, created_at,
        akun:akun!kehadiran_id_akun_fkey(username, id_shift, shift:shift!akun_id_shift_fkey(nama_shift))
      `)
      .eq("id_perusahaan", id_perusahaan)
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const result = data.map((d) => ({
      id_kehadiran: d.id_kehadiran,
      id_akun: d.id_akun,
      username: d.akun.username,
      nama_shift: d.akun.shift?.nama_shift || "-",
      jam_masuk: d.jam_masuk,
      jam_pulang: d.jam_pulang,
      status: d.status,
      created_at: d.created_at,
    }));
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: "Gagal memuat kehadiran" });
  }
});

// PATCH Edit Kehadiran
router.patch("/api/admin/kehadiran/:id_kehadiran", async (req, res) => {
  try {
    const { id_kehadiran } = req.params;
    const { status, jam_masuk, jam_pulang } = req.body;
    const { data, error } = await supabase
      .from("kehadiran")
      .update({ status, jam_masuk, jam_pulang })
      .eq("id_kehadiran", id_kehadiran)
      .select().single();
    if (error) throw error;
    res.json({ message: "✅ Kehadiran diperbarui", data });
  } catch (err) {
    res.status(500).json({ message: "Gagal update kehadiran" });
  }
});

export default router;