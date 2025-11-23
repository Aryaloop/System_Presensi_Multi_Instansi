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
    `, { count: "exact" })
    .eq("id_perusahaan", id_perusahaan)
    .neq("id_jabatan", "ADMIN")
    .neq("id_jabatan", "SPRADM")     // ✅ tambahin ini
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

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

    // 1) Update status izin
    const { data: izin, error } = await supabase
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

    // ✅ Jika izin ditolak → selesai
    if (status_persetujuan !== "DISETUJUI") {
      return res.json({ message: "✅ Status izin diperbarui (DITOLAK)", izin });
    }

    // 2) Ambil info akun
    const { data: akun } = await supabase
      .from("akun")
      .select("id_perusahaan, id_shift")
      .eq("id_akun", izin.id_akun)
      .single();

    // 3) Generate tanggal per hari untuk diinput ke kehadiran
    const start = new Date(izin.tanggal_mulai);
    const end = new Date(izin.tanggal_selesai);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {

      // ⚠️ Cek dulu apakah sudah ada kehadiran untuk hari tersebut
      const dayISO = d.toISOString().split("T")[0];
      const { data: existed } = await supabase
        .from("kehadiran")
        .select("id_kehadiran")
        .eq("id_akun", izin.id_akun)
        .like("created_at", `${dayISO}%`);

      if (existed?.length > 0) continue; // ⛔ Jangan duplikat

      // ✅ Insert otomatis
      await supabase.from("kehadiran").insert({
        id_akun: izin.id_akun,
        id_shift: akun.id_shift || null,
        status: izin.jenis_izin.toUpperCase(), // IZIN / WFH
        id_perusahaan: akun.id_perusahaan,
        jam_masuk: null,
        jam_pulang: null,
        created_at: dayISO,
      });
    }

    return res.json({
      message: "✅ Izin DISETUJUI & kehadiran terisi otomatis",
      izin,
    });

  } catch (err) {
    console.error("❌ Error verifikasi izin:", err);
    res.status(500).json({ message: "Gagal memverifikasi izin" });
  }
});


// ===================================================================
// 🏢 GET: Ambil data perusahaan berdasarkan id
// ===================================================================
router.get("/api/admin/perusahaan/:id_perusahaan", async (req, res) => {
  try {
    const { id_perusahaan } = req.params;
    const { data, error } = await supabase
      .from("perusahaan")
      .select("*")
      .eq("id_perusahaan", id_perusahaan)
      .single();
    if (error) throw error;
    res.json({ message: "✅ Data perusahaan ditemukan", data });
  } catch (err) {
    console.error("❌ Error get perusahaan:", err);
    res.status(500).json({ message: "Gagal memuat data perusahaan" });
  }
});

// ===================================================================
// ✏️ PUT: Update lokasi perusahaan berdasarkan ID dari session login
// ===================================================================
router.put("/api/admin/perusahaan/:id_perusahaan", async (req, res) => {
  try {
    const { id_perusahaan } = req.params;
    const { latitude, longitude, alamat, radius_m } = req.body;

    const { data, error } = await supabase
      .from("perusahaan")
      .update({ latitude, longitude, alamat, radius_m })
      .eq("id_perusahaan", id_perusahaan)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "✅ Data perusahaan berhasil diperbarui", data });
  } catch (err) {
    console.error("❌ Error update perusahaan:", err);
    res.status(500).json({ message: "Gagal memperbarui data perusahaan" });
  }
});

// ===================================================================
// 📊 GET: Rekap kehadiran per karyawan
// ===================================================================
// ✅ GET: Kehadiran Bulanan
router.get("/api/admin/kehadiran-bulanan/:id_perusahaan", async (req, res) => {
  try {
    const { id_perusahaan } = req.params;
    const { bulan, tahun } = req.query;

    const start = new Date(tahun, bulan - 1, 1).toISOString();
    const end = new Date(tahun, bulan, 0).toISOString();

    const { data, error } = await supabase
      .from("kehadiran")
      .select(`
        id_kehadiran,
        id_akun,
        jam_masuk,
        jam_pulang,
        status,
        akun:akun!kehadiran_id_akun_fkey(username, id_shift, shift:shift!akun_id_shift_fkey(nama_shift))
      `)
      .eq("id_perusahaan", id_perusahaan)
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const result = data.map((d) => ({
      id_kehadiran: d.id_kehadiran,
      id_akun: d.id_akun,
      username: d.akun.username,
      nama_shift: d.akun.shift?.nama_shift || "-",
      jam_masuk: d.jam_masuk,
      jam_pulang: d.jam_pulang,
      status: d.status,
    }));

    res.json({ data: result });
  } catch (err) {
    console.error("❌ Error get kehadiran bulanan:", err);
    res.status(500).json({ message: "Gagal memuat data kehadiran bulanan" });
  }
});

// ✅ PATCH: Update Kehadiran Manual
router.patch("/api/admin/kehadiran/:id_kehadiran", async (req, res) => {
  try {
    const { id_kehadiran } = req.params;
    const { status, jam_masuk, jam_pulang } = req.body;

    const { data, error } = await supabase
      .from("kehadiran")
      .update({ status, jam_masuk, jam_pulang })
      .eq("id_kehadiran", id_kehadiran)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "✅ Kehadiran berhasil diperbarui", data });
  } catch (err) {
    console.error("❌ Error patch kehadiran:", err);
    res.status(500).json({ message: "Gagal memperbarui kehadiran" });
  }
});




export default router;
