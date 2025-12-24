// backend/config/db.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Setup path env yang benar (mundur ke root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });// <--- Sesuaikan denga penyimpanan env anda jangan lupa harus ada 3 paramater SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;         // ANON KEY (Aman, kena RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // SERVICE KEY (Sakti, Bypass RLS)

if (!supabaseUrl || !supabaseKey) {
  throw new Error(" SUPABASE_URL atau SUPABASE_KEY tidak ditemukan di .env");
}

// ---------------------------------------------------------
// 1. CLIENT STANDARD (Untuk Auth, User, Admin Routes)
// ---------------------------------------------------------
// Gunakan ini untuk interaksi user biasa. Menghormati aturan RLS database.
export const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------
// 2. CLIENT ADMIN (Untuk Scheduler, Logger, CronJob)
// ---------------------------------------------------------
// Gunakan ini HANYA untuk background process. Bisa baca/hapus semua data.
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

if (!supabaseAdmin) {
  console.warn(" PERINGATAN: SUPABASE_SERVICE_KEY belum diset. Fitur Scheduler mungkin gagal.");
}

// ---------------------------------------------------------
// 3. DATABASE SERVICE (Helper Wrapper)
// ---------------------------------------------------------

class DatabaseService {
  constructor() {
    // Secara default helper ini menggunakan client standard (Aman)
    this.client = supabase;
  }

  async insertAkun(payload) {
    return await this.client.from("akun").insert(payload).select();
  }

  async findAkunByEmail(email) {
    return await this.client.from("akun").select("*").eq("email", email).single();
  }

  async findAkunById(id) {
    return await this.client.from("akun").select("*").eq("id_akun", id).single();
  }

  // Fungsi ini dipakai di authController.js bagian health check
  async countAkun() {
    return await this.client.from("akun").select("*", { count: "exact", head: true });
  }
}

// Export instance db agar bisa dipakai
export const db = new DatabaseService();