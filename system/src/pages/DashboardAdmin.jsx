// src/pages/DashboardAdmin.jsx
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, lazy, Suspense } from "react";

const DashboardHome = lazy(() => import("./AdminSections/DashboardHome"));
const KaryawanManager = lazy(() => import("./AdminSections/KaryawanManager"));
const AbsenKaryawan = lazy(() => import("./AdminSections/AbsenKaryawan"));
const JadwalShift = lazy(() => import("./AdminSections/JadwalShift"));
const VerifikasiIzin = lazy(() => import("./AdminSections/VerifikasiIzin"));
const RekapReward = lazy(() => import("./AdminSections/RekapReward"));
const PerusahaanManager = lazy(() => import("./AdminSections/PerusahaanManager"));

export default function DashboardAdmin() {
  const navigate = useNavigate(); //dideklarasikan sebelum dipakai di useEffect
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const timer = setTimeout(() => {
      const role = localStorage.getItem("role");
      const jabatan = localStorage.getItem("id_jabatan");
      if (role !== "ADMIN" && jabatan !== "ADMIN") navigate("/login");
    }, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardHome />;
      case "karyawan": return <KaryawanManager />;           // ❌ no props
      case "absen_karyawan": return <AbsenKaryawan />;       // ❌ no props
      case "jadwal": return <JadwalShift />;                 // ❌ no props
      case "izin": return <VerifikasiIzin />;                // ❌ no props
      case "rekap": return <RekapReward />;
      case "perusahaan": return <PerusahaanManager />;       // ❌ no props
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-700 text-white p-4 flex justify-between">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <button
          onClick={() => navigate("/login")}
          className="bg-red-500 px-3 py-1 rounded"
        >
          Logout
        </button>
      </header>

      <nav className="bg-white shadow p-4 flex flex-wrap gap-3 justify-center">
        {[
          { key: "dashboard", label: "🏠 Dashboard" },
          { key: "karyawan", label: "👥 Karyawan" },
          { key: "absen_karyawan", label: "📅 Absen" },
          { key: "jadwal", label: "🕒 Shift" },
          { key: "izin", label: "📝 Izin" },
          { key: "rekap", label: "🏅 Rekap" },
          { key: "perusahaan", label: "🏢 Perusahaan" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              page === item.key ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-indigo-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="p-6">
        <Suspense fallback={<p className="text-center text-gray-500">⏳ Memuat halaman...</p>}>
          {renderPage()}
        </Suspense>
      </main>
    </div>
  );
}
