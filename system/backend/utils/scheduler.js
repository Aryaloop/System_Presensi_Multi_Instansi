// backend/utils/scheduler.js
import cron from "node-cron";
import { supabaseAdmin } from "../config/db.js";

const startCleanupJob = () => {
  console.log(" Sistem Scheduler (Cron) siap dijalankan...");

  // Jalan setiap menit
  cron.schedule('* * * * *', async () => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    try {
      // 2. CARI TARGET (Hanya yang verified = false)
      // User yang verified = true TIDAK AKAN DISENTUH meskipun punya token.
      const { data: akunSampah, error: fetchError } = await supabaseAdmin
        .from('akun')
        .select('id_akun')
        .eq('email_verified', false) 
        .lt('created_at', threeMinutesAgo)
        .not('token_verifikasi', 'is', null); // Syarat 3: HARUS Punya Token (Tanda belum pernah verif)

      if (fetchError) throw fetchError;
      if (!akunSampah || akunSampah.length === 0) return;

      const idList = akunSampah.map(a => a.id_akun);

      // 3. HAPUS DATA ANAK DULU (Solusi Error Foreign Key)
      await supabaseAdmin.from('kehadiran').delete().in('id_akun', idList);
      await supabaseAdmin.from('izin_wfh').delete().in('id_akun', idList);
      await supabaseAdmin.from('activity_logs').delete().in('id_akun', idList);

      // 4. HAPUS AKUN UTAMA
      const { error: deleteError, count } = await supabaseAdmin
        .from('akun')
        .delete({ count: 'exact' })
        .in('id_akun', idList);

      if (deleteError) {
        console.error(" Gagal hapus akun:", deleteError.message);
      } else if (count > 0) {
        console.log(` BERHASIL MENYAPU: ${count} akun spam.`);
      }

    } catch (err) {
      console.error(" Error scheduler:", err.message);
    }
  });
};

export default startCleanupJob;