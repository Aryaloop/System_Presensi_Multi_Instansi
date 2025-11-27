import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Sesuaikan path ini dengan struktur folder projectmu yang sebenarnya
dotenv.config({ path: path.resolve("../../../.env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Helper: Dapatkan nama kolom hari di DB berdasarkan hari ini
function getTodayColumnName() {
  const days = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
  const todayIndex = new Date().getDay(); // 0 = Minggu, 1 = Senin, dst.
  const dayName = days[todayIndex];
  return `is_${dayName}`; // Output: "is_senin", "is_selasa", dll.
}

// ==============================================================================
// LOGIKA UTAMA: INISIALISASI ABSEN HARIAN
// (Diexport agar bisa dipanggil manual saat server start)
// ==============================================================================
export const initDailyAttendance = async () => {
  console.log("🚀 [INIT] Memulai pengecekan jadwal kerja hari ini...");

  try {
    const todayColumn = getTodayColumnName(); // Misal: "is_selasa"
    console.log(`📅 Hari ini cek kolom: ${todayColumn}`);

    // 1. Ambil karyawan yang punya shift
    const { data: karyawans, error } = await supabase
      .from("akun")
      .select(`
        id_akun, 
        id_perusahaan, 
        id_shift, 
        shift:shift!akun_id_shift_fkey (id_shift, ${todayColumn}) 
      `)
      .neq("id_jabatan", "ADMIN")
      .neq("id_jabatan", "SPRADM")
      .not("id_shift", "is", null);

    if (error) throw error;

    const insertPayload = [];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD (UTC base)

    // 2. Filter Karyawan: Apakah hari ini dia kerja?
    for (const k of karyawans) {
      // Cek apakah hari ini jadwal kerja (true)
      if (k.shift && k.shift[todayColumn] === true) {

        // --- CEK DUPLICATE (PENTING AGAR TIDAK DOUBLE SAAT RESTART) ---
        const { data: existing } = await supabase
          .from("kehadiran")
          .select("id_kehadiran")
          .eq("id_akun", k.id_akun)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`)
          .maybeSingle();

        // HANYA Insert jika data belum ada
        if (!existing) {
          insertPayload.push({
            id_akun: k.id_akun,
            id_perusahaan: k.id_perusahaan,
            id_shift: k.id_shift,
            status: "ALFA", // Default awal
            jam_masuk: null,
            jam_pulang: null,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // 3. Eksekusi Insert Massal
    if (insertPayload.length > 0) {
      // Tambahkan .select() di akhir untuk melihat balikan data
      const { data, error } = await supabase
        .from("kehadiran")
        .insert(insertPayload)
        .select();

      if (error) {
        console.error("🔥 ERROR INSERT:", error); // Ini akan memunculkan error RLS
      } else {
        console.log(`✅ [INIT] Berhasil insert. Data:`, data);
      }
    }

  } catch (err) {
    console.error("❌ [INIT ERROR]", err);
  }
};

// ==============================================================================
// JOB 1: JADWAL OTOMATIS (Setiap Pagi 00:05)
// ==============================================================================
cron.schedule("5 0 * * *", async () => {
  console.log("⏰ [CRON] Menjalankan jadwal otomatis pagi...");
  await initDailyAttendance();
});

// ==============================================================================
// JOB 2: FINALISASI ABSEN (Setiap Malam 23:55)
// ==============================================================================
cron.schedule("55 23 * * *", async () => {
  console.log("⏰ [CRON] Mulai finalisasi status akhir hari...");

  try {
    const today = new Date().toISOString().split('T')[0];

    // Ambil data kehadiran hari ini yang statusnya bukan IZIN/CUTI/WFH
    const { data: absens, error } = await supabase
      .from("kehadiran")
      .select("id_kehadiran, status, jam_masuk, jam_pulang")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .neq("status", "IZIN")
      .neq("status", "WFH");

    if (error) throw error;

    for (const absen of absens) {
      let newStatus = absen.status;
      let needUpdate = false;

      // KASUS: Absen Masuk TAPI Lupa Absen Pulang -> Ubah jadi ALFA
      if (absen.jam_masuk && !absen.jam_pulang) {
        newStatus = "ALFA";
        needUpdate = true;
        console.log(`⚠️ ID ${absen.id_kehadiran}: Lupa pulang -> Set ALFA`);
      }

      // Eksekusi Update jika perlu
      if (needUpdate) {
        await supabase
          .from("kehadiran")
          .update({
            status: newStatus
          })
          .eq("id_kehadiran", absen.id_kehadiran);
      }
    }
    console.log("✅ [CRON] Finalisasi data harian selesai.");

  } catch (err) {
    console.error("❌ [CRON ERROR] Finalisasi gagal:", err);
  }
});

export default cron;