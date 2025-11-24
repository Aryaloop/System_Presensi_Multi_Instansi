import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env (mundur 3 folder dari config/db.js ke root)
dotenv.config({ path: path.resolve("../../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ SUPABASE_URL atau SUPABASE_KEY tidak ditemukan di .env");
}

// Export client raw jika dibutuhkan
export const supabase = createClient(supabaseUrl, supabaseKey);

// Class DatabaseService (Logic Database Wrapper)
class DatabaseService {
  constructor() {
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

  async countAkun() {
    return await this.client.from("akun").select("*", { count: "exact", head: true });
  }
}

// Export instance db agar bisa dipakai di controller
export const db = new DatabaseService();