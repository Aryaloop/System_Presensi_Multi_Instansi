// backend/superAdminRoutes/controllers/adminManagementController.js
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Setup ENV Path yang aman
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export const getAllAdmins = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("akun")
      .select(`
        id_akun, username, email, id_perusahaan, status_akun,
        perusahaan ( nama_perusahaan )
      `, { count: "exact" })
      .eq("id_jabatan", "ADMIN");

    // LOGIC SEARCH YANG LEBIH BAIK
    if (search) {
      // Kita gunakan .or() untuk mencari di username ATAU email.
      // Untuk ID (UUID), Supabase agak strict. 
      // Jika input search adalah format UUID yang VALID, baru kita cari by ID.

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);

      if (isUUID) {
        // Jika user paste UUID lengkap, cari exact match
        query = query.eq('id_akun', search);
      } else {
        // Jika text biasa, cari di username atau email
        query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
      }
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ data, page, limit, total: count });
  } catch (err) {
    console.error("❌ [AdminManage] Get Error:", err.message);
    res.status(500).json({ message: "Gagal memuat data admin" });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { username, email, password, id_perusahaan } = req.body;

    if (!id_perusahaan) {
      return res.status(400).json({ message: "ID Perusahaan wajib diisi" });
    }

    // 1. Cek Duplikat Email
    const { data: existing } = await supabase
      .from("akun")
      .select("id_akun")
      .eq("email", email)
      .maybeSingle();

    if (existing) return res.status(400).json({ message: "Email sudah digunakan" });

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert Akun
    const { error } = await supabase.from("akun").insert({
      username,
      email,
      password: hashedPassword,
      id_jabatan: "ADMIN",
      id_perusahaan: id_perusahaan,
      email_verified: true,
      status_akun: 'AKTIF'
    });

    if (error) throw error;
    res.status(201).json({ message: "Admin berhasil dibuat" });
  } catch (err) {
    console.error("❌ [AdminManage] Create Error:", err.message);
    res.status(500).json({ message: "Gagal membuat admin: " + err.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("akun").delete().eq("id_akun", id);

    if (error) throw error;
    res.json({ message: "Akun admin berhasil dihapus" });
  } catch (err) {
    console.error("❌ [AdminManage] Delete Error:", err.message);
    res.status(500).json({ message: "Gagal menghapus admin" });
  }
};