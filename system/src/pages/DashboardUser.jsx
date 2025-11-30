// src/pages/DashboardUser.jsx
import React, { useState, lazy, Suspense, useEffect } from "react";
import "react-calendar/dist/Calendar.css";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

// Lazy Load Pages
const Dashboard = lazy(() => import("./UserSections/Dashboard"));
const Absen = lazy(() => import("./UserSections/Absen"));
const Izin = lazy(() => import("./UserSections/Izin"));
const Kalender = lazy(() => import("./UserSections/Kalender"));
const DataPresensi = lazy(() => import("./UserSections/DataPresensi"));
const Settings = lazy(() => import("./UserSections/Settings"));

export default function DashboardUser() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = searchParams.get("tab") || "dashboard";
  const [page, setPage] = useState(initialPage);
  const [user, setUser] = useState({ nama: "Memuat...", jabatan: "..." });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Definisi Menu (Tanpa Emot, Icon diload via function)
  const menuItems = [
    { key: "dashboard", label: "Dashboard", title: "Overview Dashboard" },
    { key: "absen", label: "Absen GPS", title: "Absen Masuk/Pulang" },
    { key: "izin", label: "Ajukan Izin", title: "Form Pengajuan Izin" },
    { key: "kalender", label: "Kalender", title: "Kalender Kehadiran" },
    { key: "data", label: "Data Presensi", title: "Riwayat Presensi" },
    { key: "pengaturan", label: "Pengaturan", title: "Pengaturan Akun" },
  ];

  // Helper untuk Icon SVG (Lebih profesional daripada emot)
  const getMenuIcon = (key, isActive) => {
    const className = `w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`;
    
    switch (key) {
      case "dashboard":
        return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
      case "absen":
        return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      case "izin":
        return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
      case "kalender":
        return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      case "data":
        return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      case "pengaturan":
        return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317l.86-1.49a1 1 0 011.73 0l.86 1.49a1 1 0 00.76.5l1.7.246a1 1 0 01.554 1.705l-1.23 1.2a1 1 0 00-.287.885l.29 1.69a1 1 0 01-1.451 1.054l-1.518-.798a1 1 0 00-.932 0l-1.518.798a1 1 0 01-1.45-1.054l.289-1.69a1 1 0 00-.287-.885l-1.23-1.2A1 1 0 015.525 5.06l1.7-.246a1 1 0 00.76-.497z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      default: return null;
    }
  };

  // Logic Fetch Profile
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

  useEffect(() => {
    const currentItem = menuItems.find((item) => item.key === page);
    const titleText = currentItem ? currentItem.title : "Dashboard";
    document.title = `User - ${titleText}`;
    setSearchParams({ tab: page });
  }, [page, setSearchParams]);

  const handleNavigation = (key) => {
    setPage(key);
    setIsSidebarOpen(false);
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
    <div className="min-h-screen bg-gray-50 flex relative overflow-hidden font-sans text-gray-800">

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed md:relative z-30 w-72 h-full bg-white border-r shadow-lg md:shadow-none flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        
        {/* Header Sidebar */}
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
               {/* Logo Icon Simple */}
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 tracking-tight">PresensiKu</p>
              <p className="text-[11px] font-medium text-indigo-500 uppercase tracking-wider">Employee Panel</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
          {menuItems.map((item) => {
            const isActive = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.key)}
                className={`group relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out 
                  ${isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-1" 
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
              >
                {/* Icon */}
                <span className={`flex items-center justify-center transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-600"}`}>
                  {getMenuIcon(item.key, isActive)}
                </span>
                
                {/* Label */}
                {item.label}

                {/* Active Indicator (Dot kanan) */}
                {isActive && (
                  <span className="absolute right-3 w-2 h-2 rounded-full bg-white/30" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Sidebar (User Profile & Logout) */}
        <div className="p-4 border-t bg-gray-50/50">
           <div className="bg-white border rounded-xl p-3 flex items-center justify-between shadow-sm mb-3">
              <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                    {user.nama.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-gray-800 truncate w-28">{user.nama}</p>
                    <p className="text-xs text-gray-500 truncate w-28">{user.jabatan}</p>
                  </div>
              </div>
           </div>

          <button
            onClick={async () => {
              try { await axios.post("/api/logout"); } catch (e) {}
              Cookies.remove("username"); Cookies.remove("role"); Cookies.remove("id_jabatan");
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h8a2 2 0 002-2V5a2 2 0 00-2-2H3" /></svg>
            Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-md border-b h-16 flex-none z-10 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800 leading-tight">
                    {menuItems.find(m => m.key === page)?.label || "Dashboard"}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Selamat bekerja, jaga kesehatan ya!
                </p>
              </div>
            </div>
            
            {/* Simple Date Display */}
            <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-700">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-pulse">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-sm">Memuat data...</p>
                </div>
            }>
              {renderPage()}
            </Suspense>
          </div>
        </main>
      </div>

    </div>
  );
}