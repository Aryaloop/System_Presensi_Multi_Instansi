import express from "express";
import { createClient } from "@supabase/supabase-js";
import { getDistance } from "geolib";
import dotenv from "dotenv";
import path from "path";

// Sesuaikan path .env
dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 📍 GET Lokasi & Shift (Updated: Mengambil kolom boolean hari)
router.get("/api/user/lokasi-shift", async (req, res) => {
  try {
    const id_akun = req.user.id_akun;

    const { data, error } = await supabase
      .from("akun")
      .select(`
        id_akun,
        username,
        perusahaan:id_perusahaan (
          nama_perusahaan, alamat, latitude, longitude, radius_m
        ),
        shift:id_shift (
          nama_shift, jam_masuk, jam_pulang,
          is_senin, is_selasa, is_rabu, is_kamis, is_jumat, is_sabtu, is_minggu
        )
      `)
      .eq("id_akun", id_akun)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "User tidak ditemukan." });

    res.json({
      success: true,
      perusahaan: data.perusahaan,
      shift: data.shift || null,
    });

  } catch (err) {
    console.error("❌ Error lokasi-shift:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// 📍 POST Absen GPS (Masuk / Keluar)
router.post("/api/user/absen", async (req, res) => {
  try {
    const { latitude, longitude, tipe } = req.body;
    const id_akun = req.user.id_akun;

    // 1. Ambil data akun & shift untuk validasi
    const { data: akun, error: akunError } = await supabase
      .from("akun")
      .select(`
        id_perusahaan, 
        id_shift,
        shift:id_shift ( jam_masuk ) 
      `)
      .eq("id_akun", id_akun)
      .single();

    if (akunError || !akun) return res.status(404).json({ success: false, message: "Akun tidak ditemukan." });

    // 2. Validasi Radius Lokasi
    const { data: perusahaan } = await supabase
      .from("perusahaan")
      .select("latitude, longitude, radius_m")
      .eq("id_perusahaan", akun.id_perusahaan)
      .single();

    const jarak = getDistance(
      { latitude: Number(latitude), longitude: Number(longitude) },
      { latitude: perusahaan.latitude, longitude: perusahaan.longitude }
    );

    if (jarak > perusahaan.radius_m) {
      return res.status(403).json({
        success: false,
        message: `Kamu berada di luar area kantor (${jarak} m dari titik kantor).`,
      });
    }

    // Set Rentang Waktu Hari Ini (00:00 - 23:59)
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // Cari data absen hari ini (Yang seharusnya sudah dibuat oleh Cron Job sebagai 'ALFA')
    const { data: absenHarian } = await supabase
      .from("kehadiran")
      .select("*")
      .eq("id_akun", id_akun)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())
      .maybeSingle();

    // ==========================================
    // LOGIKA ABSEN MASUK
    // ==========================================
    if (tipe === "MASUK") {
      // Jika tidak ada data row sama sekali -> Berarti hari ini Cron Job tidak membuat data
      // Artinya: HARI LIBUR / BUKAN JADWAL SHIFT
      if (!absenHarian) {
        return res.status(400).json({ success: false, message: "Hari ini bukan jadwal shift Anda (Libur)." });
      }

      // Jika kolom jam_masuk sudah terisi -> Tolak
      if (absenHarian.jam_masuk) {
        return res.status(400).json({ success: false, message: "Anda sudah absen masuk hari ini." });
      }

      let status = "HADIR";
  

      // Cek Keterlambatan (Toleransi 30 Menit dari jam shift)
      if (akun.shift && akun.shift.jam_masuk) {
        const now = new Date();
        const [h, m] = akun.shift.jam_masuk.split(":");

        // Waktu Masuk Shift Hari Ini
        const jamShift = new Date(now);
        jamShift.setHours(h, m, 0);

        // Waktu Toleransi (Shift + 30 menit)
        const jamToleransi = new Date(jamShift.getTime() + 30 * 60000);

        if (now > jamToleransi) {
          status = "TERLAMBAT";
        }
      }

      // UPDATE baris yang sudah ada (mengubah ALFA menjadi HADIR/TERLAMBAT)
      const { error: updateError } = await supabase
        .from("kehadiran")
        .update({
          jam_masuk: new Date(),
          status: status,
          latitude_absen: latitude,
          longitude_absen: longitude
        })
        .eq("id_kehadiran", absenHarian.id_kehadiran);

      if (updateError) throw updateError;

      return res.json({ success: true, message: `Absen masuk berhasil. Status: ${status}` });
    }

    // ==========================================
    // LOGIKA ABSEN KELUAR (PULANG)
    // ==========================================
    if (tipe === "KELUAR") {
      if (!absenHarian) {
         return res.status(400).json({ success: false, message: "Data kehadiran tidak ditemukan." });
      }

      // Harus sudah absen masuk dulu
      if (!absenHarian.jam_masuk) {
        return res.status(400).json({ success: false, message: "Anda belum absen masuk hari ini." });
      }

      // Cek apakah sudah pulang sebelumnya
      if (absenHarian.jam_pulang) {
        return res.status(400).json({ success: false, message: "Anda sudah absen pulang hari ini." });
      }

      // Update Jam Pulang
      const { error: updateError } = await supabase
        .from("kehadiran")
        .update({
          jam_pulang: new Date()
        })
        .eq("id_kehadiran", absenHarian.id_kehadiran);

      if (updateError) throw updateError;

      return res.json({ success: true, message: "Hati-hati di jalan! Absen pulang berhasil." });
    }

    return res.status(400).json({ success: false, message: "Tipe absen tidak valid." });

  } catch (error) {
    console.error("❌ Error absen:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

export default router;