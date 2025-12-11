import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  RefreshCw
} from "lucide-react";

/**
 * KaryawanManager.jsx
 * UI disesuaikan dengan mockup (tampilan foto).
 * - Jangan ubah endpoint backend.
 * - Pastikan tailwindcss aktif.
 */

const Badge = ({ children, className = "" }) => (
  <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${className}`}>{children}</span>
);

const shiftColor = (shiftName) => {
  if (!shiftName) return "bg-gray-100 text-gray-700";
  const s = shiftName.toLowerCase();
  if (s.includes("pagi")) return "bg-blue-50 text-blue-700";
  if (s.includes("siang")) return "bg-yellow-50 text-yellow-700";
  if (s.includes("malam")) return "bg-red-50 text-red-700";
  return "bg-gray-100 text-gray-700";
};

const jabatanColor = (jabatan) => {
  if (!jabatan) return "bg-gray-100 text-gray-700";
  const j = jabatan.toLowerCase();
  if (j.includes("manager")) return "bg-purple-50 text-purple-700";
  if (j.includes("supervisor")) return "bg-orange-50 text-orange-700";
  return "bg-green-50 text-green-700";
};

export default function KaryawanManager() {
  const queryClient = useQueryClient();

  // Pagination & filter
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("Semua Jabatan");
  const [filterShift, setFilterShift] = useState("Semua Shift");

  // Modal / edit
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState(null);

  // list shift untuk dropdown edit
  const [shiftList, setShiftList] = useState([]);

  // fetch karyawan
  const { data: karyawanData = { data: [], total: 0, total_page: 1 }, isLoading, isError } = useQuery({
    queryKey: ["karyawan", currentPage, search, filterJabatan, filterShift],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit,
      };
      if (search) params.q = search;
      if (filterJabatan !== "Semua Jabatan") params.jabatan = filterJabatan;
      if (filterShift !== "Semua Shift") params.shift = filterShift;
      const res = await axios.get("/api/admin/karyawan", { params });
      return res.data;
    },
    keepPreviousData: true,
  });

  // get shift list for select
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("/api/admin/shift");
        if (mounted) setShiftList(res.data?.data || []);
      } catch (err) {
        console.error("fetch shift failed", err);
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleRefresh = () => queryClient.invalidateQueries(["karyawan"]);

  // edit handlers
  const handleEditKaryawan = (k) => {
    // pastikan field no_tlp & alamat_karyawan selalu tersedia agar binding form aman
    setSelectedKaryawan({
      ...k,
      no_tlp: k.no_tlp || k.noTelp || "",
      alamat_karyawan: k.alamat_karyawan || k.alamat || ""
    });
    setShowEditForm(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      // Kirim seluruh objek selectedKaryawan — backend akan mengabaikan field yang tidak diperlukan
      await axios.put(`/api/admin/karyawan/${selectedKaryawan.id_akun}`, selectedKaryawan);
      Swal.fire("Berhasil", "Data karyawan disimpan.", "success");
      setShowEditForm(false);
      queryClient.invalidateQueries(["karyawan"]);
    } catch (err) {
      Swal.fire("Gagal", "Tidak dapat menyimpan data.", "error");
    }
  };

  const handleDeleteKaryawan = async (id_akun) => {
    const confirm = await Swal.fire({
      title: "Non-aktifkan Karyawan?",
      text: "Data akun akan dinonaktifkan (soft delete).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Non-aktifkan",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    try {
      await axios.delete(`/api/admin/karyawan/${id_akun}`);
      Swal.fire("Berhasil", "Karyawan dinonaktifkan.", "success");
      queryClient.invalidateQueries(["karyawan"]);
    } catch (err) {
      Swal.fire("Gagal", "Terjadi kesalahan.", "error");
    }
  };

  const handleRestoreKaryawan = async (id_akun) => {
    const confirm = await Swal.fire({
      title: "Aktifkan kembali?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Aktifkan",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    try {
      await axios.put(`/api/admin/karyawan/${id_akun}`, { status_akun: "AKTIF" });
      Swal.fire("Berhasil", "Akun diaktifkan kembali.", "success");
      queryClient.invalidateQueries(["karyawan"]);
    } catch (err) {
      Swal.fire("Gagal", "Terjadi kesalahan.", "error");
    }
  };

  // reset page ketika filter/search berubah
  useEffect(() => setCurrentPage(1), [search, filterJabatan, filterShift]);

  return (
    <div className="min-h-[calc(100vh-40px)] bg-gray-50 p-6">
      {/* Header bar with filters centered like mock */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Daftar Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola data karyawan — tambah, edit, non-aktifkan.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} className="hidden md:flex items-center gap-2 bg-white border px-3 py-2 rounded-md text-sm hover:shadow-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => Swal.fire("Tambah", "Form tambah akan muncul (mock).", "info")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow-sm">
            <Plus size={16} /> Tambah Karyawan
          </button>
        </div>
      </div>

      {/* Toolbar center: filters + search (mimic image: filters left/center, search input, button right) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select value={filterJabatan} onChange={(e) => setFilterJabatan(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white text-sm">
            <option>Semua Jabatan</option>
            <option>Manager</option>
            <option>Supervisor</option>
            <option>Staff</option>
          </select>

          <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white text-sm">
            <option>Semua Shift</option>
            <option>Pagi</option>
            <option>Siang</option>
            <option>Malam</option>
          </select>
        </div>

        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari karyawan..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
          </div>
        </div>

      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-600 border-b">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4">Hari Kerja</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">⏳ Memuat data...</td></tr>
              ) : isError ? (
                <tr><td colSpan="6" className="text-center py-8 text-red-500">❌ Gagal memuat data</td></tr>
              ) : (karyawanData.data || []).length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Data tidak ditemukan.</td></tr>
              ) : (
                karyawanData.data.map((k) => (
                  <tr key={k.id_akun} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${k.status_akun === 'NONAKTIF' ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}>
                          {(k.username || "U").slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-medium ${k.status_akun === 'NONAKTIF' ? 'text-gray-500' : 'text-gray-900'}`}>{k.username}</div>
                          <div className="text-xs text-gray-400">ID: {k.id_akun}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-gray-700">{k.email}</td>

                    <td className="px-6 py-4 align-top">
                      <Badge className={shiftColor(k.shift?.nama_shift || k.shift)}>
                        {k.shift?.nama_shift || (k.shift || "—")}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-gray-600">
                      {k.shift ? `${k.shift.jam_masuk} - ${k.shift.jam_pulang}` : "—"}
                    </td>

                    <td className="px-6 py-4 align-top text-center">
                      {k.status_akun === 'NONAKTIF' ? (
                        <Badge className="bg-gray-100 text-gray-700">Nonaktif</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button title="Edit" onClick={() => handleEditKaryawan(k)}
                          className="p-2 rounded-md text-indigo-600 hover:bg-indigo-50">
                          <Edit3 size={16} />
                        </button>

                        {k.status_akun !== 'NONAKTIF' ? (
                          <button title="Non-aktifkan" onClick={() => handleDeleteKaryawan(k.id_akun)}
                            className="p-2 rounded-md text-red-600 hover:bg-red-50">
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button title="Aktifkan" onClick={() => handleRestoreKaryawan(k.id_akun)}
                            className="p-2 rounded-md text-emerald-600 hover:bg-emerald-50">
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (small rounded like mock) */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <div className="text-xs text-gray-500 mr-auto">
            Menampilkan { (karyawanData.data || []).length } dari { karyawanData.total || 0 } data
          </div>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>

          {/* simple numeric pager (you can replace with dynamic) */}
          <button className={`px-3 py-1 border rounded ${currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-white'}`}>1</button>
          <button className={`px-3 py-1 border rounded ${currentPage === 2 ? 'bg-blue-600 text-white' : 'bg-white'}`}>2</button>
          <button className={`px-3 py-1 border rounded ${currentPage === 3 ? 'bg-blue-600 text-white' : 'bg-white'}`}>3</button>

          <button disabled={(karyawanData.data || []).length < limit} onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      {/* Modal Edit */}
      {showEditForm && selectedKaryawan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">✏️ Edit Karyawan</h3>
              <button onClick={() => setShowEditForm(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nama</label>
                <input required value={selectedKaryawan.username || ""} onChange={(e) => setSelectedKaryawan({...selectedKaryawan, username: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input required value={selectedKaryawan.email || ""} onChange={(e) => setSelectedKaryawan({...selectedKaryawan, email: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>

              {/* ADDED: No. Telepon */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">No. Telepon</label>
                <input value={selectedKaryawan.no_tlp || ""} onChange={(e) => setSelectedKaryawan({...selectedKaryawan, no_tlp: e.target.value})}
                  placeholder="0812xxxxxxx"
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>

              {/* ADDED: Alamat Karyawan */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Alamat</label>
                <input value={selectedKaryawan.alamat_karyawan || ""} onChange={(e) => setSelectedKaryawan({...selectedKaryawan, alamat_karyawan: e.target.value})}
                  placeholder="Jl. Contoh No. 123, Kota"
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Pilih Shift</label>
                <select value={selectedKaryawan.id_shift || ""} onChange={(e) => setSelectedKaryawan({...selectedKaryawan, id_shift: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">-- Tidak ada --</option>
                  {shiftList.map(s => (
                    <option key={s.id_shift} value={s.id_shift}>{s.nama_shift} ({s.jam_masuk}-{s.jam_pulang})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditForm(false)} className="px-3 py-2 border rounded text-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
