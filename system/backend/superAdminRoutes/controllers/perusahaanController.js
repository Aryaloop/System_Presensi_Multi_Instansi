// backend/superAdminRoutes/controllers/perusahaanController.js

/**
 * ==============================================================================
 * MODULE: Perusahaan Controller (Super Admin)
 * ==============================================================================
 * * Deskripsi:
 * Controller ini menangani operasi CRUD (Create, Read, Update, Delete) untuk
 * data 'Perusahaan' pada dashboard Super Admin.
 * * Fitur Utama: 
 * 1. Pagination & Search (Server-side).
 * 2. Proteksi Data System (Hardcoded ID Protection).
 * 3. Validasi Relasi (Mencegah hapus perusahaan jika masih ada akun).
 * * ⚠️ CRITICAL SECURITY NOTE:
 * ID Perusahaan "PRE010" adalah ID System/Internal (Presensi Kita).
 * ID ini DIPROTEKSI KERAS di level code (Backend) agar tidak bisa:
 * - Dilihat di list tabel (Hidden)
 * - Diedit (Blocked)
 * - Disuspend (Blocked)
 * - Dihapus (Blocked)
 * * JANGAN MENGHAPUS LOGIC PROTEKSI "PRE010" TANPA PERSETUJUAN SUPERVISOR.
 * ==============================================================================
 */

import { supabaseAdmin } from "../../config/db.js"; // IMPORT DARI DB.JS
import crypto from "crypto";

// 🔒 CONSTANT: ID Perusahaan System/Internal
// Digunakan untuk pengecekan security di setiap fungsi write/delete.
const SYSTEM_COMPANY_ID = "PRE010";


export const getAllPaket = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from("master_paket")
            .select("*")
            .order("harga", { ascending: true }); // Urutkan dari termurah

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: "Gagal ambil data paket" });
    }
};

/**
 * GET All Perusahaan
 * - Mendukung Pagination (page, limit)
 * - Mendukung Search (by nama atau id)
 * - Security: MENGECUALIKAN (.neq) ID System agar tidak muncul di UI Admin.
 */
