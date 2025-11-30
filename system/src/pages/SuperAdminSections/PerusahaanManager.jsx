import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Swal from "sweetalert2";
import { StatCard, Badge, IconButton } from "./SuperAdminUI";

export default function PerusahaanManager() {
  const queryClient = useQueryClient();

  // State Halaman & Search
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ id_perusahaan: "", nama_perusahaan: "", alamat: "", status: "Aktif", status_aktif: true });

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 500);
  };

  // 1. Fetch Data
  const limit = 15;
  const { data: fetchResult, isLoading } = useQuery({
    queryKey: ["perusahaanList", page, debouncedSearch],
    queryFn: async () => {
      const res = await axios.get(`/api/superadmin/perusahaan?page=${page}&limit=${limit}&search=${debouncedSearch}`);
      return res.data;
    },
    keepPreviousData: true
  });

  // PERBAIKAN: Definisikan variable 'perusahaan' DULUAN
  const rawData = fetchResult?.data || [];
  const perusahaan = rawData.filter(p => p.id_perusahaan !== "PRE010");
  const totalItems = fetchResult?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);


  // BARU hitung statistik (setelah variable perusahaan ada)
  // Note: Karena ada pagination, statistik ini hanya menghitung data yang TAMPIL di halaman ini saja.
  // Jika ingin statistik global, Backend perlu mengirim data ringkasan terpisah.
  const total = perusahaan.length;
  const aktif = perusahaan.filter(p => p.status_aktif === true).length;
  const suspend = perusahaan.filter(p => p.status_aktif === false).length;
  const pending = perusahaan.filter(p => p.status_aktif === null || p.status_aktif === undefined).length;

  // --- Logic Handler (Save, Delete, Toggle) ---
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const status_aktif = formData.status === "Aktif" ? true : formData.status === "Suspend" ? false : null;
      const payload = { ...formData, status_aktif };

      if (!editMode) {
        await axios.post("/api/superadmin/perusahaan", payload);
        Swal.fire("Berhasil", "Perusahaan ditambahkan", "success");
      } else {
        await axios.put(`/api/superadmin/perusahaan/${formData.id_perusahaan}`, payload);
        Swal.fire("Berhasil", "Data diperbarui", "success");
      }
      setShowForm(false);
      queryClient.invalidateQueries(["perusahaanList"]);
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan", "error");
    }
  };
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`/api/superadmin/suspend/${id}`, { status: !currentStatus });
      queryClient.invalidateQueries(["perusahaanList"]);
      Swal.fire("Sukses", `Perusahaan berhasil ${!currentStatus ? "diaktifkan" : "disuspend"}`, "success");
    } catch (err) {
      Swal.fire("Gagal", "Gagal update status", "error");
    }
  };
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Perusahaan?", text: "Data tidak bisa dikembalikan!", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Ya, Hapus",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/superadmin/perusahaan/${id}`);
        Swal.fire("Terhapus", "Data berhasil dihapus", "success");
        queryClient.invalidateQueries(["perusahaanList"]);
      } catch (err) {
        Swal.fire("Gagal", err.response?.data?.message || "Gagal menghapus", "error");
      }
    }
  };

  const openCreate = () => {
    setFormData({ id_perusahaan: "", nama_perusahaan: "", alamat: "", status: "Aktif", status_aktif: true });
    setEditMode(false);
    setShowForm(true);
  };

  const openEdit = (item) => {
    const statusLabel = item.status_aktif === true ? "Aktif" : item.status_aktif === false ? "Suspend" : "Pending";
    setFormData({
      id_perusahaan: item.id_perusahaan,
      nama_perusahaan: item.nama_perusahaan,
      alamat: item.alamat,
      status: statusLabel,
      status_aktif: item.status_aktif
    });
    setEditMode(true);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Perusahaan</h1>


      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={total} tone="indigo" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18V3H3v18Zm4-4h4v4H7v-4Zm6 0h4v4h-4v-4ZM7 7h4v4H7V7Zm6 0h4v4h-4V7Z" /></svg>} />
        <StatCard title="Aktif" value={aktif} tone="green" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>} />
        <StatCard title="Suspend" value={suspend} tone="red" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z" /></svg>} />
        <StatCard title="Pending" value={pending} tone="yellow" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8v5l4 2" /><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /></svg>} />
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">Daftar Perusahaan <span className="text-xs font-normal text-gray-500">({totalItems} Data)</span></h3>
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Cari ID atau Nama..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Tambah
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Perusahaan</th>
                <th className="px-6 py-3 font-semibold">Alamat</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Memuat data...</td></tr>
              ) : perusahaan.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Data tidak ditemukan.</td></tr>
              ) : (
                perusahaan.map((p) => (
                  <tr key={p.id_perusahaan} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {p.nama_perusahaan.charAt(0)}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{p.nama_perusahaan}</div>
                          <div className="text-xs text-gray-500 font-mono">ID: {p.id_perusahaan}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{p.alamat || "-"}</td>
                    <td className="px-6 py-4">
                      <Badge tone={p.status_aktif === true ? 'green' : p.status_aktif === false ? 'red' : 'yellow'}>
                        {p.status_aktif === true ? 'Aktif' : p.status_aktif === false ? 'Suspend' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <IconButton tone="indigo" title="Edit" onClick={() => openEdit(p)}>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                        </IconButton>
                        {p.status_aktif ? (
                          <IconButton tone="yellow" title="Suspend" onClick={() => handleToggleStatus(p.id_perusahaan, true)}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" /></svg>
                          </IconButton>
                        ) : (
                          <IconButton tone="green" title="Aktifkan" onClick={() => handleToggleStatus(p.id_perusahaan, false)}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                          </IconButton>
                        )}
                        <IconButton tone="red" title="Hapus" onClick={() => handleDelete(p.id_perusahaan)}>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" /></svg>
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION UI */}
        <div className="px-5 py-4 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Hal {page} dari {totalPages || 1}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{editMode ? "Edit Perusahaan" : "Tambah Perusahaan"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" value={formData.nama_perusahaan} onChange={e => setFormData({ ...formData, nama_perusahaan: e.target.value })} placeholder="Contoh: PT. Teknologi Maju" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" rows="3" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} placeholder="Alamat lengkap..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option value="Aktif">Aktif</option>
                  <option value="Suspend">Suspend</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm">{editMode ? "Simpan Perubahan" : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}