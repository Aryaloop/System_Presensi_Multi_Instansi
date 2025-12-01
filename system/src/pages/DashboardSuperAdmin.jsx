// src/pages/DashboardSuperAdmin.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Swal from "sweetalert2";
import Cookies from "js-cookie";

// --- MODULAR IMPORTS (Lazy Load) ---
// Pastikan path ini sesuai dengan lokasi file komponen Anda
const DashboardHome = lazy(() => import("./SuperAdminSections/DashboardHome"));
const PerusahaanManager = lazy(() => import("./SuperAdminSections/PerusahaanManager"));
const AdminManager = lazy(() => import("./SuperAdminSections/AdminManager"));

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Logic Tab/Page (Sinkron dengan URL agar saat refresh tetap di tab yang sama)
  const initialPage = searchParams.get("tab") || "home";
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    setSearchParams({ tab: page });
  }, [page, setSearchParams]);

  // 2. Handler Logout (Sama persis dengan logic lama)
  const handleLogout = () => {
    Swal.fire({
      title: "Keluar dari sistem?",
      text: "Anda akan kembali ke halaman login.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, logout",
      confirmButtonColor: "#d33",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post("/api/logout");
          Cookies.remove("username");
          Cookies.remove("role");
          Cookies.remove("id_jabatan");
          navigate("/login");
          Swal.fire({ icon: "success", title: "Logout berhasil!", timer: 1500, showConfirmButton: false });
        } catch (error) {
          console.error("Gagal logout", error);
        }
      }
    });
  };

  // 3. Render Content (Switch Modular)
  const renderContent = () => {
    switch (page) {
      case "home":
        return <DashboardHome />;
      case "perusahaan":
        return <PerusahaanManager />;
      case "admin":
        return <AdminManager />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* ================= SIDEBAR (UI ORIGINAL) ================= */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col fixed h-full z-10">
        {/* Header Sidebar */}
        <div className="p-5 flex items-center gap-2 border-b">
          <div className="bg-indigo-600 text-white p-2 rounded-md">
            {/* Icon Settings Original */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317l.86-1.49a1 1 0 011.73 0l.86 1.49a1 1 0 00.76.5l1.7.246a1 1 0 01.554 1.705l-1.23 1.2a1 1 0 00-.287.885l.29 1.69a1 1 0 01-1.451 1.054l-1.518-.798a1 1 0 00-.932 0l-1.518.798a1 1 0 01-1.45-1.054l.289-1.69a1 1 0 00-.287-.885l-1.23-1.2A1 1 0 015.525 5.06l1.7-.246a1 1 0 00.76-.497z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-800">Super Admin</h2>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => setPage("home")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition ${
              page === "home" ? "bg-indigo-100 text-indigo-600 font-medium" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 4l9 6.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10.5z" />
            </svg>
            Dashboard
          </button>

          {/* Perusahaan */}
          <button
            onClick={() => setPage("perusahaan")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition ${
              page === "perusahaan" ? "bg-indigo-100 text-indigo-600 font-medium" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M4 7h16M4 11h16M8 3h8v18" />
            </svg>
            Perusahaan
          </button>

          {/* Kelola Admin */}
          <button
            onClick={() => setPage("admin")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition ${
              page === "admin" ? "bg-indigo-100 text-indigo-600 font-medium" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-7a4 4 0 110 8 4 4 0 010-8z" />
            </svg>
            Kelola Admin
          </button>
        </nav>

        {/* Footer Logout */}
        <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-3 text-sm text-red-600 hover:bg-red-50 border-t w-full text-left transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h8a2 2 0 002-2V5a2 2 0 00-2-2H3" />
          </svg>
          Logout
        </button>
      </aside>

      {/* ================= MAIN CONTENT (MODULAR) ================= */}
      <main className="flex-1 p-8 ml-64">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-gray-500">
            <span className="animate-pulse">Memuat data...</span>
          </div>
        }>
          {renderContent()}
        </Suspense>
      </main>

    </div>
  );
}