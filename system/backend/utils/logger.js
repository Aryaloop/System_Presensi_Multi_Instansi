import { supabaseAdmin } from "../config/db.js";

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
      console.error(" Gagal simpan log activity:", error.message);
    }

  } catch (error) {
    console.error(" Error system logger:", error);
  }
};