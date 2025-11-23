// src/pages/UserSections/components/CardAbsenGPS.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

// Helper (Sudah Benar)
const toLocalDate = (utcString) => {
  const date = new Date(utcString);
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

export default function CardAbsenGPS() {
  const id_akun = localStorage.getItem("id_akun");
  const queryClient = useQueryClient();
  const today = new Date();

  // State Lokal (Sudah Benar)
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: "", long: "" });
  const [gpsReady, setGpsReady] = useState(false);
  const [statusArea, setStatusArea] = useState("...");
  const [belumJamKerja, setBelumJamKerja] = useState(false);

  // Ambil data Lokasi & Shift (Sudah Benar)
  const { data: lokasiData } = useQuery({
    queryKey: ["lokasiShift", id_akun],
    queryFn: async () =>
      (await axios.get(`/api/user/lokasi-shift/${id_akun}`)).data,
  });
  const lokasiKantor = lokasiData?.perusahaan;
  const jamShift = lokasiData?.shift;

  // Ambil data Kehadiran (Sudah Benar)
  const { data: kehadiranData } = useQuery({
    queryKey: ["kehadiran", id_akun, today.getMonth() + 1, today.getFullYear()],
    queryFn: async () => {
      const res = await axios.get(
        `/api/user/kehadiran/${id_akun}?bulan=${
          today.getMonth() + 1
        }&tahun=${today.getFullYear()}`
      );
      return res.data.data || [];
    },
  });
  const kehadiran = kehadiranData || [];

  // Logic GPS (Sudah Benar)
  const handleGetLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject("Browser Anda tidak mendukung GPS.");
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude.toFixed(6), long: longitude.toFixed(6) });
          setGpsReady(true);
          resolve({ latitude, longitude });
        },
        (err) => {
          if (err.code === 1) {
            return reject("Izin lokasi ditolak. Harap aktifkan di pengaturan browser Anda.");
          }
          return reject("Gagal mendapatkan lokasi: " + err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  // Init GPS (Sudah Benar)
  useEffect(() => {
    handleGetLocation().catch((err) => console.warn(err));
  }, []);

  // Cek Status Area (Sudah Benar)
  useEffect(() => {
    if (lokasiKantor && coords.lat && coords.long) {
      const dx = 111_000 * (coords.lat - lokasiKantor.latitude);
      const dy = 111_000 * (coords.long - lokasiKantor.longitude);
      const jarak = Math.sqrt(dx * dx + dy * dy);
      setStatusArea(
        jarak <= lokasiKantor.radius_m ? "Dalam Area" : "Luar Area"
      );
    }
  }, [lokasiKantor, coords]);

  // Cek Jam Kerja (Sudah Benar)
  useEffect(() => {
    if (!jamShift?.jam_masuk) return;
    const tick = () => {
      const now = new Date();
      const [h, m] = jamShift.jam_masuk.split(":");
      const jm = new Date();
      jm.setHours(parseInt(h), parseInt(m), 0, 0);
      setBelumJamKerja(now < jm);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [jamShift]);

  // ===================================================================
  // PERBAIKAN: Handler Absensi dengan Alert Spesifik
  // ===================================================================
  const handleAttendance = async (tipe) => {
    if (!id_akun) return;
    setLoading(true);

    let currentCoords;
    try {
      // 1. Selalu ambil lokasi terbaru saat tombol ditekan
      const { latitude, longitude } = await handleGetLocation();
      currentCoords = { lat: latitude, long: longitude };
    } catch (err) {
      // 2. Tampilkan error GPS yang spesifik
      Swal.fire(
        "⚠️ GPS Gagal",
        `Tidak dapat mengambil lokasi Anda. Pastikan GPS aktif dan Anda memberi izin. (${err})`,
        "warning"
      );
      setLoading(false);
      return;
    }

    // 3. Hitung status area saat ini juga (jangan bergantung pada state)
    let currentStatusArea = "Luar Area";
    if (lokasiKantor) {
      const dx = 111_000 * (currentCoords.lat - lokasiKantor.latitude);
      const dy = 111_000 * (currentCoords.long - lokasiKantor.longitude);
      const jarak = Math.sqrt(dx * dx + dy * dy);
      currentStatusArea =
        jarak <= lokasiKantor.radius_m ? "Dalam Area" : "Luar Area";
      setStatusArea(currentStatusArea); // Update UI
    }

    // 4. Validasi spesifik SEBELUM kirim ke API
    if (tipe === "MASUK" && currentStatusArea !== "Dalam Area") {
      Swal.fire(
        "❌ Di Luar Area",
        "Anda harus berada di dalam radius kantor untuk melakukan Absen MASUK.",
        "error"
      );
      setLoading(false);
      return;
    }

    // 5. Kirim data LENGKAP ke backend
    try {
      const payload = {
        id_akun: id_akun,
        tipe: tipe, // 'MASUK' atau 'KELUAR'
        latitude: currentCoords.lat,
        longitude: currentCoords.long,
        status_area: currentStatusArea,
      };

      const res = await axios.post("/api/user/absen", payload);
      Swal.fire("✅ Berhasil", res.data.message, "success");

      // 6. Refresh data yang relevan
      queryClient.invalidateQueries({
        queryKey: ["kehadiran", id_akun],
      });
      queryClient.invalidateQueries({
        queryKey: ["izinSummary", id_akun],
      });
    } catch (err) {
      // Ini HANYA akan error jika backend gagal (bukan karena data tidak lengkap)
      Swal.fire(
        "❌ Gagal Absen",
        err.response?.data?.message || "Terjadi error di server.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmKeluar = () => {
    Swal.fire({
      title: "Absen Pulang?",
      text: "Apakah Anda yakin ingin melakukan absen pulang sekarang?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Pulang",
      cancelButtonText: "Batal",
    }).then((r) => r.isConfirmed && handleAttendance("KELUAR"));
  };

  // Status Hari ini (Sudah Benar)
  const kehadiranHariIni = kehadiran.find((d) => {
    const created = toLocalDate(d.created_at);
    return created.toDateString() === today.toDateString();
  });
  const isIzinToday = ["IZIN", "WFH"].includes(kehadiranHariIni?.status);
  const sudahAbsenMasukToday =
    kehadiranHariIni?.jam_masuk !== null &&
    ["HADIR", "TERLAMBAT"].includes(kehadiranHariIni?.status);

  // JSX (Sudah Benar)
  return (
    <div className="bg-white rounded-xl border">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Absen GPS</h3>
        <span
          className={`text-xs font-medium ${
            gpsReady ? "text-green-600" : "text-red-500"
          }`}
        >
          {gpsReady ? "● Lokasi Terdeteksi" : "⚠️ Mencari Lokasi..."}
        </span>
      </div>
      <div className="p-4">
        {/* Tombol Masuk / Pulang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleAttendance("MASUK")}
            disabled={
              loading ||
              isIzinToday ||
              sudahAbsenMasukToday ||
              belumJamKerja
            }
            className={`h-12 rounded-lg text-white font-semibold transition ${
              loading || isIzinToday || sudahAbsenMasukToday || belumJamKerja
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {sudahAbsenMasukToday
              ? "Sudah Absen Masuk"
              : belumJamKerja
              ? "Belum Waktunya Masuk"
              : "Absen Masuk"}
            <span className="block text-[11px] font-normal">
              {jamShift?.jam_masuk ? `${jamShift.jam_masuk} WIB` : "..."}
            </span>
          </button>

          <button
            onClick={handleConfirmKeluar}
            disabled={loading || isIzinToday || !sudahAbsenMasukToday}
            className={`h-12 rounded-lg text-white font-semibold transition ${
              loading || isIzinToday || !sudahAbsenMasukToday
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            Absen Pulang
            <span className="block text-[11px] font-normal">
              {jamShift?.jam_pulang ? `${jamShift.jam_pulang} WIB` : "..."}
            </span>
          </button>
        </div>

        {/* Info lokasi kantor & koordinat */}
        <div className="mt-4 rounded-lg bg-gray-50 border p-3">
          <div className="text-[11px] text-gray-500">
            {lokasiKantor?.alamat || "Memuat lokasi..."}
          </div>
          <div className="text-[11px] text-gray-400">
            Radius {lokasiKantor?.radius_m || "-"}m · Status: {statusArea}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <input
              value={coords.lat}
              readOnly
              placeholder="LAT"
              className="h-9 rounded border px-2 text-sm bg-white"
            />
            <input
              value={coords.long}
              readOnly
              placeholder="LONG"
              className="h-9 rounded border px-2 text-sm bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}