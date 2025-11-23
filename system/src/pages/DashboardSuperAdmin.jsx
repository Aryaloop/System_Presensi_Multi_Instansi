// src/pages/DashboardSuperAdmin.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

/* ---------- UI Helpers (pure presentational) ---------- */
const Badge = ({ children, tone = "gray" }) => {
  const map = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
};

const IconCircle = ({ tone = "indigo", children }) => {
  const map = {
    indigo: "bg-indigo-100 text-indigo-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${map[tone]}`}>
      {children}
    </span>
  );
};

// ---komponen StatCard ---
const StatCard = ({ title, value, icon, tone = "indigo", delta = { value: "+0%", tone: "gray", note: "dari bulan lalu" } }) => {
  const valueColor =
    tone === "green" ? "text-green-600" :
      tone === "blue" ? "text-blue-600" :
        tone === "red" ? "text-red-600" :
          "text-indigo-600";

  const deltaDot = {
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    gray: "bg-gray-400",
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
  }[delta.tone || "gray"];

  const deltaText = {
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    gray: "text-gray-500",
    blue: "text-blue-600",
    indigo: "text-indigo-600",
  }[delta.tone || "gray"];

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
        </div>
        {/* ikon di kanan dalam kotak lembut */}
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50">
          {icon}
        </span>
      </div>

      {/* Baris analytics */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className={`w-2 h-2 rounded-full ${deltaDot}`} />
        <span className={`font-semibold ${deltaText}`}>{delta.value}</span>
        <span className="text-gray-400">{delta.note || "dari bulan lalu"}</span>
      </div>
    </div>
  );
};


