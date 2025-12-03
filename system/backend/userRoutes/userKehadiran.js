import express from "express";
import { supabase } from "../config/db.js"; // IMPORT DARI DB.JS 


const router = express.Router();

//  GET: Data kehadiran (RPC Call untuk Kalender)
router.get("/api/user/kehadiran", async (req, res) => {
  try {
    const id_akun = req.user.id_akun;
    const bulan = parseInt(req.query.bulan);
    const tahun = parseInt(req.query.tahun);

    if (!id_akun || !bulan || !tahun) {
      return res.status(400).json({ success: false, message: "Parameter tidak lengkap." });
    }

    const { data, error } = await supabase.rpc("get_kehadiran_bulan", {
      _user_id: id_akun,
      _bulan: bulan,
      _tahun: tahun,
    });

    if (error) {
      console.error(" RPC Error:", error);
      return res.status(500).json({ success: false, message: "Gagal memuat data kalender." });
    }

    res.json({ success: true, count: data?.length || 0, data: data });

  } catch (err) {
    console.error(" Error RPC:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

export default router;