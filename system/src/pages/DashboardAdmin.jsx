import { useNavigate, useSearchParams } from "react-router-dom"; // 1. Tambah useSearchParams
import React, { useState, useEffect, lazy, Suspense } from "react";
import Cookies from "js-cookie";

// ... (Import Lazy Components TETAP SAMA)
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
  const [searchParams, setSearchParams] = useSearchParams(); // 2. Init URL Params
  
  // 3. Ambil page dari URL kalau ada, kalau tidak default ke "dashboard"
  const initialPage = searchParams.get("tab") || "dashboard";
  const [page, setPage] = useState(initialPage);
  
  const [userRole, setUserRole] = useState(""); 

  // List Menu (Saya pindahkan ke atas agar bisa dibaca useEffect)
  const menuItems = [
    { key: "dashboard", label: "🏠 Dashboard", title: "Dashboard" },
    { key: "karyawan", label: "👥 Karyawan", title: "Kelola Karyawan" },
    { key: "absen_karyawan", label: "📅 Absen", title: "Data Absensi" },
    { key: "jadwal", label: "🕒 Shift", title: "Jadwal Shift" },
    { key: "izin", label: "📝 Izin", title: "Verifikasi Izin" },
    { key: "rekap", label: "🏅 Rekap", title: "Rekapitulasi" },
    { key: "perusahaan", label: "🏢 Perusahaan", title: "Profil Perusahaan" },
  ];

  // Logic Auth & Role
  useEffect(() => {
    const role = Cookies.get("role");          
    const jabatan = Cookies.get("id_jabatan"); 

    setUserRole(jabatan); 

    if (jabatan !== "ADMIN" && jabatan !== "SUBADMIN") {
      navigate("/login");
    }
    
    // Tambahkan menu subadmin jika role sesuai
    if (jabatan === "ADMIN" && !menuItems.find(m => m.key === "create_subadmin")) {
        // Logika render menu ada di bawah, ini hanya untuk memastikan role
    }
  }, [navigate]);

  // ============================================================
  // 🔥 FITUR BARU: Ubah Title Tab & URL Browser
  // ============================================================
  useEffect(() => {
    // 1. Cari item menu yang sedang aktif
    let currentItem = menuItems.find((item) => item.key === page);
    
    // Handle khusus menu Sub Admin yang dinamis
    if (!currentItem && page === "create_subadmin") {
        currentItem = { title: "Tambah Sub Admin" };
    }

    const titleText = currentItem ? currentItem.title : "Dashboard";

    // 2. Ubah Nama Tab Browser
    document.title = `Admin - ${titleText}`;

    // 3. Ubah URL tanpa reload (menjadi ...?tab=karyawan)
    setSearchParams({ tab: page });

  }, [page, setSearchParams]); // Jalankan setiap kali 'page' berubah


  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardHome />;
      case "karyawan": return <KaryawanManager />;
      case "absen_karyawan": return <AbsenKaryawan />;
      case "jadwal": return <JadwalShift />;
      case "izin": return <VerifikasiIzin />;
      case "rekap": return <RekapReward />;
      case "perusahaan": return <PerusahaanManager />;
      case "create_subadmin": return <CreateSubAdmin />;
      default: return <DashboardHome />;
    }
  };

  // Logic Menu Dinamis (agar 'const menuItems' di atas tetap bersih)
  const displayMenu = [...menuItems];
  if (userRole === "ADMIN") {
    displayMenu.push({ key: "create_subadmin", label: "➕ Sub Admin", title: "Sub Admin" });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-700 text-white p-4 flex justify-between">
        <h1 className="text-2xl font-bold">
            Dashboard {userRole === "SUBADMIN" ? "Sub Admin" : "Admin"}
        </h1>
        <button onClick={() => navigate("/login")} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition">
          Logout
        </button>
      </header>

      <nav className="bg-white shadow p-4 flex flex-wrap gap-3 justify-center">
        {displayMenu.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              page === item.key ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-indigo-100 text-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="p-6">
        <Suspense fallback={<p className="text-center text-gray-500 mt-10">⏳ Memuat halaman...</p>}>
          {renderPage()}
        </Suspense>
      </main>
    </div>
  );
}