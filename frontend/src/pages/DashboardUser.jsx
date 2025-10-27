// src/pages/DashboardUser.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Swal from "sweetalert2";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function DashboardUser() {
  const idAkun = typeof window !== "undefined" ? localStorage.getItem("id_akun") : null;

  // Caching 
  const id_akun = localStorage.getItem("id_akun");
  const queryClient = useQueryClient();
  const { data: userData, isLoading, isError } = useQuery({
    queryKey: ["user", id_akun],
    queryFn: async () => {
      const res = await axios.get(`/api/user/${id_akun}`); // ✅ langsung /api
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // cache 5 menit
    keepPreviousData: true,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat",
        text: err.message,
        toast: true,
        timer: 2000,
        position: "top-end",
        showConfirmButton: false,
      });
    },
  });

  // ---------- dinamis basic information ----------
  const [lokasiKantor, setLokasiKantor] = useState(null);
  const [jamShift, setJamShift] = useState(null);
  const [statusArea, setStatusArea] = useState("...");

  // --------- NAV / LAYOUT ----------
  const [page, setPage] = useState("dashboard"); // dashboard | absen | izin | kalender | data | pengaturan

  // --------- DATA USER (profil dari DB) ----------
  const [user, setUser] = useState({ nama: "-", email: "", jabatan: "Karyawan" });

  // --------- ABSENSI ----------
  const [attendanceStatus, setAttendanceStatus] = useState("belum"); // sudah/belum
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: "", long: "" });

  const [gpsReady, setGpsReady] = useState(false);
  // --------- KALENDER KEHADIRAN ----------
  const [kehadiran, setKehadiran] = useState([]);

  // --------- FORM IZIN ----------
  const [jenis_izin, setJenisIzin] = useState("");
  const [tanggal_mulai, setTanggalMulai] = useState("");
  const [tanggal_selesai, setTanggalSelesai] = useState("");
  const [alasan, setAlasan] = useState("");
  const [keterangan, setKeterangan] = useState("");



  // SweetAlert helper (toast)
  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  // ======= LOAD USER =======
  const fetchUser = async () => {
    try {
      const res = await axios.get(`/api/user/${idAkun}`);
      const u = res.data?.data || res.data;
      setUser({
        nama: u?.nama || u?.username || u?.full_name || "-",
        email: u?.email || "",
        jabatan: u?.jabatan || u?.role || "Karyawan",
      });
    } catch (e) {
      toast.fire({ icon: "error", title: "Gagal memuat profil" });
    }
  };

  // ======= GPS =======
  const handleGetLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject("Browser tidak mendukung GPS");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude.toFixed(6), long: longitude.toFixed(6) });
          setGpsReady(true);
          resolve({ latitude, longitude });
        },
        (err) => reject("Gagal mendapatkan lokasi: " + err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  // ======= ABSEN =======
  const handleAttendance = async (tipe) => {
    if (!id_akun) {
      Swal.fire("⚠️ Gagal", "ID Akun tidak ditemukan, silakan login ulang.", "error");
      return;
    }

    // Tambahan agar GPS diambil dulu
    try {
      await handleGetLocation();
    } catch (err) {
      Swal.fire("⚠️ Gagal", err, "warning");
      return;
    }

    if (!coords.lat || !coords.long) {
      Swal.fire("⚠️ Gagal", "Koordinat GPS tidak tersedia.", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/user/absen", {
        id_akun,
        latitude: parseFloat(coords.lat),
        longitude: parseFloat(coords.long),
        tipe,
      });
      Swal.fire("✅ Berhasil", res.data.message, "success");
    } catch (err) {
      console.error(err);
      Swal.fire(
        "❌ Gagal Absen",
        err.response?.data?.message || "Terjadi kesalahan server.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // 
  useEffect(() => {
    if (!idAkun) return;
    axios.get(`/api/user/${idAkun}`).then(async (res) => {
      const user = res.data;
      setUser(user);
      const lokasi = await axios.get(`/api/user/lokasi-shift/${idAkun}`);
      setLokasiKantor(lokasi.data.perusahaan);
      setJamShift(lokasi.data.shift);
    });
  }, [idAkun]);

  // Hitung jarak lokasi kantor - lokasi absen
  useEffect(() => {
    if (lokasiKantor && coords.lat && coords.long) {
      const dx = 111_000 * (coords.lat - lokasiKantor.latitude);
      const dy = 111_000 * (coords.long - lokasiKantor.longitude);
      const jarak = Math.sqrt(dx * dx + dy * dy);
      setStatusArea(jarak <= lokasiKantor.radius_m ? "Dalam Area" : "Luar Area");
    }
  }, [lokasiKantor, coords]);

  // Konfirmasi Absen Keluar
  const handleConfirmKeluar = () => {
    Swal.fire({
      title: "Konfirmasi Absen Pulang",
      html: `
      <p class="text-sm text-gray-600 mb-1">
        Pastikan kamu benar-benar sudah menyelesaikan pekerjaan hari ini.
      </p>
      <p class="text-xs text-gray-500">
        Setelah dikonfirmasi, data <b>jam pulang</b> akan disimpan di sistem dan tidak bisa diubah.
      </p>
    `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, saya sudah selesai",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626", // merah khas tombol keluar
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        handleAttendance("KELUAR"); // kirim request ke backend
      } else {
        Swal.fire({
          title: "Dibatalkan",
          text: "Absen pulang dibatalkan, kamu masih dianggap bekerja.",
          icon: "info",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  };



  // ======= KALENDER =======
  const fetchKehadiran = async (bulan, tahun) => {
    try {
      const res = await axios.get(`/api/user/kehadiran/${idAkun}?bulan=${bulan}&tahun=${tahun}`);
      if (res.data.success) {
        setKehadiran(res.data.data || []);
        const today = new Date();
        const sudah = (res.data.data || []).some(
          (d) => new Date(d.created_at).toDateString() === today.toDateString()
        );
        setAttendanceStatus(sudah ? "sudah" : "belum");
      }
    } catch {
      toast.fire({ icon: "error", title: "Gagal memuat kalender" });
    }
  };


  // ==== INIT ====
  useEffect(() => {
    if (!idAkun) return;
    fetchUser();
    handleGetLocation(); // <==== Tambahkan baris ini agar GPS diambil otomatis
    const today = new Date();
    const bulan = today.getMonth() + 1;
    const tahun = today.getFullYear();
    fetchKehadiran(bulan, tahun);

    // Cek sudah absen hari ini
    (async () => {
      try {
        const res = await axios.get(
          `/api/user/kehadiran/${idAkun}?bulan=${bulan}&tahun=${tahun}`
        );
        const sudah = (res.data.data || []).some(
          (d) => new Date(d.created_at).toDateString() === today.toDateString()
        );
        if (sudah) setAttendanceStatus("sudah");
      } catch { }
    })();
  }, [idAkun]);

  useEffect(() => {
    const savedCoords = localStorage.getItem("coords");
    if (savedCoords) {
      setCoords(JSON.parse(savedCoords));
      setGpsReady(true);
    } else {
      handleGetLocation().then((pos) => {
        localStorage.setItem("coords", JSON.stringify(pos));
      });
    }
  }, []);


  // Ringkasan
  const totalHadir = kehadiran.filter((k) => k.status === "HADIR").length;
  const totalWFH = kehadiran.filter((k) => k.status === "WFH").length;

  // ======= UI SUB-KOMPONEN =======
  const StatCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500">Hari Ini</p>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">
            {attendanceStatus === "sudah" ? "Hadir" : "Belum Hadir"}
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-md ${attendanceStatus === "sudah"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {attendanceStatus === "sudah" ? "✔" : "✕"}
          </span>
        </div>
        <p className="text-[11px] text-emerald-600 mt-1">
          {jamShift
            ? `${jamShift.jam_masuk} - ${jamShift.jam_pulang}`
            : "Memuat jam..."}
        </p>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500">Bulan Ini</p>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">{totalHadir} Hari</div>
          <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">📅</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">Total Kehadiran</p>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500">Izin Pending</p>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">2</div>
          <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700">⏳</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">Menunggu Approval</p>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500">WFH Bulan Ini</p>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">{totalWFH} Hari</div>
          <span className="text-xs px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">🏠</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">Work From Home</p>
      </div>
    </div>
  );

  const CardAbsenGPS = () => (
    <div className="bg-white rounded-xl border">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Absen GPS</h3>
        <span className={`text-xs ${gpsReady ? "text-green-600" : "text-red-500"}`}>
          {gpsReady ? "● Lokasi Terdeteksi" : "⚠️ GPS belum aktif"}
        </span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleAttendance("MASUK")}
            disabled={loading}
            className="h-12 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
          >
            Absen Masuk
            <span className="block text-[11px] font-normal">
              {jamShift?.jam_masuk ? `${jamShift.jam_masuk} WIB` : "Memuat..."}
            </span>
          </button>
          <button
            onClick={() => handleConfirmKeluar()} // ganti fungsi trigger-nya
            disabled={loading || attendanceStatus !== "sudah"} // hanya aktif jika sudah absen masuk
            className={`h-12 rounded-lg text-white font-semibold transition ${loading || attendanceStatus !== "sudah"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
              }`}
          >
            Absen Pulang
            <span className="block text-[11px] font-normal">
              {jamShift?.jam_pulang ? `${jamShift.jam_pulang} WIB` : "Memuat..."}
            </span>
          </button>

        </div>

        <div className="mt-4 rounded-lg bg-gray-50 border p-3">
          <div className="text-[11px] text-gray-500">
            {lokasiKantor?.alamat || "Memuat lokasi..."}
          </div>
          <div className="text-[11px] text-gray-400">
            Radius {lokasiKantor?.radius_m || "-"}m · Status: {statusArea}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">
            {jamShift ? `${jamShift.jam_masuk} - ${jamShift.jam_pulang}` : "Memuat jam..."}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <input
              value={coords.lat}
              readOnly
              placeholder="LAT"
              className="h-9 rounded border px-2 text-sm"
            />
            <input
              value={coords.long}
              readOnly
              placeholder="LONG"
              className="h-9 rounded border px-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const CardAjukanIzin = () => (
    <div className="bg-white rounded-xl border">
      <div className="p-4 border-b font-semibold">Ajukan Izin / WFH</div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {["Izin Sakit", "Cuti", "Dinas Luar", "Work From Home"].map((t, i) => (
          <div
            key={i}
            className="rounded-xl border-2 border-dashed text-center p-6 text-gray-500 hover:border-indigo-300 cursor-pointer"
            onClick={() => setPage("izin")}
          >
            <div className="text-3xl mb-2">🏷️</div>
            <div className="text-sm font-medium">{t}</div>
            <div className="text-xs text-gray-400 mt-1">Ajukan sekarang</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ===== Kalender dengan background status + highlight hari ini =====
  const WidgetKalender = () => {
    const todayStr = new Date().toDateString();

    // helper: ambil status utk sebuah tanggal
    const getStatusForDate = (date) => {
      const rec = kehadiran.find(
        (d) => new Date(d.created_at).toDateString() === date.toDateString()
      );
      return rec?.status || null; // "HADIR" | "WFH" | "IZIN" | "TERLAMBAT" | "ALFA" | null
    };

    // peta warna background
    const bgByStatus = {
      HADIR: "bg-emerald-100",
      WFH: "bg-purple-100",
      IZIN: "bg-yellow-100",
      TERLAMBAT: "bg-orange-100",
      ALFA: "bg-red-100",
    };

    return (
      <div className="bg-white rounded-xl border p-4">
        <div className="font-semibold mb-2">Kalender Kehadiran</div>

        <Calendar

          nextLabel={null}
          prevLabel={null}
          next2Label={null}
          prev2Label={null}
          // load ulang saat pindah bulan
          onActiveStartDateChange={(e) => {
            const bulanBaru = e.activeStartDate.getMonth() + 1;
            const tahunBaru = e.activeStartDate.getFullYear();
            fetchKehadiran(bulanBaru, tahunBaru);
          }}
          // jadikan setiap tile relative agar bisa diberi layer background absolut
          tileClassName={() => "relative rounded-lg !m-1 overflow-hidden"}
          // sisipkan layer background sesuai status (atau highlight hari ini)
          tileContent={({ date, view }) => {
            if (view !== "month") return null;

            const status = getStatusForDate(date);
            const isToday = date.toDateString() === todayStr;

            if (status) {
              return (
                <div
                  className={`absolute inset-0 ${bgByStatus[status]} opacity-90 pointer-events-none`}
                />
              );
            }

            if (isToday) {
              return (
                <div className="absolute inset-0 bg-blue-500/80 pointer-events-none" />
              );
            }

            return null;
          }}
        />

        {/* Legend seperti di gambar */}
        {/* Legend diratakan ke tengah */}
        <div className="w-full flex justify-center">
          <div className="flex flex-wrap gap-3 mt-3 text-xs justify-center text-center">
            {[
              ["Hadir", "bg-emerald-200"],
              ["WFH", "bg-purple-200"],
              ["Izin", "bg-yellow-200"],
              ["Terlambat", "bg-orange-200"],
              ["Hari Ini", "bg-blue-500 text-white"],
            ].map(([label, cls]) => (
              <span key={label} className="inline-flex items-center gap-1">
                <span className={`w-3 h-3 rounded ${cls}`}></span>
                {label}
              </span>
            ))}
          </div>
        </div>

      </div>
    );
  };


  const WidgetAktivitas = () => (
    <div className="bg-white rounded-xl border p-4">
      <div className="font-semibold mb-2">Aktivitas Terbaru</div>
      <ul className="space-y-3 text-sm">
        {[
          { t: "Absen Masuk", s: "08:00 WIB", c: "text-emerald-600" },
          { t: "Izin WFH Disetujui", s: "Kemarin, 14:32 WIB", c: "text-blue-600" },
          { t: "Pengajuan Cuti", s: "2 hari lalu, 10:15 WIB", c: "text-gray-600" },
        ].map((i, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span
              className={`mt-1 inline-flex w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-500" : "bg-gray-300"
                }`}
            />
            <div>
              <div className={`font-medium ${i.c}`}>{i.t}</div>
              <div className="text-xs text-gray-500">{i.s}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  // ====== RENDER ======
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r">
          <div className="px-4 py-4 flex items-center gap-2 border-b">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              📅
            </div>
            <div>
              <p className="text-sm font-semibold">PresensiKu</p>
              <p className="text-xs text-gray-500 -mt-1">Dashboard</p>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "absen", label: "Absen GPS" },
              { key: "izin", label: "Ajukan Izin" },
              { key: "kalender", label: "Kalender" },
              { key: "data", label: "Data Presensi" },
              { key: "pengaturan", label: "Pengaturan" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-indigo-50 transition ${page === item.key ? "bg-indigo-600 text-white" : "text-gray-700"
                  }`}
              >
                <span className="inline-block w-5 text-center">•</span>
                {item.label}
              </button>
            ))}

            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="w-full mt-8 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
            >
              <span className="inline-block w-5 text-center">⏻</span>
              Logout
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {/* Topbar */}
          <header className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">Dashboard Presensi</h1>
                <p className="text-xs text-gray-500">
                  Kelola kehadiran dan aktivitas kerja Anda
                </p>
              </div>
              {/* Hanya nama dari DB (tanpa foto) */}
              <div className="text-right">
                <div className="text-sm font-medium">{user.nama}</div>
                <div className="text-xs text-gray-500">{user.jabatan || "Karyawan"}</div>
              </div>
            </div>
          </header>

          {/* Main */}
          <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            {/* DASHBOARD */}
            {page === "dashboard" && (
              <>
                <StatCards />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    <CardAbsenGPS />
                    <CardAjukanIzin />
                  </div>
                  <div className="space-y-6">
                    <WidgetKalender />
                    <WidgetAktivitas />
                  </div>
                </div>
              </>
            )}

            {/* ABSEN GPS */}
            {page === "absen" && (
              <div className="space-y-6">
                <StatCards />
                <CardAbsenGPS />
              </div>
            )}

            {/* AJUKAN IZIN */}
            {page === "izin" && (
              <div className="bg-white rounded-xl border p-5 max-w-2xl">
                <h2 className="text-base font-semibold mb-4">📝 Ajukan Izin / WFH</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      setLoading(true);
                      const res = await axios.post(
                        "/api/user/izin",
                        {
                          id_akun: idAkun,
                          tanggal_mulai,
                          tanggal_selesai,
                          jenis_izin,
                          alasan,
                          keterangan,
                        }
                      );
                      Swal.fire({
                        icon: "success",
                        title: res.data.message || "Pengajuan terkirim",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                      setJenisIzin("");
                      setTanggalMulai("");
                      setTanggalSelesai("");
                      setAlasan("");
                      setKeterangan("");
                    } catch (err) {
                      Swal.fire({
                        icon: "error",
                        title: "Gagal",
                        text: err.response?.data?.message || "Gagal mengirim izin.",
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">Jenis Izin</label>
                    <select
                      value={jenis_izin}
                      onChange={(e) => setJenisIzin(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="">-- Pilih Jenis Izin --</option>
                      <option value="IZIN">Izin</option>
                      <option value="WFH">Work From Home</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={tanggal_mulai}
                        onChange={(e) => setTanggalMulai(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        value={tanggal_selesai}
                        onChange={(e) => setTanggalSelesai(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Alasan</label>
                    <input
                      type="text"
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      placeholder="Contoh: Sakit, acara keluarga, dsb"
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Keterangan Tambahan</label>
                    <textarea
                      rows="3"
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? "⏳ Mengirim..." : "Kirim Pengajuan"}
                  </button>
                </form>
              </div>
            )}

            {/* KALENDER PENUH */}
            {page === "kalender" && (
              <div className="space-y-6">
                <StatCards />
                <WidgetKalender />
              </div>
            )}

            {/* DATA PRESENSI (placeholder) */}
            {page === "data" && (
              <div className="bg-white rounded-xl border p-4">
                <div className="font-semibold mb-4">Data Presensi</div>
                <div className="text-sm text-gray-500">
                  Tabel data presensi bisa ditaruh di sini (hubungkan ke endpoint listing presensi).
                </div>
              </div>
            )}

            {/* PENGATURAN / PROFIL */}
            {page === "pengaturan" && (
              <div className="bg-white rounded-xl border p-4 max-w-xl">
                <div className="font-semibold mb-4">Profil</div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <div className="w-32 text-gray-500">Nama</div>
                    <div className="font-medium">{user.nama}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-gray-500">Email</div>
                    <div>{user.email || "-"}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 text-gray-500">Jabatan</div>
                    <div>{user.jabatan || "Karyawan"}</div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
