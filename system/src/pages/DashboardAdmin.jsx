import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, lazy, Suspense } from "react";
import Cookies from "js-cookie"; // ✅ Import js-cookie

// ... (Import Lazy Components tetap sama)
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
  const [page, setPage] = useState("dashboard");
  const [userRole, setUserRole] = useState(""); 

  useEffect(() => {
    // ✅ UPDATE: Ambil data dari Cookie
    const role = Cookies.get("role");          
    const jabatan = Cookies.get("id_jabatan"); 

    setUserRole(jabatan); 

    // Pengecekan keamanan level UI
    if (jabatan !== "ADMIN" && jabatan !== "SUBADMIN") {
      navigate("/login");
    }
  }, [navigate]);

  // ... (Sisa fungsi renderPage dan return JSX TETAP SAMA PERSIS)
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

  const menuItems = [
    { key: "dashboard", label: "🏠 Dashboard" },
    { key: "karyawan", label: "👥 Karyawan" },
    { key: "absen_karyawan", label: "📅 Absen" },
    { key: "jadwal", label: "🕒 Shift" },
    { key: "izin", label: "📝 Izin" },
    { key: "rekap", label: "🏅 Rekap" },
    { key: "perusahaan", label: "🏢 Perusahaan" },
  ];

  if (userRole === "ADMIN") {
    menuItems.push({ key: "create_subadmin", label: "➕ Sub Admin" });
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
        {menuItems.map((item) => (
          <button key={item.key} onClick={() => setPage(item.key)} className={`px-4 py-2 rounded-lg font-semibold transition ${page === item.key ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-indigo-100 text-gray-700"}`}>
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