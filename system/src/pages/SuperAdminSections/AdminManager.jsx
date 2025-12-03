import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Swal from "sweetalert2";

// Komponen Kecil Tombol Aksi (Biar tidak error import)
const ActionButton = ({ onClick, color, icon, title }) => {
  const colors = {
    indigo: "text-indigo-600 hover:bg-indigo-50",
    red: "text-red-600 hover:bg-red-50",
  };
  return (
    <button onClick={onClick} title={title} className={`p-2 rounded transition ${colors[color]}`}>
      {icon}
    </button>
  );
};

export default function AdminManager() {
  // State Page & Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1); // Tambahkan state page

  // State Form
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    id_perusahaan: ""
  });

  // 1. Fetch Daftar Admin
  const limit = 15;
  const { data: fetchResult, isLoading: loadingAdmin } = useQuery({
    queryKey: ["adminList", page, debouncedSearch],
    queryFn: async () => {
      const res = await axios.get(`/api/superadmin/admins?page=${page}&limit=${limit}&search=${debouncedSearch}`);
      return res.data;
    },
    keepPreviousData: true
  });

  const adminList = fetchResult?.data || [];
  const totalItems = fetchResult?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    setTimeout(() => { setDebouncedSearch(e.target.value); }, 500);
  };

  // 2. Handler Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handler Submit (Create)
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/superadmin/create-admin", formData);
      Swal.fire("Berhasil", "Akun Admin baru berhasil dibuat", "success");
      setShowModal(false);
      setFormData({ username: "", email: "", id_perusahaan: "" });
      queryClient.invalidateQueries(["adminList"]);
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan", "error");
    }
  };

  // 4. Handler Delete
  const handleDeleteAdmin = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Admin?",
      text: "Data tidak bisa dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/superadmin/admins/${id}`);
        Swal.fire("Terhapus", "Admin berhasil dihapus", "success");
        queryClient.invalidateQueries(["adminList"]);
      } catch (err) {
        Swal.fire("Gagal", "Gagal menghapus admin", "error");
      }
    }
  };

  return (
    <section className="animate-fadeIn space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Kelola Admin</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Cari Username / Email / UUID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition shadow-sm whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Admin
          </button>
        </div>
      </div>

      {/* Tabel Card */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Username</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Perusahaan</th>
                <th className="px-6 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingAdmin ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Memuat data...</td></tr>
              ) : adminList.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Data tidak ditemukan.</td></tr>
              ) : (
                adminList.map((admin) => (
                  <tr key={admin.id_akun} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {admin.username}
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate w-24" title={admin.id_akun}>
                        {admin.id_akun}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                    <td className="px-6 py-4">
                      {admin.perusahaan?.nama_perusahaan || <span className="text-gray-400 italic">Tidak ada data</span>}
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{admin.id_perusahaan}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ActionButton
                          color="red"
                          title="Hapus"
                          onClick={() => handleDeleteAdmin(admin.id_akun)}
                          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        <div className="px-5 py-4 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Hal {page} dari {totalPages || 1} <span className="hidden sm:inline"> | Total {totalItems} Admin</span>
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 hover:bg-gray-100 transition"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 hover:bg-gray-100 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Tambah Admin Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input required name="username" value={formData.username} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="email@contoh.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Perusahaan (Manual)</label>
                <input required name="id_perusahaan" value={formData.id_perusahaan} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="Masukkan ID Perusahaan" />
                <p className="text-xs text-gray-500 mt-1">*Copy ID dari menu 'Perusahaan'</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
