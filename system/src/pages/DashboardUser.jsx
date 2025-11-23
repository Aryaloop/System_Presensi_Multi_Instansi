// src/pages/DashboardUser.jsx
import React, { useState, lazy, Suspense, useEffect } from "react";
import "react-calendar/dist/Calendar.css";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// 1. Impor SEMUA halaman
const Dashboard = lazy(() => import("./UserSections/Dashboard"));
const Absen = lazy(() => import("./UserSections/Absen"));
const Izin = lazy(() => import("./UserSections/Izin"));
const Kalender = lazy(() => import("./UserSections/Kalender"));
const DataPresensi = lazy(() => import("./UserSections/DataPresensi"));
const Settings = lazy(() => import("./UserSections/Settings"));

export default function DashboardUser() {
  const [page, setPage] = useState("dashboard");
  const [user, setUser] = useState({ nama: "Memuat...", jabatan: "..." });
  const idAkun = localStorage.getItem("id_akun");

  // Logic fetching untuk Topbar (Sudah Benar)
  const { data: userData } = useQuery({
    queryKey: ["userProfile", idAkun],
    queryFn: async () => {
      const res = await axios.get(`/api/user/${idAkun}`);
      return res.data.data || res.data;
    },
    staleTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    if (userData) {
      setUser({
        nama: userData.username || userData.nama || "User",
        jabatan: userData.jabatan || "Karyawan",
      });
    }
  }, [userData]);

  // Render page yang sesuai (Sudah Benar)
  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard setPage={setPage} />;
      case "absen":
        return <Absen />;
      case "izin":
        return <Izin />;
      case "kalender":
        return <Kalender />;
      case "data":
        return <DataPresensi />;
      case "pengaturan":
        return <Settings user={user} />;
      default:
        return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* ========================================================== */}
        {/* BAGIAN SIDEBAR LENGKAP (TERMASUK TOMBOL LOGOUT) */}
        {/* ========================================================== */}
        <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r">
          <div className="px-4 py-4 flex items-center gap-2 border-b">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              📅
            </div>
            <div>
              <p className="text-sm font-semibold">PresensiKu</p>
              <p className="text-xs text-gray-500 -mt-1">Dashboard</p>
            </div>
          </div>
          <nav className="p-3 space-y-1 flex-1">
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-indigo-50 transition ${page === item.key
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700"
                  }`}
              >
                {/* Ganti ikon • dengan ikon yang lebih relevan jika mau */}
                <span className="inline-block w-5 text-center">
                  {item.key === "dashboard" && "🏠"}
                  {item.key === "absen" && "📍"}
                  {item.key === "izin" && "📝"}
                  {item.key === "kalender" && "🗓️"}
                  {item.key === "data" && "📊"}
                  {item.key === "pengaturan" && "⚙️"}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* === TOMBOL LOGOUT SEKARANG ADA DI SINI === */}
          <div className="p-3 border-t">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
            >
              <span className="inline-block w-5 text-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 21h8a2 2 0 002-2V5a2 2 0 00-2-2H3"
                  />
                </svg>
              </span>
              Logout
            </button>
          </div>
        </aside>

        {/* =============================== CONTENT =============================== */}
        <div className="flex-1">
          {/* Topbar (Sudah Benar) */}
          <header className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">Dashboard Presensi</h1>
                <p className="text-xs text-gray-500">
                  Kelola kehadiran dan aktivitas kerja Anda
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{user.nama}</div>
                <div className="text-xs text-gray-500">{user.jabatan}</div>
              </div>
            </div>
          </header>

          {/* Main Content + Suspense (Sudah Benar) */}
          <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            <Suspense
              fallback={
                <p className="text-center text-gray-500">⏳ Memuat halaman...</p>
              }
            >
              {renderPage()}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}