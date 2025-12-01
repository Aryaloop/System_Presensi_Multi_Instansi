// frontend/createAdmin.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "./emailService.js";
import path from "path";
import { logActivity } from "./utils/logger.js";
dotenv.config({ path: path.resolve("../../.env") });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export class CreateAdminController {
  static async createAdmin(req, res) {
    try {
      const { username, email, id_perusahaan } = req.body;
      if (!username || !email || !id_perusahaan)
        return res.status(400).json({ message: "Data tidak lengkap." });

      // 🔹 Cek email sudah ada
      const { data: existing, error: checkError } = await supabase
        .from("akun")
        .select("id_akun")
        .eq("email", email)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;
      if (existing)
        return res
          .status(400)
          .json({ message: "Email sudah terdaftar di sistem." });

      // 🔐 Buat password & token
      const tempPassword = crypto.randomBytes(4).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const tokenVerifikasi = crypto.randomUUID();

      // 🧩 Insert ke tabel akun
      const { data, error: insertError } = await supabase
        .from("akun")
        .insert([
          {
            username,
            email,
            password: hashedPassword,
            id_jabatan: "ADMIN",
            id_perusahaan,
            email_verified: false,
            token_verifikasi: tokenVerifikasi,
            created_at: new Date(),
          },
        ])
        .select();
      //Log Activity
      // Asumsi: Super Admin sudah login, jadi req.user ada (dari middleware verifyToken)
      await logActivity({
        req: req,
        id_akun: req.user.id_akun, // ID Super Admin yang melakukan aksi
        id_perusahaan: id_perusahaan, // Perusahaan target admin baru
        action: "CREATE_ADMIN",
        target_table: "akun",
        target_id: email, // Atau UUID admin baru jika ada
        details: {
          new_admin_username: username,
          new_admin_email: email,
          msg: "Super Admin membuat Admin baru"
        }
      });

      if (insertError) throw insertError;

      // 💌 Kirim email
      const html = `
        <div style="font-family:sans-serif;background:#f6f7fb;padding:30px;">
          <div style="background:#fff;padding:20px;border-radius:8px;max-width:500px;margin:auto;">
            <h2 style="color:#4f46e5;">Akun Admin Baru</h2>
            <p>Halo <b>${username}</b>, akun admin Anda telah dibuat oleh Super Admin.</p>
            <p><b>Email:</b> ${email}<br/><b>Password sementara:</b> ${tempPassword}</p>
            <p>Silakan login dan ubah password Anda setelah login pertama.</p>
          </div>
        </div>
      `;

      const emailSent = await sendEmail(
        email,
        "📩 Akun Admin Baru - KitaPresensi",
        html,
        true
      );

      if (!emailSent) throw new Error("Email gagal dikirim");

      // ✅ Update email_verified true setelah sukses kirim email
      await supabase
        .from("akun")
        .update({ email_verified: true })
        .eq("email", email);

      return res.json({
        message: `Akun admin ${username} berhasil dibuat dan email telah dikirim.`,
      });
    } catch (err) {
      console.error("❌ createAdmin error:", err);
      return res.status(500).json({
        message: err.message || "Gagal membuat admin baru atau mengirim email.",
      });
    }
  }
}
