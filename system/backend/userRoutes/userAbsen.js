import express from "express";
import { supabase } from "../config/db.js"; // IMPORT DARI DB.JS
import { getDistance } from "geolib";

const router = express.Router();

// GET Lokasi & Shift (Updated: Mengambil kolom boolean hari)
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
    console.error(" Error lokasi-shift:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// POST Absen GPS (Masuk / Keluar)
router.post("/api/user/absen", async (req, res) => {
  try {
    const { latitude, longitude, tipe } = req.body;
    const id_akun = req.user.id_akun;

    // ==========================================
    // LOGIKA ABSEN MASUK (MENGGUNAKAN RPC)
    // ==========================================
    if (tipe === "MASUK") {
      // Panggil Function di Database (Hanya 1 Request ke Singapore)
      const { data, error } = await supabase.rpc('absen_masuk', {
        p_id_akun: id_akun,
        p_lat: latitude,
        p_long: longitude
      });

      if (error) {
        console.error(" RPC Error:", error);
        return res.status(500).json({ success: false, message: "Terjadi kesalahan sistem." });
      }

      // Supabase RPC mengembalikan JSON { success: true/false, message: "..." }
      // Kita tinggal forward response-nya ke frontend
      if (!data.success) {
        return res.status(400).json({ success: false, message: data.message });
      }

      return res.json({ success: true, message: data.message });
    }

    // Ganti blok logika KELUAR yang panjang dengan ini:
    if (tipe === "KELUAR") {
      const { data, error } = await supabase.rpc('absen_keluar', {
        p_id_akun: id_akun
      });

      if (error) {
        console.error(" RPC Error:", error);
        return res.status(500).json({ success: false, message: "Terjadi kesalahan sistem." });
      }

      if (!data.success) {
        return res.status(400).json({ success: false, message: data.message });
      }

      return res.json({ success: true, message: data.message });
    }
  } catch (error) {
    console.error(" Error absen:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

export default router;