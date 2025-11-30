// backend/utils/logger.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Pastikan load env
dotenv.config({ path: path.resolve("../../.env") });

// 🔥 PENTING: Gunakan SERVICE KEY, bukan Anon Key
// Jika SUPABASE_SERVICE_KEY tidak ada, fallback ke SUPABASE_KEY (tapi mungkin kena RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY 
);

export const logActivity = async ({
  id_akun,
  id_perusahaan,
  action,
  target_table = null,
  target_id = null,
  details = {},
  req = null
}) => {
  try {
    const ip_address = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    const user_agent = req ? req.headers['user-agent'] : null;

    const { error } = await supabaseAdmin.from("activity_logs").insert({
      id_akun,
      id_perusahaan,
      action,
      target_table,
      target_id,
      details,
      ip_address,
      user_agent
    });

    if (error) {
       console.error("⚠️ Gagal simpan log activity:", error.message);
    }

  } catch (error) {
    console.error("❌ Error system logger:", error);
  }
};