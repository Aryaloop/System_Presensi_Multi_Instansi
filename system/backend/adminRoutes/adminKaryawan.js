import express from "express";
import { supabase } from "../config/db.js"; // IMPORT DARI DB.JS

const router = express.Router();

// GET Karyawan
router.get("/api/admin/karyawan", async (req, res) => {
  try {
    const id_perusahaan = req.user.id_perusahaan;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // UPDATE: Tambahkan kolom boolean hari kerja di dalam select shift
    const { data, error, count } = await supabase
      .from("akun")
      .select(`
        id_akun, username, email, id_jabatan, id_shift, status_akun, no_tlp, alamat_karyawan,
        shift:shift!akun_id_shift_fkey (
          nama_shift, 
          jam_masuk, 
          jam_pulang,
          is_senin, is_selasa, is_rabu, is_kamis, is_jumat, is_sabtu, is_minggu
        )
      `, { count: "exact" })
      .eq("id_perusahaan", id_perusahaan)
      .neq("id_jabatan", "ADMIN")
      .neq("id_jabatan", "SPRADM")
      .neq("id_jabatan", "SUBADMIN") // Opsional: Sembunyikan Sub Admin jika mau
      .order('status_akun', { ascending: true })// Status Account Filter menampilkan true paling atas
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ data, total: count, page, limit });

  } catch (err) {
    console.error("Error get karyawan:", err);
    res.status(500).json({ message: "Gagal memuat data karyawan" });
  }
});

// PUT Karyawan (Bisa untuk Edit Profil & Restore/Aktifkan Kembali)
router.put("/api/admin/karyawan/:id_akun", async (req, res) => {
  try {
    const { id_akun } = req.params;
    const id_perusahaan = req.user.id_perusahaan;
    
    // 1. Ambil semua kemungkinan input, termasuk status_akun
    const { username, email, no_tlp, alamat_karyawan, id_shift, status_akun } = req.body;

    // 2. Cek kepemilikan (Security)
    const { data: cekUser } = await supabase
      .from("akun")
      .select("id_perusahaan")
      .eq("id_akun", id_akun)
      .single();

    if (cekUser && cekUser.id_perusahaan !== id_perusahaan) {
      return res.status(403).json({ message: "Dilarang mengedit karyawan perusahaan lain" });
    }

    // 3. Susun data update secara dinamis
    // Kita hanya masukkan field yang dikirim oleh Frontend agar tidak menimpa data lain dengan NULL
    const updateData = {};

    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (no_tlp !== undefined) updateData.no_tlp = no_tlp;
    if (alamat_karyawan !== undefined) updateData.alamat_karyawan = alamat_karyawan;
    if (id_shift !== undefined) updateData.id_shift = id_shift;

    // Logika khusus untuk Restore / Ubah Status
    if (status_akun !== undefined) {
        updateData.status_akun = status_akun;
        
        // Jika diaktifkan kembali, bersihkan token reset password (best practice)
        if (status_akun === 'AKTIF') {
             updateData.token_reset = null; 
        }
    }

    // 4. Eksekusi Update
    const { data, error } = await supabase
      .from("akun")
      .update(updateData)
      .eq("id_akun", id_akun)
      .select().single();

    if (error) throw error;
    
    res.json({ message: " Data karyawan diperbarui", data });

  } catch (err) {
    console.error("Error update karyawan:", err); // Penting: Log error agar terlihat di terminal
    res.status(500).json({ message: "Gagal update karyawan" });
  }
});

// DELETE Karyawan (Sebenarnya Soft Delete / Non-aktifkan)
router.delete("/api/admin/karyawan/:id_akun", async (req, res) => {
  try {
    const { id_akun } = req.params;
    const id_perusahaan = req.user.id_perusahaan;

    // 1. Validasi Security (Pastikan user milik perusahaan admin ini)
    const { data: cekUser } = await supabase
      .from("akun")
      .select("id_perusahaan")
      .eq("id_akun", id_akun)
      .single();

    if (!cekUser || cekUser.id_perusahaan !== id_perusahaan) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // 2. PROSES SOFT DELETE (Update status jadi NONAKTIF)
    const { error } = await supabase
      .from("akun")
      .update({
        status_akun: 'NONAKTIF',
        token_reset: null, // Hapus token reset password biar aman
        // Opsional: Anda bisa tambahkan suffix ke email jika ingin email tsb bisa dipakai daftar ulang user baru
        // email: `deleted_${Date.now()}_${cekUser.email}` 
      })
      .eq("id_akun", id_akun);

    if (error) throw error;

    res.json({ message: " Karyawan berhasil dinonaktifkan (Soft Delete)" });

  } catch (err) {
    console.error("Soft delete error:", err);
    res.status(500).json({ message: "Gagal memproses data karyawan" });
  }
});

export default router;