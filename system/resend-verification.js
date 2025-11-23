// resend-verification.js
import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "./emailService.js";
import path from "path";
dotenv.config({ path: path.resolve("../.env") });
const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// =========================================================
// 🧩 ROUTE: Kirim Ulang Email Verifikasi
// =========================================================
router.post("/", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email wajib diisi" });
        }

        // 🔍 Cek apakah email ada di database
        const { data: akun } = await supabase
            .from("akun")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (!akun) {
            return res.status(404).json({ success: false, message: "Email tidak ditemukan." });
        }

        // 🚫 Jika sudah diverifikasi, tidak perlu kirim ulang
        if (akun.email_verified) {
            return res.status(400).json({ success: false, message: "Email sudah diverifikasi." });
        }

        // 🔑 Buat token baru
        const newToken = uuidv4();

        // 🧩 Update token di database
        await supabase
            .from("akun")
            .update({ token_verifikasi: newToken })
            .eq("id_akun", akun.id_akun);

        // 📧 Kirim ulang email verifikasi
        const verifyLink = `${process.env.FRONTEND_URL}/verify/${newToken}`;
        await sendEmail(
            email,
            "Kirim Ulang Verifikasi Akun KitaPresensi",
            `Halo ${akun.username},\n\nBerikut tautan verifikasi baru untuk akun Anda:\n${verifyLink}\n\nLink ini hanya berlaku selama 3 menit.\n\nTerima kasih,\nTim KitaPresensi`
        );

        res.json({
            success: true,
            message: "Email verifikasi telah dikirim ulang. Cek inbox Anda.",
        });

        // Tambahkan penghapusan otomatis akun 3 menit setelah pengiriman ulang
        setTimeout(async () => {
            const { data: cek } = await supabase
                .from("akun")
                .select("email_verified")
                .eq("token_verifikasi", newToken)
                .maybeSingle();

            if (cek && !cek.email_verified) {
                await supabase.from("akun").delete().eq("token_verifikasi", newToken);
                console.log(`⏱️ Akun ${email} dihapus otomatis (tidak diverifikasi ulang dalam 3 menit).`);
            }
        }, 3 * 60 * 1000); // 3 menit

    } catch (err) {
        console.error("Gagal kirim ulang verifikasi:", err);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengirim ulang email verifikasi.",
        });
    }
});

export default router;
