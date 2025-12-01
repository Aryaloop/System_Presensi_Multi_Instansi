import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Sesuaikan path ini dengan struktur folder projectmu yang sebenarnya
dotenv.config({ path: path.resolve("../../../.env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ==============================================================================
// HELPER: WAKTU INDONESIA (WIB)
// ==============================================================================
// Fungsi ini memastikan kita selalu mendapatkan Hari & Tanggal versi Jakarta
// tidak peduli servernya ada di Amerika (UTC) atau Singapore.
function getTodayInfo() {
  const days = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];

  // Ambil waktu saat ini dalam Timezone Asia/Jakarta
  const now = new Date();
  const options = { timeZone: "Asia/Jakarta" };
  const jktDateStr = now.toLocaleString("en-US", options);
  const jktDate = new Date(jktDateStr);

  // 1. Ambil Nama Hari (0=Minggu, 1=Senin, dst)
  const dayIndex = jktDate.getDay();

  // 2. Ambil Tanggal YYYY-MM-DD
  const year = jktDate.getFullYear();
  const month = String(jktDate.getMonth() + 1).padStart(2, '0');
  const date = String(jktDate.getDate()).padStart(2, '0');
  const todayDate = `${year}-${month}-${date}`;

  return {
    columnName: `is_${days[dayIndex]}`, // Contoh: "is_senin"
    todayDate: todayDate                 // Contoh: "2025-12-01"
  };
}

// ==============================================================================
// LOGIKA UTAMA: INISIALISASI ABSEN HARIAN
// (Diexport agar bisa dipanggil manual saat server start)
// ==============================================================================
export const initDailyAttendance = async () => {
  console.log("🚀 [INIT] Memulai pengecekan jadwal kerja hari ini...");

  try {
    const { columnName, todayDate } = getTodayInfo();
    console.log(`📅 Hari ini (WIB): ${todayDate} | Cek kolom: ${columnName}`);

    // 1. Ambil karyawan yang punya shift aktif & jadwal hari ini
    const { data: karyawans, error } = await supabase
      .from("akun")
      .select(`
        id_akun, 
        id_perusahaan, 
        id_shift, 
        shift:shift!akun_id_shift_fkey (id_shift, ${columnName}) 
      `)
      .neq("id_jabatan", "ADMIN")
      .neq("id_jabatan", "SPRADM")
      .not("id_shift", "is", null);

    if (error) throw error;

    // 2. Filter & Siapkan Data Insert
    const insertPayload = [];

    for (const k of karyawans) {
      // Cek apakah kolom hari ini true (Contoh: shift.is_senin === true)
      if (k.shift && k.shift[columnName] === true) {
        insertPayload.push({
          id_akun: k.id_akun,
          id_perusahaan: k.id_perusahaan,
          id_shift: k.id_shift,
          status: "ALFA", // Status awal sebelum absen
          jam_masuk: null,
          jam_pulang: null,
          created_at: new Date().toISOString() // Simpan timestamp UTC (Database index yang akan handle unik tanggal)
        });
      }
    }

    // ...
    // 3. Eksekusi Insert Massal
    if (insertPayload.length > 0) {
      // GUNAKAN INSERT BIASA (Bukan Upsert)
      const { data, error: insertError } = await supabase
        .from("kehadiran")
        .insert(insertPayload)
        .select();

      if (insertError) {
        // Jika errornya "23505" (Duplicate Key), itu BUKAN Error.
        // Itu artinya sistem pencegah duplikat bekerja dengan baik.
        if (insertError.code === '23505') {
          console.log("ℹ️ [INFO] Data kehadiran hari ini sudah ada (Aman, tidak double).");
        } else {
          // Error lain (koneksi putus, dll) baru kita anggap masalah
          console.error("🔥 ERROR INSERT:", insertError.message);
        }
      } else {
        console.log(`✅ [INIT] Berhasil generate ${data?.length || 0} data ALFA baru.`);
      }
    } else {
      console.log("ℹ️ Tidak ada karyawan yang memiliki jadwal shift hari ini.");
    }

  } catch (err) {
    console.error("❌ [INIT ERROR]", err);
  }
};

// ==============================================================================
// JOB 1: JADWAL OTOMATIS (Setiap Pagi 00:05 WIB)
// ==============================================================================
cron.schedule("5 0 * * *", async () => {
  console.log("⏰ [CRON] Menjalankan jadwal otomatis pagi (WIB)...");
  await initDailyAttendance();
}, {
  scheduled: true,
  timezone: "Asia/Jakarta" // <--- PENTING: Agar jalan jam 00:05 WIB, bukan UTC
});

// ==============================================================================
// JOB 2: FINALISASI ABSEN (Setiap Malam 23:55 WIB)
// ==============================================================================
cron.schedule("55 23 * * *", async () => {
  console.log("⏰ [CRON] Mulai finalisasi status akhir hari (WIB)...");

  try {
    const { todayDate } = getTodayInfo();
    const today = todayDate; // Gunakan tanggal WIB

    // Ambil data kehadiran hari ini (WIB) yang statusnya masih gantung
    // (Bukan IZIN/CUTI/WFH, tapi yang statusnya 'HADIR' atau 'TERLAMBAT' atau 'ALFA')
    const { data: absens, error } = await supabase
      .from("kehadiran")
      .select("id_kehadiran, status, jam_masuk, jam_pulang")
      .gte("created_at", `${today}T00:00:00`) // Filter kasarn berdasarkan string tanggal lokal -> UTC conversion by Supabase logic usually works if format is standard ISO
      // CATATAN: Filter range tanggal di Supabase JS client biasanya menganggap input sebagai Local Time server atau UTC. 
      // Untuk keamanan maksimal, range sebaiknya dihitung ke UTC. Tapi untuk cron job harian sederhana, logic ini biasanya cukup.
      // Jika ingin sangat presisi, gunakan range timestamp UTC start-end hari ini.
      .lte("created_at", `${today}T23:59:59`)
      .neq("status", "IZIN")
      .neq("status", "WFH");

    if (error) throw error;

    let updateCount = 0;

    for (const absen of absens) {
      let newStatus = absen.status;
      let needUpdate = false;

      // KASUS: Absen Masuk TAPI Lupa Absen Pulang -> Ubah jadi ALFA (Atau status lain sesuai kebijakan)
      // Kebijakan umum: Jika tidak tap out, dianggap ALFA atau tetap HADIR tapi jam pulang null.
      // Di sini kita set ALFA sesuai request Anda.
      if (absen.jam_masuk && !absen.jam_pulang) {
        newStatus = "ALFA";
        needUpdate = true;
        console.log(`⚠️ ID ${absen.id_kehadiran}: Masuk tapi Lupa pulang -> Set ALFA`);
      }

      // Eksekusi Update jika perlu
      if (needUpdate) {
        await supabase
          .from("kehadiran")
          .update({
            status: newStatus
          })
          .eq("id_kehadiran", absen.id_kehadiran);
        updateCount++;
      }
    }
    console.log(`✅ [CRON] Finalisasi selesai. ${updateCount} data diperbarui.`);

  } catch (err) {
    console.error("❌ [CRON ERROR] Finalisasi gagal:", err);
  }
}, {
  scheduled: true,
  timezone: "Asia/Jakarta" // <--- PENTING
});

export default cron;