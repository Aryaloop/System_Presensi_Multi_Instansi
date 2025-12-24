import { supabase } from "../../config/db.js";

export const getActivityLogs = async (req, res) => {
  try {
    // 1. Ambil parameter page & limit dari URL (Default: Page 1, Limit 30)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const search = req.query.search || ""; // Persiapan fitur search (opsional)

    // 2. Hitung Range untuk Supabase (Zero-based index)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 3. Query Dasar
    let query = supabase
      .from("activity_logs")
      .select(`
        *,
        akun:id_akun ( username, email, id_jabatan )
      `, { count: 'exact' }); // 'exact' agar kita dapat Total Data untuk menghitung halaman

    // (Opsional) Jika ingin filter sederhana di backend bisa ditambahkan di sini
    if (search) {
      query = query.ilike('action', `%${search}%`);
    }

    // 4. Eksekusi Query dengan Pagination & Ordering
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    // 5. Kirim Respon Lengkap (Data + Info Pagination)
    res.json({
      status: "success",
      data: data,
      pagination: {
        page: page,
        limit: limit,
        total_data: count,
        total_pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Gagal mengambil log aktivitas" });
  }
};