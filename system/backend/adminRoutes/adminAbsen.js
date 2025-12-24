import express from "express";
import { supabase } from "../config/db.js"; // IMPORT DARI DB.JS

const router = express.Router();

// ====================================================================
// GET: Kehadiran (Pagination + Search UID + Sort Terbaru)
// ====================================================================
router.get("/api/admin/kehadiran", async (req, res) => {
  try {
    const id_perusahaan = req.user.id_perusahaan;
    const { bulan, tahun, status, search, page = 1, limit = 10 } = req.query;

    // 1. Validasi Wajib
    if (!bulan || !tahun) {
      return res.status(400).json({ message: "Parameter bulan dan tahun wajib diisi." });
    }

    // --- PERBAIKAN DISINI (Konversi ke Angka) ---
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    // Hitung range pagination yang benar
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    // ---------------------------------------------

    // Range Tanggal
    const startDate = `${tahun}-${bulan.toString().padStart(2, '0')}-01T00:00:00`;
    const lastDay = new Date(tahun, bulan, 0).getDate();
    const endDate = `${tahun}-${bulan.toString().padStart(2, '0')}-${lastDay}T23:59:59`;

    // 1. Query Dasar
    let query = supabase
      .from("kehadiran")
      .select(`
        *,
        akun:id_akun!inner (
            username,
            id_akun, 
            id_jabatan,
            jabatan:id_jabatan ( nama_jabatan )
        ),
        shift:id_shift ( nama_shift, jam_masuk, jam_pulang )
      `, { count: 'exact' }) // Minta total jumlah data juga
      .eq("id_perusahaan", id_perusahaan)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false }); // URUTKAN DARI TERBARU (Hari Ini Dulu)

    // 2. Filter Status
    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    // 3. Filter Search (Nama atau UID)
    if (search) {
      // Cek apakah input adalah UUID (pola 8-4-4-4-12 char)
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(search);
      
      if (isUUID) {
        // Jika UUID, cari berdasarkan ID Akun persis
        query = query.eq("id_akun", search);
      } else {
        // Jika bukan UUID, cari berdasarkan nama (ilike = case insensitive)
        // Kita filter di relasi 'akun' menggunakan !inner join di atas
        query = query.ilike("akun.username", `%${search}%`);
      }
    }

    // 4. Pagination (Batasi data yg diambil)
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_data: count,
        total_page: Math.ceil(count / limit)
      }
    });

  } catch (err) {
    console.error(" Error fetch kehadiran:", err);
    res.status(500).json({ message: "Gagal memuat data kehadiran." });
  }
});

// ====================================================================
// PATCH: Edit Kehadiran (Koreksi Admin)
// ====================================================================
router.patch("/api/admin/kehadiran/:id_kehadiran", async (req, res) => {
  try {
    const { id_kehadiran } = req.params;
    const { status, jam_masuk, jam_pulang, keterangan } = req.body;

    // Update data
    const { data, error } = await supabase
      .from("kehadiran")
      .update({
        status,       // Bisa ubah jadi HADIR, IZIN, ALFA, dll
        jam_masuk,    // Admin bisa set manual jamnya
        jam_pulang,
      })
      .eq("id_kehadiran", id_kehadiran)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: " Data kehadiran berhasil dikoreksi.", data });

  } catch (err) {
    console.error(" Error update:", err);
    res.status(500).json({ message: "Gagal mengupdate data." });
  }
});

export default router;