const IconButton = ({ tone = "indigo", title, onClick, children }) => {
  const map = {
    indigo: "text-indigo-600 hover:bg-indigo-50",
    blue: "text-blue-600 hover:bg-blue-50",
    red: "text-red-600 hover:bg-red-50",
    gray: "text-gray-600 hover:bg-gray-100",
    green: "text-green-600 hover:bg-green-50",
    yellow: "text-yellow-600 hover:bg-yellow-50",
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition ${map[tone]}`}
    >
      {children}
    </button>
  );
};

/* ---------- Komponen lama kamu (dipakai di HOME ringkasan cepat) ---------- */
function StatBox({ title, value, color }) {
  const colorClass = {
    indigo: "text-indigo-600",
    green: "text-green-600",
    blue: "text-blue-600",
  }[color] || "text-gray-600";

  return (
    <div className="bg-white p-6 shadow rounded-lg">
      <p className="text-gray-500">{title}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

/* =======================================================
   Dashboard Super Admin (Backend/handlers TETAP)
   ======================================================= */
export default function DashboardSuperAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- STATE & BACKEND: TIDAK DIUBAH ---
  const [page, setPage] = useState("home");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nama_perusahaan: "", alamat: "" });
  const [showFormAdmin, setShowFormAdmin] = useState(false);
  const [formAdmin, setFormAdmin] = useState({
    username: "",
    email: "",
    id_perusahaan: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [perusahaanPage, setPerusahaanPage] = useState(1);
  const perusahaanLimit = 10;

  const [adminPage, setAdminPage] = useState(1);
  const adminLimit = 10;

  const { data: perusahaanData, isLoading: loadingPerusahaan } = useQuery({
    queryKey: ["perusahaan", perusahaanPage],
    queryFn: async () =>
      (await axios.get(`/api/superadmin/perusahaan?page=${perusahaanPage}&limit=${perusahaanLimit}`)).data,
  });
  const perusahaan = perusahaanData?.data || [];
  const perusahaanTotal = perusahaanData?.total || 0;

  const { data: adminData, isLoading: loadingAdmins } = useQuery({
    queryKey: ["admins", adminPage],
    queryFn: async () =>
      (await axios.get(`/api/superadmin/admins?page=${adminPage}&limit=${adminLimit}`)).data,
  });
  const admins = adminData?.data || [];
  const adminTotal = adminData?.total || 0;

  // --- HANDLERS (TIDAK DIUBAH) ---
  const handleLogout = () => {
    Swal.fire({
      title: "Keluar dari sistem?",
      text: "Anda akan kembali ke halaman login.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, logout",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/login");
        Swal.fire({ icon: "success", title: "Logout berhasil!", timer: 1500, showConfirmButton: false });
      }
    });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddPerusahaan = async (payload) => {
    // e.preventDefault(); // Hapus baris ini
    try {
      await axios.post("/api/superadmin/perusahaan", payload); // Gunakan 'payload'
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["perusahaan"] });
      Swal.fire("Berhasil", "Perusahaan berhasil ditambahkan.", "success");
    } catch {
      Swal.fire("Gagal", "Tidak dapat menambahkan perusahaan.", "error");
    }
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditMode(true);
    setShowForm(true);
  };

  const handleUpdatePerusahaan = async (payload) => {
    // e.preventDefault(); // Hapus baris ini
    try {
      // Gunakan 'payload.id_perusahaan' dan 'payload'
      await axios.put(`/api/superadmin/perusahaan/${payload.id_perusahaan}`, payload);
      setShowForm(false);
      setEditMode(false);
      queryClient.invalidateQueries(["perusahaan"]);
      Swal.fire("Berhasil", "Perusahaan diperbarui.", "success");
    } catch {
      Swal.fire("Gagal", "Tidak dapat memperbarui perusahaan.", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Yakin ingin menghapus?",
      text: "Data perusahaan akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/superadmin/perusahaan/${id}`);
        queryClient.invalidateQueries(["perusahaan"]);
        Swal.fire("Terhapus!", "Perusahaan telah dihapus.", "success");
      } catch {
        Swal.fire("Gagal", "Tidak dapat menghapus perusahaan.", "error");
      }
    }
  };

  const handleSuspend = async (id, status) => {
    try {
      await axios.put(`/api/superadmin/suspend/${id}`, { status });
      queryClient.invalidateQueries(["perusahaan"]);
      Swal.fire("Berhasil", status ? "Perusahaan diaktifkan!" : "Perusahaan disuspend!", "success");
    } catch {
      Swal.fire("Gagal", "Tidak dapat mengubah status perusahaan.", "error");
    }
  };

  const handleChangeAdmin = (e) => setFormAdmin({ ...formAdmin, [e.target.name]: e.target.value });

  const handleEditAdmin = (admin) => {
    setFormAdmin(admin);
    setShowFormAdmin(true);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await axios.post("/api/superadmin/create-admin", formAdmin);
      Swal.fire("Berhasil", res.data.message || "Admin berhasil ditambahkan.", "success");
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setShowFormAdmin(false);
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal menambah admin.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEditAdmin = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.put(`/api/superadmin/admins/${formAdmin.id_akun}`, formAdmin);
      Swal.fire("Berhasil", "Admin diperbarui.", "success");
      setShowFormAdmin(false);
      setFormAdmin({ username: "", email: "", id_perusahaan: "" });
      queryClient.invalidateQueries(["admins"]);
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal memperbarui admin.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAdmin = async (id_akun) => {
    const result = await Swal.fire({
      title: "Yakin ingin menghapus admin ini?",
      text: "Data admin akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/superadmin/admins/${id_akun}`);
        queryClient.invalidateQueries(["admins"]);
        Swal.fire("Berhasil", "Admin dihapus!", "success");
      } catch {
        Swal.fire("Gagal", "Tidak dapat menghapus admin.", "error");
      }
    }
  };

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col">
        <div className="p-5 flex items-center gap-2 border-b">
          <div className="bg-indigo-600 text-white p-2 rounded-md">
            {/* settings icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317l.86-1.49a1 1 0 011.73 0l.86 1.49a1 1 0 00.76.5l1.7.246a1 1 0 01.554 1.705l-1.23 1.2a1 1 0 00-.287.885l.29 1.69a1 1 0 01-1.451 1.054l-1.518-.798a1 1 0 00-.932 0l-1.518.798a1 1 0 01-1.45-1.054l.289-1.69a1 1 0 00-.287-.885l-1.23-1.2A1 1 0 015.525 5.06l1.7-.246a1 1 0 00.76-.497z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-800">Super Admin</h2>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: "home", label: "Dashboard", icon: "home" },
            { id: "perusahaan", label: "Perusahaan", icon: "building" },
            { id: "admin", label: "Kelola Admin", icon: "users" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setPage(m.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition ${page === m.id ? "bg-indigo-100 text-indigo-600 font-medium" : "hover:bg-gray-100 text-gray-700"
                }`}
            >
              {m.icon === "home" && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 4l9 6.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10.5z" />
                </svg>
              )}
              {m.icon === "building" && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M4 7h16M4 11h16M8 3h8v18" />
                </svg>
              )}
              {m.icon === "users" && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-7a4 4 0 110 8 4 4 0 010-8z" />
                </svg>
              )}
              {m.label}
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-3 text-sm text-red-600 hover:bg-red-50 border-t">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h8a2 2 0 002-2V5a2 2 0 00-2-2H3" />
          </svg>
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8">
        {/* ================= HOME ================= */}
        {page === "home" && (
          <section>
            <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Total Perusahaan */}
              <StatCard
                title="Total Perusahaan"
                value={perusahaanTotal || perusahaan.length}
                tone="indigo"
                icon={
                  <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 21h18V3H3v18Zm4-4h4v4H7v-4Zm6 0h4v4h-4v-4ZM7 7h4v4H7V7Zm6 0h4v4h-4V7Z" />
                  </svg>
                }
                delta={{ value: "+12%", tone: "green", note: "dari bulan lalu" }}
              />

              {/* Total Admin */}
              <StatCard
                title="Total Admin"
                value={adminTotal || admins.length}
                tone="green"
                icon={
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-4 5c-3.866 0-7 1.79-7 4v2h14v-2c0-2.21-3.134-4-7-4Z" />
                  </svg>
                }
                delta={{ value: "+8%", tone: "green", note: "dari bulan lalu" }}
              />

              {/* Total User (gunakan field jika backend menyediakannya; fallback 0) */}
              <StatCard
                title="Total User"
                value={perusahaanData?.total_user ?? 0}
                tone="blue"
                icon={
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-4 5c-4.5 0-8 2.24-8 5v1h16v-1c0-2.76-3.5-5-8-5Z" />
                  </svg>
                }
                delta={{ value: "+15%", tone: "green", note: "dari bulan lalu" }}
              />
            </div>

            {/* === Tambahkan blok ini di BAWAH kartu === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
              {/* Aktivitas Terbaru */}
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <h3 className="font-semibold mb-3">Aktivitas Terbaru</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 inline-flex items-center justify-center">
                      {/* plus icon */}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11 4h2v16h-2zM4 11h16v2H4z" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-gray-800 font-medium">Perusahaan baru ditambahkan</div>
                      <div className="text-gray-500 text-xs">PT. Teknologi Maju • 2 jam yang lalu</div>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-md bg-green-50 text-green-600 inline-flex items-center justify-center">
                      {/* user icon */}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-4 5c-3.866 0-7 1.79-7 4v2h14v-2c0-2.21-3.134-4-7-4Z" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-gray-800 font-medium">Admin baru terdaftar</div>
                      <div className="text-gray-500 text-xs">Ahmad Rizki • 4 jam yang lalu</div>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Status Sistem */}
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <h3 className="font-semibold mb-3">Status Sistem</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Server Status</span>
                    <span className="flex items-center gap-2 text-green-600 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Database</span>
                    <span className="flex items-center gap-2 text-green-600 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> Connected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}


        {/* ================= PERUSAHAAN =================  */}
        {page === "perusahaan" && (
          <section>
            {/* Header */}
            <h1 className="text-2xl font-semibold mb-4">Perusahaan</h1>

            {/* Ringkasan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Perusahaan"
                value={perusahaanTotal || perusahaan.length}
                tone="indigo"
                icon={
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 21h18V3H3v18Zm4-4h4v4H7v-4Zm6 0h4v4h-4v-4ZM7 7h4v4H7V7Zm6 0h4v4h-4V7Z" />
                    </svg>
                  </span>
                }
              />
              <StatCard
                title="Aktif"
                value={(perusahaan || []).filter((p) => p.status_aktif === true).length}
                tone="green"
                icon={
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 text-green-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </span>
                }
              />
              <StatCard
                title="Suspend"
                value={(perusahaan || []).filter((p) => p.status_aktif === false).length}
                tone="red"
                icon={
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h12v12H6z" />
                    </svg>
                  </span>
                }
              />
              <StatCard
                title="Pending"
                value={(perusahaan || []).filter((p) => p.status_aktif == null).length}
                tone="yellow"
                icon={
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-50 text-yellow-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8v5l4 2" />
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </span>
                }
              />
            </div>

            {/* Search di atas card */}
            <div className="flex items-center mb-3">
              <div className="relative w-full sm:w-64 ml-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.5-1.5-5-5z" />
                  </svg>
                </span>
                <input
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="Cari perusahaan..."
                />
              </div>
            </div>

            {/* === CARD: judul + tombol + tabel === */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {/* Header card */}
              <div className="px-4 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-sm">
                  <h2 className="font-semibold">Daftar Perusahaan</h2>
                  <p className="text-gray-500">Kelola semua perusahaan yang terdaftar</p>
                </div>

                <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
                  {/* Export */}
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                    title="Export"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 20h14v-2H5v2zM12 3l-5 5h3v6h4V8h3l-5-5z" />
                    </svg>
                    <span>Export</span>
                  </button>

                  {/* Tambah */}
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setForm({
                        id_perusahaan: null,
                        nama_perusahaan: "",
                        email: "",
                        alamat: "",
                        status: "Aktif",
                        status_aktif: true,
                      });
                      setShowForm(true);
                    }}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Perusahaan
                  </button>
                </div>
              </div>

              {/* Tabel */}
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="text-left px-4 py-2">ID</th>
                    <th className="text-left px-4 py-2">Nama Perusahaan</th>
                    <th className="text-left px-4 py-2">Alamat</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-center px-4 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPerusahaan ? (
                    <tr><td colSpan="5" className="py-6 text-center">Memuat data perusahaan...</td></tr>
                  ) : (
                    (perusahaan || [])
                      .filter((p) => p.id_perusahaan !== "PRE010")
                      .map((p) => {
                        const label = p.status_aktif === true ? "Aktif" : p.status_aktif === false ? "Suspend" : "Pending";
                        const pill =
                          label === "Aktif" ? "bg-green-100 text-green-700" :
                            label === "Suspend" ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700";
                        const dot =
                          label === "Aktif" ? "bg-green-500" :
                            label === "Suspend" ? "bg-red-500" :
                              "bg-yellow-500";
                        return (
                          <tr key={p.id_perusahaan} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">#{p.id_perusahaan}</td>

                            <td className="px-4 py-2">
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 21h18V3H3v18Zm4-4h4v4H7v-4Zm6 0h4v4h-4v-4ZM7 7h4v4H7V7Zm6 0h4v4h-4V7Z" />
                                  </svg>
                                </span>
                                <div>
                                  <div className="font-medium">{p.nama_perusahaan}</div>
                                  {p.email && <div className="text-xs text-gray-500">{p.email}</div>}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-2">{p.alamat}</td>

                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${pill}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                                {label}
                              </span>
                            </td>

                            <td className="px-4 py-2 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                {/* Edit langsung buka popup dan prefilling */}
                                <button
                                  title="Edit"
                                  onClick={() => {
                                    const statusLabel = p.status_aktif === true ? "Aktif" : p.status_aktif === false ? "Suspend" : "Pending";
                                    setEditMode(true);
                                    setForm({
                                      id_perusahaan: p.id_perusahaan,
                                      nama_perusahaan: p.nama_perusahaan || "",
                                      email: p.email || "",
                                      alamat: p.alamat || "",
                                      status: statusLabel,
                                      status_aktif: p.status_aktif ?? null,
                                    });
                                    setShowForm(true);
                                  }}
                                  className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                  </svg>
                                </button>

                                {/* Suspend/Aktifkan */}
                                {p.status_aktif ? (
                                  <button
                                    title="Suspend"
                                    onClick={() => handleSuspend(p.id_perusahaan, false)}
                                    className="p-1.5 rounded text-yellow-600 hover:bg-yellow-50"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                                    </svg>
                                  </button>
                                ) : (
                                  <button
                                    title="Aktifkan"
                                    onClick={() => handleSuspend(p.id_perusahaan, true)}
                                    className="p-1.5 rounded text-green-600 hover:bg-green-50"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </button>
                                )}

                                {/* Hapus */}
                                <button
                                  title="Hapus"
                                  onClick={() => handleDelete(p.id_perusahaan)}
                                  className="p-1.5 rounded text-red-600 hover:bg-red-50"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>

              {/* Pagination kanan bawah */}
              <div className="px-4 py-4 flex justify-end">
                {(() => {
                  const totalItems = perusahaanTotal || (perusahaan?.length ?? 0);
                  const perPage = perusahaanLimit || 10;
                  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
                  const cur = perusahaanPage || 1;
                  const go = (n) => setPerusahaanPage(Math.min(Math.max(1, n), totalPages));
                  const pages = [1, 2, 3].filter((n) => n <= totalPages);
                  if (totalPages > 4) pages.push("ellipsis");
                  if (totalPages > 3) pages.push(totalPages);

                  return (
                    <div className="flex items-center gap-2">
                      <button disabled={cur === 1} onClick={() => go(cur - 1)} className="px-3 py-1.5 text-sm rounded border bg-white disabled:opacity-50">
                        &lt; Previous
                      </button>
                      {pages.map((p, i) =>
                        p === "ellipsis" ? (
                          <span key={`e-${i}`} className="px-2 text-gray-500">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => go(p)}
                            className={p === cur ? "px-3 py-1.5 text-sm rounded bg-indigo-600 text-white" : "px-3 py-1.5 text-sm rounded border bg-white"}
                          >
                            {p}
                          </button>
                        )
                      )}
                      <button disabled={cur === totalPages} onClick={() => go(cur + 1)} className="px-3 py-1.5 text-sm rounded border bg-white disabled:opacity-50">
                        Next &gt;
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* === POPUP Tambah/Edit (versi gabung) === */}
            {showForm && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{editMode ? "Edit Perusahaan" : "Tambah Perusahaan"}</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>

                  {/* Body */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const status_aktif = form.status === "Aktif" ? true : form.status === "Suspend" ? false : null;
                      const payload = { ...form, status_aktif };
                      editMode ? handleUpdatePerusahaan(payload) : handleAddPerusahaan(payload);
                    }}
                    className="px-5 py-4 space-y-3"
                  >
                    {/* Nama */}
                    <div>
                      <label className="block text-sm mb-1">Nama Perusahaan</label>
                      <input
                        name="nama_perusahaan"
                        value={form.nama_perusahaan}
                        onChange={(e) => setForm((f) => ({ ...f, nama_perusahaan: e.target.value }))}
                        placeholder="PT. Teknologi Maju"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    {/* Alamat */}
                    <div>
                      <label className="block text-sm mb-1">Alamat</label>
                      <textarea
                        name="alamat"
                        rows={3}
                        value={form.alamat}
                        onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                        placeholder="Jl. Sudirman No. 123, Jakarta"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Status (native select biar simple, tetap mirip mockup) */}
                    <div>
                      <label className="block text-sm mb-1">Status</label>
                      <div className="relative">
                        <select
                          value={form.status || "Aktif"}
                          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                          className="appearance-none w-full border rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Suspend">Suspend</option>
                          <option value="Pending">Pending</option>
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border bg-gray-50">
                        Batal
                      </button>
                      <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                        {editMode ? "Simpan Perubahan" : "Simpan"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}




        {/* ================= ADMIN ================= */}
        {page === "admin" && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-semibold">Kelola Admin</h1>
              <div className="flex items-center gap-3">
                <div className="relative hidden sm:block w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.5-1.5-5-5z" />
                    </svg>
                  </span>
                  <input className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Cari admin..." />
                </div>
                <button
                  onClick={() => setShowFormAdmin(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Admin
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="text-sm text-gray-600 font-medium">Daftar Administrator</div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {/* dropdown palsu (visual) */}
                    <select className="appearance-none border rounded-lg pl-3 pr-8 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500">
                      <option>Semua Status</option>
                      <option>Aktif</option>
                      <option>Suspend</option>
                      <option>Pending</option>
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                  </div>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="text-left px-4 py-2">Nama</th>
                    <th className="text-left px-4 py-2">Email</th>
                    <th className="text-left px-4 py-2">Perusahaan</th>      {/* nama_perusahaan */}
                    <th className="text-left px-4 py-2">ID Perusahaan</th>  {/* ganti dari Status */}
                    <th className="text-center px-4 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAdmins ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center">Memuat data admin...</td>
                    </tr>
                  ) : (
                    (admins || []).map((a) => (
                      <tr key={a.id_akun} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="font-medium">{a.username}</div>
                          <div className="text-xs text-gray-500">{a.role || "Admin"}</div>
                        </td>

                        <td className="px-4 py-2">{a.email}</td>

                        {/* Perusahaan = nama_perusahaan */}
                        <td className="px-4 py-2">
                          {a.perusahaan?.nama_perusahaan || "-"}
                        </td>


                        {/* ID Perusahaan (menggantikan kolom Status) */}
                        <td className="px-4 py-2 font-mono">{a.id_perusahaan || "-"}</td>

                        <td className="px-4 py-2 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <IconButton tone="indigo" title="Edit" onClick={() => handleEditAdmin(a)}>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                              </svg>
                            </IconButton>
                            <IconButton tone="red" title="Hapus" onClick={() => handleDeleteAdmin(a.id_akun)}>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" />
                              </svg>
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>


              {/* Pagination */}
              <div className="flex justify-center items-center p-4 gap-2">
                <button
                  disabled={adminPage === 1}
                  onClick={() => setAdminPage(adminPage - 1)}
                  className="px-3 py-1.5 text-sm rounded border bg-white disabled:opacity-50"
                >
                  &lt; Prev
                </button>
                <span className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white">{adminPage}</span>
                <button
                  disabled={admins.length < adminLimit}
                  onClick={() => setAdminPage(adminPage + 1)}
                  className="px-3 py-1.5 text-sm rounded border bg-white disabled:opacity-50"
                >
                  Next &gt;
                </button>
              </div>
            </div>

            {/* Modal Tambah/Edit Admin */}
            {showFormAdmin && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{formAdmin.id_akun ? "Edit Admin" : "Tambah Admin"}</h3>
                    <button
                      onClick={() => {
                        setShowFormAdmin(false);
                        setFormAdmin({ username: "", email: "", id_perusahaan: "" });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={formAdmin.id_akun ? handleSaveEditAdmin : handleAddAdmin} className="space-y-3">
                    <input
                      name="username"
                      value={formAdmin.username}
                      onChange={handleChangeAdmin}
                      placeholder="Nama Admin"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      value={formAdmin.email}
                      onChange={handleChangeAdmin}
                      placeholder="Email Admin"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <input
                      name="id_perusahaan"
                      value={formAdmin.id_perusahaan}
                      onChange={handleChangeAdmin}
                      placeholder="ID Perusahaan"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowFormAdmin(false)} className="px-4 py-2 rounded-lg border">
                        Batal
                      </button>
                      <button type="submit" disabled={isSaving} className={`px-4 py-2 rounded-lg text-white ${isSaving ? "bg-indigo-300" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                        {isSaving ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
