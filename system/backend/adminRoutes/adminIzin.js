import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
// Gunakan SERVICE_ROLE_KEY agar bisa bypass RLS
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ====================================================================
// GET: Semua Data Izin (Hanya untuk perusahaan Admin login)
// ====================================================================
router.get("/api/admin/izin", async (req, res) => {
  try {
    const id_perusahaan = req.user.id_perusahaan; // ID Perusahaan Admin

    // --- PERBAIKAN QUERY ---
    const { data, error } = await supabase
      .from("izin_wfh")
      .select(`
        *,
        akun:id_akun!inner (     
          username,
          id_perusahaan,
          jabatan:id_jabatan ( nama_jabatan )
        )
      `)
      // Filter berdasarkan kolom di tabel RELASI (akun), bukan tabel izin_wfh
      .eq("akun.id_perusahaan", id_perusahaan) 
      .order("tanggal_pengajuan", { ascending: false });

    /* PENJELASAN PERUBAHAN:
       1. akun:id_akun!inner -> Menggunakan "!inner" (Inner Join).
          Artinya: Hanya ambil data izin yang punya akun valid DAN sesuai filter.
       2. .eq("akun.id_perusahaan", id_perusahaan) -> Kita filter kolom id_perusahaan MILIK AKUN.
          Kode lama kamu: .eq("id_perusahaan", ...) salah karena tabel izin_wfh gak punya kolom itu.
    */

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetch izin admin:", err);
    res.status(500).json({ message: "Gagal memuat data izin." });
  }
});

// ====================================================================
// PATCH: Verifikasi Izin (APPROVE/REJECT) + AUTO GENERATE ABSEN
// ====================================================================
router.patch("/api/admin/izin/:id_izin/verifikasi", async (req, res) => {
  try {
    const { id_izin } = req.params;
    const { status_persetujuan, keterangan_verifikator } = req.body;
    const id_verifikator = req.user.id_akun;

    // 1. Update Status di Tabel Izin WFH
    const { data: izinData, error: updateError } = await supabase
      .from("izin_wfh")
      .update({
        status_persetujuan,
        id_verifikator,
        tanggal_verifikasi: new Date(),
        keterangan: keterangan_verifikator 
      })
      .eq("id_izin", id_izin)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. JIKA DISETUJUI -> GENERATE DATA KEHADIRAN OTOMATIS
    if (status_persetujuan === "DISETUJUI") {
      const { id_akun, tanggal_mulai, tanggal_selesai, jenis_izin } = izinData;

      // Ambil detail akun untuk mengisi id_perusahaan & id_shift
      const { data: akunData } = await supabase
        .from("akun")
        .select("id_perusahaan, id_shift")
        .eq("id_akun", id_akun)
        .single();
      
      const id_perusahaan = akunData?.id_perusahaan;
      const id_shift = akunData?.id_shift;

      // Loop tanggal dari Mulai sampai Selesai
      let currentDate = new Date(tanggal_mulai);
      const endDate = new Date(tanggal_selesai);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]; 
        
        // Cek existing data (agar tidak duplikat dengan cronjob atau absen manual)
        const { data: existingAbsen } = await supabase
          .from("kehadiran")
          .select("id_kehadiran")
          .eq("id_akun", id_akun)
          .gte("created_at", `${dateStr}T00:00:00`)
          .lte("created_at", `${dateStr}T23:59:59`)
          .maybeSingle();

        // Payload KHUSUS Tabel Kehadiran (Tanpa kolom keterangan, sesuai schema)
        const payload = {
            status: jenis_izin, // 'IZIN' atau 'WFH'
            jam_masuk: null,    
            jam_pulang: null
        };

        if (existingAbsen) {
          // Update data lama (misal ALFA -> IZIN)
          await supabase
            .from("kehadiran")
            .update(payload)
            .eq("id_kehadiran", existingAbsen.id_kehadiran);
        } else {
          // Insert data baru
          await supabase
            .from("kehadiran")
            .insert({
              ...payload,
              id_akun,
              id_perusahaan,
              id_shift, 
              created_at: new Date(currentDate).toISOString()
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    res.json({ 
      success: true, 
      message: status_persetujuan === "DISETUJUI" 
        ? "Izin disetujui & data kehadiran telah dibuat." 
        : "Izin ditolak." 
    });

  } catch (err) {
    console.error("Error verifikasi izin:", err);
    res.status(500).json({ message: "Gagal memproses verifikasi." });
  }
});

export default router;