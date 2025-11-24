import express from "express";
import { createClient } from "@supabase/supabase-js";
import { getDistance } from "geolib";
import dotenv from "dotenv";
import path from "path";

// Path .env mundur 3 folder: user -> backend -> system -> root
dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 📍 GET Lokasi & Shift (Untuk Dashboard & Halaman Absen)
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
          nama_shift, jam_masuk, jam_pulang
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

    // 1. Ambil data akun
    const { data: akun, error: akunError } = await supabase
      .from("akun")
      .select("id_perusahaan, id_shift")
      .eq("id_akun", id_akun)
      .single();

    if (akunError || !akun) return res.status(404).json({ success: false, message: "Akun tidak ditemukan." });

    // 2. Cek apakah sudah absen hari ini
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const { data: existing } = await supabase
      .from("kehadiran")
      .select("*")
      .eq("id_akun", id_akun)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())
      .maybeSingle();

    // 3. Validasi Radius Lokasi
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

    // 4. Logika ABSEN MASUK
    if (tipe === "MASUK") {
      if (existing) return res.status(400).json({ success: false, message: "Sudah absen masuk hari ini." });

      let status = "HADIR";
      // Cek Keterlambatan
      if (akun.id_shift) {
        const { data: shift } = await supabase.from("shift").select("jam_masuk").eq("id_shift", akun.id_shift).maybeSingle();
        if (shift && shift.jam_masuk) {
          const now = new Date();
          const [h, m] = shift.jam_masuk.split(":");
          const jamShift = new Date(now);
          jamShift.setHours(h, m, 0);
          if (now > jamShift) status = "TERLAMBAT";
        }
      }

      await supabase.from("kehadiran").insert([{
        id_akun,
        id_shift: akun.id_shift,
        jam_masuk: new Date(),
        status,
        latitude_absen: latitude,
        longitude_absen: longitude,
        id_perusahaan: akun.id_perusahaan,
      }]);

      return res.json({ success: true, message: "Absen masuk berhasil disimpan." });
    }

    // 5. Logika ABSEN KELUAR
    if (tipe === "KELUAR") {
      if (!existing) return res.status(400).json({ success: false, message: "Belum ada absen masuk hari ini." });

      const { data: shift } = await supabase.from("shift").select("jam_pulang").eq("id_shift", akun.id_shift).maybeSingle();
      
      if (!shift?.jam_pulang) return res.status(400).json({ success: false, message: "Jam pulang shift belum diatur admin." });

      // Validasi jam pulang
      const now = new Date();
      const [sh, sm] = shift.jam_pulang.split(":");
      const waktuPulangShift = new Date(now);
      waktuPulangShift.setHours(parseInt(sh), parseInt(sm), 0);

      if (now < waktuPulangShift) {
        return res.status(403).json({ success: false, message: `Belum waktunya pulang. Jadwal: ${shift.jam_pulang} WIB.` });
      }

      const { error: updateError } = await supabase
        .from("kehadiran")
        .update({ jam_pulang: new Date() })
        .eq("id_kehadiran", existing.id_kehadiran);

      if (updateError) throw updateError;
      return res.json({ success: true, message: "Absen pulang berhasil disimpan." });
    }

    return res.status(400).json({ success: false, message: "Tipe absen tidak valid." });

  } catch (error) {
    console.error("❌ Error absen:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

export default router;