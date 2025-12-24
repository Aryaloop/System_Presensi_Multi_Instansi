// backend/superAdminRoutes/controllers/adminManagementController.js
import { supabase } from "../../config/db.js"; // IMPORT DARI DB.JS
import bcrypt from "bcryptjs";
import crypto from "crypto"; // Tambahan untuk generate password
import { sendEmail } from "../../utils/emailService.js"; // Pastikan path utils benar
import { logActivity } from "../../utils/logger.js"; // Pastikan path logger benar

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
    console.error(" [AdminManage] Get Error:", err.message);
    res.status(500).json({ message: "Gagal memuat data admin" });
  }
};

export const createAdmin = async (req, res) => {
  try {
    // 1. Ambil data dari body (HAPUS password dari input manual)
    const { username, email, id_perusahaan } = req.body;

    // Validasi dasar
    if (!username || !email || !id_perusahaan) {
      return res.status(400).json({ message: "Username, Email, dan ID Perusahaan wajib diisi" });
    }

    // 2. Cek Duplikat Email di tabel 'akun'
    const { data: existing } = await supabase
      .from("akun")
      .select("id_akun")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ message: "Email sudah terdaftar." });
    }

    // 3. Generate Random Password (8 karakter hex = 8 digit/huruf acak)
    // Contoh hasil: 'a1b2c3d4'
    const randomPassword = crypto.randomBytes(4).toString("hex");

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // 5. Insert ke tabel 'akun' sesuai Schema
    // id_akun akan otomatis di-generate oleh database (gen_random_uuid())
    const { data: newAdmin, error } = await supabase
      .from("akun")
      .insert([{
        username: username,
        email: email,
        password: hashedPassword,
        id_jabatan: "ADMIN",         // Sesuai constraint id_jabatan
        id_perusahaan: id_perusahaan,// Sesuai constraint id_perusahaan
        email_verified: true,        // Langsung verified karena dibuat SuperAdmin
        status_akun: 'AKTIF',        // Default aktif
        created_at: new Date()
      }])
      .select() // Select agar kita dapat ID akun baru untuk log
      .single();

    if (error) throw error;

    // 6. Log Activity (Mencatat SuperAdmin membuat Admin)
    // req.user biasanya dari middleware auth (SuperAdmin yang sedang login)
    // Jika req.user belum tersedia, pastikan middleware authMiddleware sudah terpasang di route ini
    await logActivity({
      req: req,
      id_akun: req.user?.id_akun || null, // ID SuperAdmin
      id_perusahaan: id_perusahaan,
      action: "CREATE_ADMIN",
      target_table: "akun",
      target_id: newAdmin.id_akun,
      details: {
        created_username: username,
        created_email: email,
        msg: "SuperAdmin membuat akun Admin baru"
      }
    });

    // 7. Kirim Email berisi Password Asli ke Admin Baru
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Selamat Datang di KitaPresensi</h2>
        <p>Halo <b>${username}</b>,</p>
        <p>Akun Admin Anda telah berhasil dibuat oleh SuperAdmin. Berikut adalah detail login Anda:</p>
        <table style="width: 100%; max-width: 400px; margin-top: 10px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Password:</td>
            <td style="padding: 8px; background: #f3f4f6; font-family: monospace; font-size: 16px; letter-spacing: 1px;">${randomPassword}</td>
          </tr>
        </table>
        <p>Silakan login dan segera ganti password Anda demi keamanan.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login Sekarang</a>
      </div>
    `;

    await sendEmail(email, "Akses Admin Baru KitaPresensi", htmlContent);

    res.status(201).json({
      message: "Admin berhasil dibuat. Password telah dikirim ke email ybs."
    });

  } catch (err) {
    console.error(" [AdminManage] Create Error:", err.message);
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
    console.error(" [AdminManage] Delete Error:", err.message);
    res.status(500).json({ message: "Gagal menghapus admin" });
  }
};