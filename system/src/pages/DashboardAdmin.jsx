import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";

// Lazy imports for other admin pages (keep as-is)
const DashboardHome = lazy(() => import("./AdminSections/DashboardHome"));
const KaryawanManager = lazy(() => import("./AdminSections/KaryawanManager"));
const AbsenKaryawan = lazy(() => import("./AdminSections/AbsenKaryawan"));
const JadwalShift = lazy(() => import("./AdminSections/JadwalShift"));
const VerifikasiIzin = lazy(() => import("./AdminSections/VerifikasiIzin"));
const RekapReward = lazy(() => import("./AdminSections/RekapReward"));
const PerusahaanManager = lazy(() => import("./AdminSections/PerusahaanManager"));
const CreateSubAdmin = lazy(() => import("./AdminSections/CreateSubAdmin"));

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = searchParams.get("tab") || "dashboard";
  const [page, setPage] = useState(initialPage);
  const [userRole, setUserRole] = useState("");

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: "🏠", title: "Dashboard" },
    { key: "karyawan", label: "Karyawan", icon: "👥", title: "Kelola Karyawan" },
    { key: "absen_karyawan", label: "Absen", icon: "📅", title: "Data Absensi" },
    { key: "jadwal", label: "Shift", icon: "🕒", title: "Jadwal Shift" },
    { key: "izin", label: "Izin", icon: "📝", title: "Verifikasi Izin" },
    { key: "rekap", label: "Rekap", icon: "🏅", title: "Rekapitulasi" },
    { key: "perusahaan", label: "Perusahaan", icon: "🏢", title: "Profil Perusahaan" },
  ];

  useEffect(() => {
    const role = Cookies.get("role");
    const jabatan = Cookies.get("id_jabatan");
    setUserRole(jabatan || role || "");

    if (jabatan !== "ADMIN" && jabatan !== "SUBADMIN") {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let currentItem = menuItems.find((item) => item.key === page);
    if (!currentItem && page === "create_subadmin") currentItem = { title: "Tambah Sub Admin" };
    document.title = `Admin - ${currentItem ? currentItem.title : "Dashboard"}`;
    setSearchParams({ tab: page });
  }, [page, setSearchParams]);

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <div>
            {/* Top greeting */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Selamat Datang Kembali,</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Utama <span className="ml-2">👋</span></h2>
                <p className="text-sm text-gray-500 mt-1">Berikut adalah ringkasan sistem presensi hari ini, <span className="font-medium">Senin, 1 Desember 2025</span></p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <input type="text" placeholder="Cari karyawan..." className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                <button className="p-2 rounded-full bg-white shadow"><span role="img" aria-label="notif">🔔</span></button>
                <button className="p-2 rounded-full bg-white shadow"><span role="img" aria-label="settings">⚙️</span></button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Karyawan</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">247</p>
                    <p className="text-sm text-green-500 mt-2">↑ 12% dari bulan lalu</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <span role="img" aria-label="users" className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Presensi Hari Ini</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">189</p>
                    <p className="text-sm text-gray-500 mt-2">76.5% kehadiran</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <span role="img" aria-label="check" className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Izin WFH Aktif</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">23</p>
                    <p className="text-sm text-gray-500 mt-2">9.3% dari total karyawan</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <span role="img" aria-label="home" className="text-2xl">🏠</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder for charts or additional content */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-md min-h-[180px]">{/* Left chart area */}
                <p className="text-gray-500">Grafik Kehadiran (placeholder)</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md min-h-[180px]">{/* Right list area */}
                <p className="text-gray-500">Aktivitas Terbaru (placeholder)</p>
              </div>
            </div>
          </div>
        );
      case "karyawan":
        return <KaryawanManager />;
      case "absen_karyawan":
        return <AbsenKaryawan />;
      case "jadwal":
        return <JadwalShift />;
      case "izin":
        return <VerifikasiIzin />;
      case "rekap":
        return <RekapReward />;
      case "perusahaan":
        return <PerusahaanManager />;
      case "create_subadmin":
        return <CreateSubAdmin />;
      default:
        return <DashboardHome />;
    }
  };

  const displayMenu = [...menuItems];
  if (userRole === "ADMIN") {
    displayMenu.push({ key: "create_subadmin", label: "Sub Admin", icon: "➕" });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 sticky top-0 h-screen flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded flex items-center justify-center font-bold">P</div>
          <div>
            <div className="font-bold">KitaPresensi</div>
            <div className="text-xs text-gray-400">Sistem Presensi</div>
          </div>
        </div>

        <nav className="p-4 flex-1 overflow-auto">
          {displayMenu.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                page === item.key ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-indigo-50"
              }`}
            >
              <span className="w-6">{item.icon || "•"}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => navigate('/login')} className="w-full text-left px-4 py-3 rounded-lg bg-red-50 text-red-600 font-semibold">Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-8">
        <Suspense fallback={<p className="text-center text-gray-500 mt-10">⏳ Memuat halaman...</p>}>
          {renderPage()}
        </Suspense>
      </div>
    </div>
  );
}
