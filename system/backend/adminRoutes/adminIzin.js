import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET Izin
router.get("/api/admin/izin", async (req, res) => {
  try {
    const id_perusahaan = req.user.id_perusahaan;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("izin_wfh")
      .select(`
        id_izin, id_akun, tanggal_mulai, tanggal_selesai, jenis_izin, alasan,
        status_persetujuan, tanggal_pengajuan,
        akun:akun!izin_wfh_id_akun_fkey(username)
      `, { count: "exact" })
      .eq("akun.id_perusahaan", id_perusahaan)
      .order("tanggal_pengajuan", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ data, page, limit, total: count });
  } catch (err) {
    res.status(500).json({ message: "Gagal memuat izin" });
  }
});

// PATCH Verifikasi Izin
router.patch("/api/admin/izin/:id_izin", async (req, res) => {
  try {
    const { id_izin } = req.params;
    const { status_persetujuan, keterangan } = req.body;
    const id_verifikator = req.user.id_akun; 
    const id_perusahaan = req.user.id_perusahaan; 

    // 1. Update status
    const { data: izinData, error: updateError } = await supabase
      .from("izin_wfh")
      .update({
        status_persetujuan,
        id_verifikator,
        tanggal_verifikasi: new Date(),
        keterangan: keterangan || null,
      })
      .eq("id_izin", id_izin)
      .select().single();

    if (updateError) throw updateError;

    // 2. Auto Generate Kehadiran jika DISETUJUI
    if (status_persetujuan === "DISETUJUI" && izinData) {
      const startDate = new Date(izinData.tanggal_mulai);
      const endDate = new Date(izinData.tanggal_selesai);
      const insertPayloads = [];

      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        insertPayloads.push({
          id_akun: izinData.id_akun,
          id_shift: null,
          jam_masuk: null,
          jam_pulang: null,
          status: izinData.jenis_izin, 
          created_at: new Date(d).toISOString(), 
          id_perusahaan: id_perusahaan, 
          keterangan: "Otomatis dari Persetujuan Izin",
          latitude_absen: 0,
          longitude_absen: 0
        });
      }

      if (insertPayloads.length > 0) {
        await supabase.from("kehadiran").insert(insertPayloads);
      }
    }

    res.json({ message: "✅ Status izin diperbarui", izin: izinData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal verifikasi izin" });
  }
});

export default router;