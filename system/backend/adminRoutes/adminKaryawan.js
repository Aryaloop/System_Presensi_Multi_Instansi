import express from "express";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import path from "path";

// Sesuaikan path .env karena masuk satu folder lebih dalam
dotenv.config({ path: path.resolve("../../../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET Karyawan
router.get("/api/admin/karyawan", async (req, res) => {
  const id_perusahaan = req.user.id_perusahaan;
  const limit = parseInt(req.query.limit) || 20;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("akun")
    .select(`
      id_akun, username, email, id_jabatan, id_shift, no_tlp, alamat_karyawan,
      shift:shift!akun_id_shift_fkey(nama_shift, jam_masuk, jam_pulang)
    `, { count: "exact" })
    .eq("id_perusahaan", id_perusahaan)
    .neq("id_jabatan", "ADMIN")
    .neq("id_jabatan", "SPRADM")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ message: error.message });
  res.json({ data, total: count, page, limit });
});

// POST Karyawan
// router.post("/api/admin/karyawan", async (req, res) => {
//   try {
//     const { username, email, password, id_jabatan, no_tlp, alamat_karyawan, id_shift } = req.body;
//     const id_perusahaan = req.user.id_perusahaan;

//     const { data, error } = await supabase.from("akun").insert([
//       {
//         id_akun: uuidv4(),
//         username,
//         email,
//         password, // Disarankan di-hash dulu (bcrypt) sebelum masuk sini
//         id_jabatan,
//         id_perusahaan,
//         no_tlp,
//         alamat_karyawan,
//         id_shift,
//         created_at: new Date(),
//       },
//     ]);

//     if (error) throw error;
//     res.json({ message: "✅ Karyawan berhasil ditambahkan", data });
//   } catch (err) {
//     console.error("❌ Error tambah karyawan:", err);
//     res.status(500).json({ message: "Gagal menambah karyawan" });
//   }
// });

// PUT Karyawan
router.put("/api/admin/karyawan/:id_akun", async (req, res) => {
  try {
    const { id_akun } = req.params;
    const id_perusahaan = req.user.id_perusahaan;
    const { username, email, no_tlp, alamat_karyawan, id_shift } = req.body;

    // Cek kepemilikan
    const { data: cekUser } = await supabase.from("akun").select("id_perusahaan").eq("id_akun", id_akun).single();
    if (cekUser && cekUser.id_perusahaan !== id_perusahaan) {
      return res.status(403).json({ message: "Dilarang mengedit karyawan perusahaan lain" });
    }

    const { data, error } = await supabase
      .from("akun")
      .update({ username, email, no_tlp, alamat_karyawan, id_shift })
      .eq("id_akun", id_akun)
      .select().single();

    if (error) throw error;
    res.json({ message: "✅ Data karyawan diperbarui", data });
  } catch (err) {
    res.status(500).json({ message: "Gagal update karyawan" });
  }
});

// DELETE Karyawan
router.delete("/api/admin/karyawan/:id_akun", async (req, res) => {
  try {
    const { id_akun } = req.params;
    const { error } = await supabase.from("akun").delete().eq("id_akun", id_akun);
    if (error) throw error;
    res.json({ message: "🗑️ Karyawan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal hapus karyawan" });
  }
});

export default router;