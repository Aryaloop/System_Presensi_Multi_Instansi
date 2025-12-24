import cron from "node-cron";
import { supabaseAdmin } from "../config/db.js"; // Pastikan db.js meng-export supabaseAdmin

export const checkSubscriptionStatus = async () => {
  console.log(" [CRON] Mengecek masa aktif langganan perusahaan...");
  
  const now = new Date().toISOString();

  // 1. Cari perusahaan yang masa aktifnya SUDAH LEWAT dan statusnya MASIH AKTIF
  // Hindari mematikan ID System Internal (PRE010)
  const { data: expiredTenants, error } = await supabaseAdmin
    .from("perusahaan")
    .select("id_perusahaan, nama_perusahaan")
    .eq("status_aktif", true)
    .neq("id_perusahaan", "PRE010") // Security Guard
    .lt("tanggal_berakhir_langganan", now); // lt = less than (kurang dari sekarang)

  if (error) {
    console.error("Error fetching expired tenants:", error);
    return;
  }

  if (expiredTenants && expiredTenants.length > 0) {
    const ids = expiredTenants.map(t => t.id_perusahaan);
    
    // 2. Matikan Statusnya (Suspend Otomatis)
    const { error: updateError } = await supabaseAdmin
      .from("perusahaan")
      .update({ status_aktif: false })
      .in("id_perusahaan", ids);

    if (!updateError) {
      console.log(` [AUTO-SUSPEND] Berhasil menonaktifkan ${ids.length} perusahaan: ${ids.join(", ")}`);
      // Optional: Kirim email notifikasi ke admin perusahaan bahwa langganan habis
    }
  } else {
    console.log(" [CRON] Tidak ada perusahaan yang expired hari ini.");
  }
};

// ------------------------------------------------------------------
// 1. JADWAL RUTIN (Tetap biarkan agar jalan tiap malam)
// ------------------------------------------------------------------
// Jalankan setiap jam 01:00 Pagi (WIB)
cron.schedule("0 1 * * *", checkSubscriptionStatus, {
  timezone: "Asia/Jakarta"
});

// ------------------------------------------------------------------
// 2. EKSEKUSI LANGSUNG SAAT STARTUP (FITUR YANG ANDA MINTA)
// ------------------------------------------------------------------
// Tambahkan baris ini agar fungsi langsung dipanggil saat file ini di-load oleh index.js
(async () => {
    console.log(" [INIT] Menjalankan pengecekan langganan awal saat startup...");
    await checkSubscriptionStatus();
})();

export default cron;