export const getAllPerusahaan = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 15;
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        let query = supabaseAdmin
            .from("perusahaan")
            .select("*", { count: "exact" })
            // SECURITY FILTER: Sembunyikan System Company dari list
            .neq('id_perusahaan', SYSTEM_COMPANY_ID);

        if (search) {
            // Search bersifat Case-Insensitive (ilike) pada Nama atau ID
            query = query.or(`nama_perusahaan.ilike.%${search}%,id_perusahaan.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order("nama_perusahaan", { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        res.json({ data, page, limit, total: count });
    } catch (err) {
        console.error(" [Perusahaan] Get All Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * CREATE Perusahaan
 * - ID Perusahaan di-generate manual (8 karakter uppercase) untuk keperluan UX yang lebih pendek dari UUID.
 * - Default radius: 150m jika tidak diisi.
 */
// --- [UPDATE] FUNGSI CREATE PERUSAHAAN ---
export const createPerusahaan = async (req, res) => {
    try {
        // Frontend mengirim id_paket (dari dropdown), bukan durasi manual
        const { nama_perusahaan, alamat, status_aktif, radius_m, id_paket } = req.body;

        // 1. Ambil Detail Paket dari Database
        const { data: paket } = await supabaseAdmin
            .from("master_paket")
            .select("durasi_hari, nama_paket")
            .eq("id_paket", id_paket)
            .single();

        if (!paket) {
            return res.status(400).json({ message: "Paket tidak valid!" });
        }

        // 2. Hitung Tanggal Expired Otomatis
        const today = new Date();
        const expiredDate = new Date(today);
        expiredDate.setDate(today.getDate() + paket.durasi_hari);

        // 3. Generate ID & Simpan
        const id_perusahaan = crypto.randomUUID().slice(0, 8).toUpperCase();

        const { error } = await supabaseAdmin.from("perusahaan").insert({
            id_perusahaan,
            nama_perusahaan,
            alamat,
            status_aktif: status_aktif !== undefined ? status_aktif : true,
            radius_m: radius_m || 150,
            
            // Simpan info langganan
            tanggal_berakhir_langganan: expiredDate,
            paket_langganan: paket.nama_paket // Opsional: simpan nama paketnya buat history
        });

        if (error) throw error;

        res.status(201).json({ 
            message: `Perusahaan dibuat! Aktif selama ${paket.durasi_hari} hari (Sampai ${expiredDate.toISOString().split('T')[0]})` 
        });

    } catch (err) {
        console.error("Create Error:", err);
        res.status(500).json({ message: "Gagal membuat perusahaan" });
    }
};
/**
 * UPDATE Perusahaan
 * - Memiliki Proteksi ID System (403 Forbidden jika mencoba edit PRE010).
 */
// ... import dan code sebelumnya tetap sama

/**
 * UPDATE Perusahaan (Edit & Perpanjang Langganan)
 * - Jika frontend mengirim 'id_paket', maka durasi akan DITAMBAHKAN.
 * - Logika: 
 * a. Jika masa aktif masih ada -> Tambahkan hari ke tanggal expired terakhir (Extend).
 * b. Jika sudah expired -> Tambahkan hari mulai dari HARI INI (Reactivate).
 */
export const updatePerusahaan = async (req, res) => {
    try {
        const { id_perusahaan } = req.params;
        const { nama_perusahaan, alamat, status_aktif, id_paket } = req.body; // Ada id_paket

        // 1. SECURITY GUARD
        if (id_perusahaan === SYSTEM_COMPANY_ID) {
            return res.status(403).json({ message: "ACCESS DENIED: Cannot modify System Company." });
        }

        // 2. Siapkan Objek Update Dasar
        let updateData = {
            nama_perusahaan,
            alamat,
            status_aktif
        };

        // 3. LOGIKA TAMBAH DURASI (Jika Admin memilih paket saat Edit)
        if (id_paket) {
            // A. Ambil Info Paket
            const { data: paket } = await supabaseAdmin
                .from("master_paket")
                .select("durasi_hari, nama_paket")
                .eq("id_paket", id_paket)
                .single();

            if (!paket) return res.status(400).json({ message: "Paket tidak valid!" });

            // B. Ambil Tanggal Expired Saat Ini dari Perusahaan
            const { data: currentData } = await supabaseAdmin
                .from("perusahaan")
                .select("tanggal_berakhir_langganan")
                .eq("id_perusahaan", id_perusahaan)
                .single();

            let baseDate = new Date(); // Default hari ini
            const currentExp = currentData?.tanggal_berakhir_langganan ? new Date(currentData.tanggal_berakhir_langganan) : null;

            // C. Cek: Apakah masih aktif atau sudah mati?
            // Jika currentExp > hari ini, berarti masih aktif. Kita tambah dari currentExp.
            if (currentExp && currentExp > baseDate) {
                baseDate = currentExp; 
            }
            // Jika sudah expired (currentExp < hari ini), baseDate tetap hari ini.

            // D. Hitung Tanggal Baru
            const newExpiredDate = new Date(baseDate);
            newExpiredDate.setDate(baseDate.getDate() + paket.durasi_hari);

            // Masukkan ke data update
            updateData.tanggal_berakhir_langganan = newExpiredDate;
            updateData.paket_langganan = paket.nama_paket; // Update label paket terakhir
            updateData.status_aktif = true; // Otomatis aktifkan jika beli paket
        }

        // 4. Eksekusi Update ke Database
        const { error } = await supabaseAdmin
            .from("perusahaan")
            .update(updateData)
            .eq("id_perusahaan", id_perusahaan);

        if (error) throw error;
        
        res.json({ message: "Data perusahaan & langganan berhasil diperbarui!" });

    } catch (err) {
        console.error(" [Perusahaan] Update Error:", err);
        res.status(500).json({ message: "Gagal update data" });
    }
};

/**
 * SUSPEND Perusahaan (Soft Disable)
 * - Memiliki Proteksi ID System (403 Forbidden).
 */
export const suspendPerusahaan = async (req, res) => {
    try {
        const { id_perusahaan } = req.params;

        // SECURITY GUARD: Block suspend PRE010
        // Mencegah sistem terkunci sendiri (Lockout)
        if (id_perusahaan === SYSTEM_COMPANY_ID) {
            return res.status(403).json({ message: "ACCESS DENIED: Cannot suspend System Company." });
        }

        const { status } = req.body;

        const { error } = await supabaseAdmin
            .from("perusahaan")
            .update({ status_aktif: status })
            .eq("id_perusahaan", id_perusahaan);

        if (error) throw error;
        res.json({ message: `Status berhasil diubah menjadi ${status ? 'Aktif' : 'Suspend'}` });
    } catch (err) {
        console.error(" [Perusahaan] Suspend Error:", err);
        res.status(500).json({ message: "Gagal ubah status" });
    }
};

/**
 * DELETE Perusahaan
 * - Memiliki Proteksi ID System (403 Forbidden).
 * - Cek Foreign Key: Mencegah penghapusan jika masih ada 'akun' karyawan di dalamnya.
 */
export const deletePerusahaan = async (req, res) => {
    try {
        const { id_perusahaan } = req.params;

        // SECURITY GUARD: Block delete PRE010
        // Mencegah penghapusan data master sistem
        if (id_perusahaan === SYSTEM_COMPANY_ID) {
            return res.status(403).json({ message: "ACCESS DENIED: CRITICAL SYSTEM DATA PROTECTED." });
        }

        // CHECK RELASI: Cek tabel 'akun'
        const { data } = await supabaseAdmin
            .from("akun")
            .select("id_akun")
            .eq("id_perusahaan", id_perusahaan)
            .limit(1);

        if (data.length > 0) {
            return res.status(400).json({ message: "Gagal: Masih ada akun terdaftar di perusahaan ini." });
        }
        // Contoh di dalam fungsi deletePerusahaan
        await logActivity({
            req: req,
            id_akun: req.user.id_akun, // Dari middleware verifyToken
            id_perusahaan: null, // Karena super admin mungkin tidak terikat perusahaan target
            action: "DELETE_PERUSAHAAN",
            target_table: "perusahaan",
            target_id: id_perusahaan_yang_dihapus,
            details: { reason: "Permintaan penghapusan permanen" }
        });
        const { error } = await supabaseAdmin.from("perusahaan").delete().eq("id_perusahaan", id_perusahaan);
        if (error) throw error;
        res.json({ message: "Perusahaan dihapus permanen" });
    } catch (err) {
        console.error(" [Perusahaan] Delete Error:", err);
        res.status(500).json({ message: "Gagal hapus data" });
    }
};