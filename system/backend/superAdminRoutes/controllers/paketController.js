// backend/superAdminRoutes/controllers/paketController.js

// 1. UBAH IMPORT: Gunakan supabaseAdmin (Service Role) agar bypass RLS
import { supabaseAdmin } from "../../config/db.js"; 

// 1. GET ALL PAKET
export const getAllPaket = async (req, res) => {
    try {
        // Gunakan supabaseAdmin
        const { data, error } = await supabaseAdmin
            .from("master_paket")
            .select("*")
            .order("harga", { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("Get Paket Error:", err);
        res.status(500).json({ message: "Gagal mengambil data paket." });
    }
};

// 2. CREATE PAKET
export const createPaket = async (req, res) => {
    try {
        const { nama_paket, durasi_hari, harga } = req.body;

        if (!nama_paket || !durasi_hari) {
            return res.status(400).json({ message: "Nama paket dan durasi hari wajib diisi." });
        }

        // Gunakan supabaseAdmin
        const { error } = await supabaseAdmin.from("master_paket").insert({
            nama_paket,
            durasi_hari: parseInt(durasi_hari),
            harga: parseFloat(harga || 0)
        });

        if (error) throw error;
        res.status(201).json({ message: "Paket berhasil ditambahkan." });

    } catch (err) {
        console.error("Create Paket Error:", err);
        // Tampilkan pesan error asli di console server agar mudah debug
        res.status(500).json({ 
            message: "Gagal membuat paket.", 
            error: err.message 
        });
    }
};

// 3. UPDATE PAKET
export const updatePaket = async (req, res) => {
    try {
        const { id_paket } = req.params;
        const { nama_paket, durasi_hari, harga } = req.body;

        // Gunakan supabaseAdmin
        const { error } = await supabaseAdmin
            .from("master_paket")
            .update({
                nama_paket,
                durasi_hari: parseInt(durasi_hari),
                harga: parseFloat(harga || 0)
            })
            .eq("id_paket", id_paket);

        if (error) throw error;
        res.json({ message: "Paket berhasil diperbarui." });

    } catch (err) {
        console.error("Update Paket Error:", err);
        res.status(500).json({ message: "Gagal update paket." });
    }
};

// 4. DELETE PAKET
export const deletePaket = async (req, res) => {
    try {
        const { id_paket } = req.params;

        // Gunakan supabaseAdmin
        const { error } = await supabaseAdmin
            .from("master_paket")
            .delete()
            .eq("id_paket", id_paket);

        if (error) throw error;
        res.json({ message: "Paket berhasil dihapus." });

    } catch (err) {
        console.error("Delete Paket Error:", err);
        res.status(500).json({ message: "Gagal menghapus paket." });
    }
};