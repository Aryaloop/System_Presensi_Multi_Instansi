import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// POST: Ajukan Izin / WFH
router.post("/api/user/izin", async (req, res) => {
  try {
    const { tanggal_mulai, tanggal_selesai, jenis_izin, alasan, keterangan } = req.body;
    const id_akun = req.user.id_akun;

    if (!id_akun || !tanggal_mulai || !tanggal_selesai || !jenis_izin)
      return res.status(400).json({ success: false, message: "Data tidak lengkap." });

    // --- BAGIAN LAMA DIHAPUS (Tidak perlu SELECT cek overlap) ---

    // Langsung Insert (Optimistic Approach)
    const { error: insertError } = await supabase.from("izin_wfh").insert([{
      id_akun,
      tanggal_mulai,
      tanggal_selesai,
      jenis_izin,
      alasan,
      keterangan,
      status_persetujuan: "PENDING"
    }]);

    if (insertError) {
      // Kode Error '23P01' adalah "Exclusion Violation" di PostgreSQL
      // Artinya: Data bentrok dengan constraint yang sudah kita pasang
      if (insertError.code === '23P01') {
        return res.status(400).json({
          success: false,
          message: "Kamu sudah memiliki izin di tanggal tersebut (Bentrok)."
        });
      }

      // Error lain (koneksi putus, struktur tabel salah, dll)
      throw insertError;
    }

    res.json({ success: true, message: "Pengajuan berhasil dikirim." });

  } catch (error) {
    console.error("❌ Error ajukan izin:", error);
    res.status(500).json({ success: false, message: "Gagal mengirim pengajuan." });
  }
});

// 📊 GET: Summary Izin (Untuk Dashboard/Statistik)
router.get("/api/user/izin/summary", async (req, res) => {
  try {
    const id_akun = req.user.id_akun;

    // Count Pending
    const { data: pending } = await supabase
      .from("izin_wfh")
      .select("id_izin")
      .eq("id_akun", id_akun)
      .eq("status_persetujuan", "PENDING");

    // Hitung Total WFH bulan ini
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const { data: approved } = await supabase
      .from("izin_wfh")
      .select("tanggal_mulai, tanggal_selesai")
      .eq("id_akun", id_akun)
      .eq("status_persetujuan", "DISETUJUI")
      .gte("tanggal_selesai", firstDay);

    let totalWFH = 0;
    approved?.forEach((i) => {
      const d1 = new Date(i.tanggal_mulai);
      const d2 = new Date(i.tanggal_selesai);
      totalWFH += (d2 - d1) / (1000 * 60 * 60 * 24) + 1;
    });

    res.json({ pending: pending?.length || 0, totalWFH });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Summary gagal dimuat" });
  }
});

export default router;