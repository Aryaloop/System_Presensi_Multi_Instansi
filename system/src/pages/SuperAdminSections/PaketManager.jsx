import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Swal from "sweetalert2";
import { StatCard, IconButton } from "./SuperAdminUI"; // Pastikan path ini benar sesuai struktur folder Anda

export default function PaketManager() {
  const queryClient = useQueryClient();
  
  // State
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ id_paket: "", nama_paket: "", durasi_hari: 30, harga: 0 });

  // 1. Fetch Data Paket
  const { data: listPaket, isLoading } = useQuery({
    queryKey: ["masterPaket"],
    queryFn: async () => {
      const res = await axios.get("/api/superadmin/paket");
      return res.data;
    }
  });

  // 2. Handle Save (Create/Update)
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`/api/superadmin/paket/${formData.id_paket}`, formData);
        Swal.fire("Berhasil", "Paket diperbarui", "success");
      } else {
        await axios.post("/api/superadmin/paket", formData);
        Swal.fire("Berhasil", "Paket baru ditambahkan", "success");
      }
      setShowForm(false);
      queryClient.invalidateQueries(["masterPaket"]); // Refresh data
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan", "error");
    }
  };

  // 3. Handle Delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Paket?", 
      text: "Pastikan tidak ada perusahaan yang sedang proses transaksi dengan paket ini.", 
      icon: "warning",
      showCancelButton: true, 
      confirmButtonColor: "#d33", 
      confirmButtonText: "Ya, Hapus"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/superadmin/paket/${id}`);
        Swal.fire("Terhapus", "Paket dihapus", "success");
        queryClient.invalidateQueries(["masterPaket"]);
      } catch (err) {
        Swal.fire("Gagal", "Gagal menghapus paket", "error");
      }
    }
  };

  // Helper Form
  const openCreate = () => {
    setFormData({ id_paket: "", nama_paket: "", durasi_hari: 30, harga: 0 });
    setEditMode(false);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setFormData(item);
    setEditMode(true);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Master Paket Langganan</h1>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Tambah Paket
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Nama Paket</th>
                <th className="px-6 py-3 font-semibold">Durasi (Hari)</th>
                <th className="px-6 py-3 font-semibold">Harga (IDR)</th>
                <th className="px-6 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Memuat data...</td></tr>
              ) : listPaket?.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Belum ada paket.</td></tr>
              ) : (
                listPaket?.map((p) => (
                  <tr key={p.id_paket} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.nama_paket}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                        {p.durasi_hari} Hari
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">
                      Rp {parseInt(p.harga).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <IconButton tone="indigo" title="Edit" onClick={() => openEdit(p)}>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                        </IconButton>
                        <IconButton tone="red" title="Hapus" onClick={() => handleDelete(p.id_paket)}>
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
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{editMode ? "Edit Paket" : "Tambah Paket Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket</label>
                <input className="w-full border p-2 rounded-lg" placeholder="Contoh: Paket Bulanan Pro" value={formData.nama_paket} onChange={e => setFormData({ ...formData, nama_paket: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (Hari)</label>
                    <input type="number" className="w-full border p-2 rounded-lg" placeholder="30" value={formData.durasi_hari} onChange={e => setFormData({ ...formData, durasi_hari: e.target.value })} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                    <input type="number" className="w-full border p-2 rounded-lg" placeholder="0" value={formData.harga} onChange={e => setFormData({ ...formData, harga: e.target.value })} required />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}