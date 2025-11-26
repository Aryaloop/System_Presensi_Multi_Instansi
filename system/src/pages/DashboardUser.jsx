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
  
  // 🟢 STATE BARU: Untuk toggle sidebar di mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Logic fetching untuk Topbar
  const { data: userData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await axios.get(`/api/user/profile`);
      return res.data.data || res.data;
    },
    staleTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    if (userData) {
      setUser({
        nama: userData.username || userData.nama || "User",
        jabatan: userData.jabatan?.nama_jabatan || userData.jabatan || "Karyawan",
      });
    }
  }, [userData]);

  // Fungsi navigasi (tutup sidebar otomatis jika di mobile)
  const handleNavigation = (key) => {
    setPage(key);
    setIsSidebarOpen(false); // Tutup sidebar setelah klik menu (UX mobile)
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard setPage={handleNavigation} />;
      case "absen": return <Absen />;
      case "izin": return <Izin />;
      case "kalender": return <Kalender />;
      case "data": return <DataPresensi />;
      case "pengaturan": return <Settings user={user} />;
      default: return <Dashboard setPage={handleNavigation} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex relative overflow-hidden">
      
      {/* 🟢 1. MOBILE OVERLAY (Background Gelap saat sidebar buka) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ========================================================== */}
      {/* BAGIAN SIDEBAR (RESPONSIVE) */}
      {/* ========================================================== */}
      <aside 
        className={`fixed md:relative z-30 w-64 h-full bg-white border-r flex flex-col transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header Sidebar */}
        <div className="px-4 py-4 flex items-center justify-between border-b h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              📅
            </div>
            <div>
              <p className="text-sm font-semibold">PresensiKu</p>
              <p className="text-xs text-gray-500 -mt-1">Dashboard</p>
            </div>
          </div>
          {/* Tombol Close (Hanya di Mobile) */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:bg-gray-100 p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
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
              onClick={() => handleNavigation(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${page === item.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-indigo-50"
                }`}
            >
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

        {/* Tombol Logout */}
        <div className="p-3 border-t bg-gray-50/50">
          <button
            onClick={() => {
              document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-100"
          >
            <span className="inline-block w-5 text-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h8a2 2 0 002-2V5a2 2 0 00-2-2H3" />
              </svg>
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* =============================== CONTENT =============================== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b h-16 flex-none z-10">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
            
            {/* 🟢 2. TOMBOL HAMBURGER (Kiri - Hanya Mobile) */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-lg font-semibold leading-tight">Dashboard</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Kelola kehadiran & aktivitas
                </p>
              </div>
            </div>

            {/* Profil User (Kanan) */}
            <div className="text-right">
              <div className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                {user.nama}
              </div>
              <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">
                {user.jabatan}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content + Scroll Area */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<div className="flex justify-center py-10 text-gray-500">⏳ Memuat halaman...</div>}>
              {renderPage()}
            </Suspense>
          </div>
        </main>
      </div>

    </div>
  );
}