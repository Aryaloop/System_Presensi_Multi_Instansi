// src/pages/UserSections/components/CardAbsenGPS.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

// Helper
const toLocalDate = (utcString) => {
  const date = new Date(utcString);
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

export default function CardAbsenGPS() {
  const queryClient = useQueryClient();
  const today = new Date();

  // State
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: "", long: "" });
  const [gpsReady, setGpsReady] = useState(false);
  const [statusArea, setStatusArea] = useState("Menunggu Lokasi...");
  const [belumJamKerja, setBelumJamKerja] = useState(false);

  // 1. Fetch Data Lokasi & Shift
  const { data: dataResponse, isLoading: loadingData } = useQuery({
    queryKey: ["lokasiShift"],
    queryFn: async () => {
      // Pastikan URL benar, jika local dev mungkin perlu full URL atau proxy setting
      const res = await axios.get(`/api/user/lokasi-shift`); 
      return res.data;
    },
    retry: 1, // Jangan retry terus menerus jika 404
  });

  const lokasiKantor = dataResponse?.perusahaan;
  const jamShift = dataResponse?.shift; // Bisa null jika user tidak punya shift

  // 2. Fetch Data Kehadiran
  const { data: kehadiranData } = useQuery({
    queryKey: ["kehadiran", today.getMonth() + 1, today.getFullYear()],
    queryFn: async () => {
      const res = await axios.get(
        `/api/user/kehadiran?bulan=${today.getMonth() + 1}&tahun=${today.getFullYear()}`
      );
      return res.data.data || [];
    },
  });
  const kehadiran = kehadiranData || [];

  // 3. Logic GPS (Promise based)
  const handleGetLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("Browser tidak dukung GPS.");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude.toFixed(6), long: longitude.toFixed(6) });
          setGpsReady(true);
          resolve({ latitude, longitude });
        },
        (err) => reject(err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  // Init GPS
  useEffect(() => {
    handleGetLocation().catch(() => {}); // Silent catch on init
  }, []);

  // 4. Cek Status Area (Realtime)
  useEffect(() => {
    if (lokasiKantor && coords.lat && coords.long) {
      const dx = 111000 * (coords.lat - lokasiKantor.latitude);
      const dy = 111000 * (coords.long - lokasiKantor.longitude);
      const jarak = Math.sqrt(dx * dx + dy * dy);
      
      setStatusArea(
        jarak <= lokasiKantor.radius_m 
          ? "✅ Dalam Area" 
          : `❌ Luar Area (${Math.floor(jarak)}m)`
      );
    }
  }, [lokasiKantor, coords]);

  // 5. Cek Jam Kerja (Logic diperbaiki untuk Shift Kosong)
  useEffect(() => {
    // Jika tidak ada shift atau tidak ada jam masuk, anggap boleh absen kapan saja
    if (!jamShift?.jam_masuk) {
      setBelumJamKerja(false); 
      return;
    }

    const tick = () => {
      const now = new Date();
      const [h, m] = jamShift.jam_masuk.split(":");
      const jm = new Date();
      jm.setHours(parseInt(h), parseInt(m), 0, 0);
      
      // Logika: Jika sekarang < jam masuk, maka belum jam kerja
      setBelumJamKerja(now < jm);
    };

    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [jamShift]);

  // Handler Absen
  const handleAttendance = async (tipe) => {
    setLoading(true);
    try {
      // Validasi 1: Lokasi Kantor harus ada
      if (!lokasiKantor) throw new Error("Data lokasi kantor belum dimuat.");

      // Validasi 2: Ambil GPS Terbaru
      const { latitude, longitude } = await handleGetLocation();
      
      // Validasi 3: Hitung Jarak
      const dx = 111000 * (latitude - lokasiKantor.latitude);
      const dy = 111000 * (longitude - lokasiKantor.longitude);
      const jarak = Math.sqrt(dx * dx + dy * dy);

      // Cek Radius
      if (jarak > lokasiKantor.radius_m) {
        throw new Error(`Anda berada di luar radius kantor (${Math.floor(jarak)}m).`);
      }

      // Kirim ke API
      const payload = {
        tipe,
        latitude,
        longitude,
      };

      const res = await axios.post("/api/user/absen", payload);
      Swal.fire("Berhasil", res.data.message, "success");
      
      // Refresh Data
      queryClient.invalidateQueries({ queryKey: ["kehadiran"] });
      
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Gagal Absen";
      Swal.fire("Gagal", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Status Hari Ini
  const kehadiranHariIni = kehadiran.find((d) => {
    const created = toLocalDate(d.created_at);
    return created.toDateString() === today.toDateString();
  });
  
  const sudahAbsenMasuk = kehadiranHariIni?.status && ["HADIR", "TERLAMBAT"].includes(kehadiranHariIni.status);
  const isIzin = ["IZIN", "WFH"].includes(kehadiranHariIni?.status);
  const jamMasukDisplay = jamShift?.jam_masuk ? `${jamShift.jam_masuk} WIB` : "(Non-Shift)";
  const jamPulangDisplay = jamShift?.jam_pulang ? `${jamShift.jam_pulang} WIB` : "(Non-Shift)";

  if (loadingData) return <div className="p-4 bg-white rounded border">⏳ Memuat data kantor...</div>;

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">📍 Absen GPS</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded ${gpsReady ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {gpsReady ? "GPS Aktif" : "Cari Lokasi..."}
        </span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tombol Masuk */}
          <button
            onClick={() => handleAttendance("MASUK")}
            disabled={loading || isIzin || sudahAbsenMasuk || belumJamKerja}
            className={`h-14 rounded-lg font-semibold text-white transition flex flex-col items-center justify-center 
              ${(loading || isIzin || sudahAbsenMasuk || belumJamKerja) ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"}`}
          >
            <span className="text-sm">
              {sudahAbsenMasuk ? "✅ Sudah Absen Masuk" : belumJamKerja ? "⏳ Belum Jam Masuk" : "Tekan untuk Absen Masuk"}
            </span>
            <span className="text-xs opacity-80 font-normal mt-0.5">
              Jadwal: {jamMasukDisplay}
            </span>
          </button>

          {/* Tombol Pulang */}
          <button
            onClick={() => {
                Swal.fire({
                    title: "Konfirmasi Pulang",
                    text: "Yakin ingin absen pulang?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonText: "Ya",
                }).then((r) => r.isConfirmed && handleAttendance("KELUAR"));
            }}
            disabled={loading || !sudahAbsenMasuk}
            className={`h-14 rounded-lg font-semibold text-white transition flex flex-col items-center justify-center
              ${(loading || !sudahAbsenMasuk) ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"}`}
          >
            <span className="text-sm">Absen Pulang</span>
            <span className="text-xs opacity-80 font-normal mt-0.5">
              Jadwal: {jamPulangDisplay}
            </span>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-5 bg-slate-50 border rounded-lg p-3 text-xs text-gray-600 space-y-2">
           <div className="flex justify-between border-b pb-2">
              <span>🏢 {lokasiKantor?.nama_perusahaan || "Kantor"}</span>
              <span className={statusArea.includes("Dalam") ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                {statusArea}
              </span>
           </div>
           <div>{lokasiKantor?.alamat || "Alamat belum disetting"}</div>
           <div className="flex gap-2">
              <input value={coords.lat} readOnly className="w-1/2 p-1 border rounded bg-white text-center" placeholder="Lat" />
              <input value={coords.long} readOnly className="w-1/2 p-1 border rounded bg-white text-center" placeholder="Long" />
           </div>
        </div>
      </div>
    </div>
  );
}