// ===================================================================
// 📦 Import & Setup
// ===================================================================
import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { customAlphabet } from "nanoid";
import compression from "compression";
import path from "path";

dotenv.config({ path: path.resolve("../.env") });

const router = express.Router();
router.use(compression());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const makeShiftId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

// GET: ambil data karyawan berdasarkan perusahaan (dengan pagination)
router.get("/api/admin/karyawan/:id_perusahaan", async (req, res) => {
  const { id_perusahaan } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("akun")
    .select(`
      id_akun,
      username,
      email,
      id_jabatan,
      id_shift,
      no_tlp,
      alamat_karyawan,
      shift:shift!akun_id_shift_fkey(nama_shift, jam_masuk, jam_pulang)
    `, { count: 'exact' })
    .eq("id_perusahaan", id_perusahaan)
    .neq("id_jabatan", "ADMIN")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1); // 🟢 pagination di Supabase

  if (error) return res.status(500).json({ message: error.message });
  res.json({ data, total: count, page, limit });
});

// ===================================================================
// 🧑‍💼 POST: Tambah karyawan baru
// ===================================================================
router.post("/api/admin/karyawan", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      id_jabatan,
      id_perusahaan,
      no_tlp,
      alamat_karyawan,
      id_shift,
    } = req.body;

    const { data, error } = await supabase.from("akun").insert([
      {
        id_akun: uuidv4(),
        username,
        email,
        password,
        id_jabatan,
        id_perusahaan,
        no_tlp,
        alamat_karyawan,
        id_shift,
        created_at: new Date(),
      },
    ]);

    if (error) throw error;
    res.json({ message: "✅ Karyawan berhasil ditambahkan", data });
  } catch (err) {
    console.error("❌ Error tambah karyawan:", err);
    res.status(500).json({ message: "Gagal menambah karyawan" });
  }
});

// ===================================================================
// ✏️ PUT: Update data karyawan
// ===================================================================
router.put("/api/admin/karyawan/:id_akun", async (req, res) => {
  try {
    const { id_akun } = req.params;
    const { username, email, no_tlp, alamat_karyawan, id_shift } = req.body;

    const { data, error } = await supabase
      .from("akun")
      .update({ username, email, no_tlp, alamat_karyawan, id_shift })
      .eq("id_akun", id_akun)
      .select(`
        id_akun,
        username,
        email,
        no_tlp,
        alamat_karyawan,
        id_jabatan,
        id_shift,
        shift:shift!akun_id_shift_fkey (nama_shift, jam_masuk, jam_pulang)
      `)
      .single();

    if (error) throw error;
    res.json({ message: "✅ Data karyawan diperbarui", data });
  } catch (err) {
    console.error("❌ Error update karyawan:", err);
    res.status(500).json({ message: "Gagal memperbarui data karyawan" });
  }
});

// ===================================================================
// 🗑️ DELETE: Hapus karyawan
// ===================================================================
router.delete("/api/admin/karyawan/:id_akun", async (req, res) => {
  try {
    const { id_akun } = req.params;
    const { error } = await supabase.from("akun").delete().eq("id_akun", id_akun);
    if (error) throw error;
    res.json({ message: "🗑️ Karyawan berhasil dihapus" });
  } catch (err) {
    console.error("❌ Error hapus karyawan:", err);
    res.status(500).json({ message: "Gagal menghapus karyawan" });
  }
});

// ===================================================================
// 🕒 GET: Daftar shift berdasarkan perusahaan
// ===================================================================
router.get("/api/admin/shift/:id_perusahaan", async (req, res) => {
  try {
    const { id_perusahaan } = req.params;
    const { data, error } = await supabase
      .from("shift")
      .select("*")
      .eq("id_perusahaan", id_perusahaan);
    if (error) throw error;
    res.json({ message: "✅ Data shift ditemukan", data });
  } catch (err) {
    console.error("❌ Error get shift:", err);
    res.status(500).json({ message: "Gagal memuat shift" });
  }
});

// ===================================================================
// 🕓 POST: Tambah shift baru
// ===================================================================
router.post("/api/admin/shift", async (req, res) => {
  try {
    const { nama_shift, jam_masuk, jam_pulang, hari_shift, id_perusahaan } = req.body;
    const { data, error } = await supabase.from("shift").insert([
      {
        id_shift: makeShiftId(),
        nama_shift,
        jam_masuk,
        jam_pulang,
        hari_shift,
        id_perusahaan,
      },
    ]);

    if (error) throw error;
    res.json({ message: "✅ Shift berhasil ditambahkan", data });
  } catch (err) {
    console.error("❌ Error tambah shift:", err);
    res.status(500).json({ message: "Gagal menambah shift" });
  }
});

// ===================================================================
// ✏️ PUT: Edit shift
// ===================================================================
router.put("/api/admin/shift/:id_shift", async (req, res) => {
  try {
    const { id_shift } = req.params;
    const { nama_shift, jam_masuk, jam_pulang, hari_shift } = req.body;

    const { data, error } = await supabase
      .from("shift")
      .update({ nama_shift, jam_masuk, jam_pulang, hari_shift })
      .eq("id_shift", id_shift)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "✅ Shift berhasil diperbarui", data });
  } catch (err) {
    console.error("❌ Error edit shift:", err);
    res.status(500).json({ message: "Gagal memperbarui shift" });
  }
});

// ===================================================================
// 🗑️ DELETE: Hapus shift
// ===================================================================
router.delete("/api/admin/shift/:id_shift", async (req, res) => {
  try {
    const { id_shift } = req.params;

    const { error } = await supabase.from("shift").delete().eq("id_shift", id_shift);
    if (error) throw error;

    res.json({ message: "🗑️ Shift berhasil dihapus" });
  } catch (err) {
    console.error("❌ Error hapus shift:", err);
    res.status(500).json({ message: "Gagal menghapus shift" });
  }
});

// ======================================================
// -------------------Verifikasi Izin------------------
// ======================================================

// ===================================================
// 📌 GET: Semua izin untuk perusahaan tertentu
// ===================================================
router.get("/api/admin/izin/:id_perusahaan", async (req, res) => {
  try {
    const { id_perusahaan } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("izin_wfh")
      .select(`
        id_izin,
        id_akun,
        tanggal_mulai,
        tanggal_selesai,
        jenis_izin,
        alasan,
        status_persetujuan,
        tanggal_pengajuan,
        akun:akun!izin_wfh_id_akun_fkey(username)
      `, { count: "exact" })
      .eq("akun.id_perusahaan", id_perusahaan)
      .order("tanggal_pengajuan", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ data, page, limit, total: count });
  } catch (err) {
    console.error("❌ Error get izin:", err);
    res.status(500).json({ message: "Gagal memuat izin" });
  }
});



// ===================================================
// ✅ PATCH: Verifikasi Izin (Setujui / Tolak)
// ===================================================
router.patch("/api/admin/izin/:id_izin", async (req, res) => {
  try {
    const { id_izin } = req.params;
    const { status_persetujuan, id_verifikator, keterangan } = req.body;

    const { data, error } = await supabase
      .from("izin_wfh")
      .update({
        status_persetujuan,
        id_verifikator,
        tanggal_verifikasi: new Date(),
        keterangan: keterangan || null,
      })
      .eq("id_izin", id_izin)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: "✅ Status izin diperbarui", data });
  } catch (err) {
    console.error("❌ Error verifikasi izin:", err);
    res.status(500).json({ message: "Gagal memverifikasi izin" });
  }
});

export default router;
