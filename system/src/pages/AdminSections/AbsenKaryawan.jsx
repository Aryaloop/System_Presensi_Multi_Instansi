import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { 
  Search, Filter, Calendar as CalIcon, 
  Clock, AlertTriangle, CheckCircle, XCircle, 
  Pencil, ChevronLeft, ChevronRight, Hash,
  Download // 1. IMPORT ICON DOWNLOAD DISINI
} from "lucide-react";

// --- KOMPONEN KECIL (Helper UI) ---

// 2. DEFINISIKAN ULANG STATS CARD
const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    HADIR: "bg-emerald-100 text-emerald-700 border-emerald-200",
    TERLAMBAT: "bg-orange-100 text-orange-700 border-orange-200",
    IZIN: "bg-blue-100 text-blue-700 border-blue-200",
    WFH: "bg-purple-100 text-purple-700 border-purple-200",
    ALFA: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
};

const formatTime = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
};

const isLate = (jamMasuk, jamJadwal) => {
  if (!jamMasuk || !jamJadwal) return false;
  return new Date(jamMasuk).toTimeString().slice(0,5) > jamJadwal.slice(0,5);
};

export default function AbsenKaryawanRefined() {
  const queryClient = useQueryClient();
  
  // State Filter & Pagination
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10); 

  // State Modal Edit
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // FETCH DATA
  const { data: response, isLoading } = useQuery({
    queryKey: ["admin-kehadiran", bulan, tahun, status, search, page],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/kehadiran`, {
        params: { bulan, tahun, status, search, page, limit }
      });
      return res.data;
    },
    keepPreviousData: true,
  });

  const kehadiranData = response?.data || [];
  const pagination = response?.pagination || { total_page: 1, total_data: 0 };

  // 3. HITUNG STATISTIK (Hanya untuk data yang tampil di halaman ini)
  // Catatan: Karena pakai pagination, stats ini hanya menghitung 10 data yang tampil.
  // Jika ingin stats total sebulan, perlu request API khusus ke backend.
  const stats = useMemo(() => {
    if (!kehadiranData) return { hadir: 0, terlambat: 0, izin: 0, alfa: 0 };
    return {
      hadir: kehadiranData.filter(d => d.status === "HADIR" || d.status === "WFH").length,
      terlambat: kehadiranData.filter(d => d.status === "TERLAMBAT").length,
      izin: kehadiranData.filter(d => d.status === "IZIN").length,
      alfa: kehadiranData.filter(d => d.status === "ALFA").length,
    };
  }, [kehadiranData]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/admin/kehadiran/${editData.id_kehadiran}`, {
        status: editData.status,
        jam_masuk: editData.jam_masuk ? new Date(editData.jam_masuk).toISOString() : null,
        jam_pulang: editData.jam_pulang ? new Date(editData.jam_pulang).toISOString() : null,
        keterangan: editData.keterangan
      });
      Swal.fire("Sukses", "Data kehadiran berhasil dikoreksi.", "success");
      setEditModalOpen(false);
      queryClient.invalidateQueries(["admin-kehadiran"]);
    } catch (err) {
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan.", "error");
    }
  };

  useEffect(() => { setPage(1); }, [bulan, tahun, status, search]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* 4. HEADER SECTION (Sudah diperbaiki) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Kehadiran</h1>
          <p className="text-gray-500 text-sm">Monitor aktivitas absensi karyawan secara real-time.</p>
        </div>
        <button 
          onClick={() => Swal.fire("Info", "Fitur export akan segera hadir!", "info")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-sm text-sm font-medium"
        >
          <Download size={18} /> Export Laporan
        </button>
      </div>

      {/* 5. STATS CARDS SECTION (Sudah diperbaiki) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Hadir" value={stats.hadir} icon={CheckCircle} color="bg-emerald-500" />
        <StatsCard title="Terlambat" value={stats.terlambat} icon={Clock} color="bg-amber-500" />
        <StatsCard title="Izin / Sakit" value={stats.izin} icon={AlertTriangle} color="bg-blue-500" />
        <StatsCard title="Tidak Absen (Alfa)" value={stats.alfa} icon={XCircle} color="bg-red-500" />
      </div>

      {/* TOOLBAR FILTER */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari Nama atau UID..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <div className="flex items-center gap-2 border px-3 py-2 rounded-lg bg-gray-50">
                <CalIcon size={16} className="text-gray-500"/>
                <select value={bulan} onChange={(e) => setBulan(e.target.value)} className="bg-transparent text-sm outline-none cursor-pointer">
                    {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString("id-ID", {month: "long"})}</option>
                    ))}
                </select>
            </div>
            <select value={tahun} onChange={(e) => setTahun(e.target.value)} className="border px-3 py-2 rounded-lg bg-gray-50 text-sm outline-none cursor-pointer">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex items-center gap-2 border px-3 py-2 rounded-lg bg-gray-50">
                <Filter size={16} className="text-gray-500"/>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent text-sm outline-none cursor-pointer">
                    <option value="ALL">Semua Status</option>
                    <option value="HADIR">Hadir</option>
                    <option value="TERLAMBAT">Terlambat</option>
                    <option value="IZIN">Izin</option>
                    <option value="WFH">WFH</option>
                    <option value="ALFA">Alfa</option>
                </select>
            </div>
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Karyawan</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4">Jam Masuk</th>
                <th className="px-6 py-4">Jam Pulang</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8">⏳ Memuat data...</td></tr>
              ) : kehadiranData.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-400">Data tidak ditemukan.</td></tr>
              ) : (
                kehadiranData.map((row) => (
                  <tr key={row.id_kehadiran} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{row.akun?.username}</div>
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <Hash size={10}/> {row.akun?.id_akun?.slice(0,8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">
                        {row.shift?.nama_shift || "Non-Shift"}
                        <div className="opacity-70 text-[10px]">
                            {row.shift?.jam_masuk?.slice(0,5)} - {row.shift?.jam_pulang?.slice(0,5)}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-mono ${isLate(row.jam_masuk, row.shift?.jam_masuk) ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                      {formatTime(row.jam_masuk)}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-700">
                      {formatTime(row.jam_pulang)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => {
                            setEditData({
                                ...row,
                                jam_masuk: row.jam_masuk ? new Date(row.jam_masuk).toISOString().slice(0,16) : "",
                                jam_pulang: row.jam_pulang ? new Date(row.jam_pulang).toISOString().slice(0,16) : ""
                            });
                            setEditModalOpen(true);
                        }}
                        className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100 transition"
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-500">
                Hal {page} dari {pagination.total_page} (Total {pagination.total_data} Data)
            </span>
            <div className="flex gap-2">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded border bg-white disabled:opacity-50 hover:bg-gray-100"
                >
                    <ChevronLeft size={16}/>
                </button>
                <button 
                    disabled={page >= pagination.total_page}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 rounded border bg-white disabled:opacity-50 hover:bg-gray-100"
                >
                    <ChevronRight size={16}/>
                </button>
            </div>
        </div>
      </div>

      {/* MODAL EDIT */}
      {isEditModalOpen && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Koreksi Kehadiran</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-red-500"><XCircle/></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                <p className="font-bold text-blue-800">{editData.akun?.username}</p>
                <p className="text-blue-600 text-xs">Tanggal: {new Date(editData.created_at).toLocaleDateString()}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status Kehadiran</label>
                <select 
                    className="w-full border rounded-lg p-2 text-sm"
                    value={editData.status}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                >
                    <option value="HADIR">HADIR</option>
                    <option value="TERLAMBAT">TERLAMBAT</option>
                    <option value="IZIN">IZIN</option>
                    <option value="WFH">WFH</option>
                    <option value="ALFA">ALFA</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Jam Masuk</label>
                    <input 
                        type="datetime-local"
                        className="w-full border rounded-lg p-2 text-xs"
                        value={editData.jam_masuk}
                        onChange={(e) => setEditData({...editData, jam_masuk: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Jam Pulang</label>
                    <input 
                        type="datetime-local"
                        className="w-full border rounded-lg p-2 text-xs"
                        value={editData.jam_pulang}
                        onChange={(e) => setEditData({...editData, jam_pulang: e.target.value})}
                    />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Catatan Koreksi</label>
                <textarea 
                    className="w-full border rounded-lg p-2 text-sm h-20"
                    placeholder="Alasan perubahan..."
                    value={editData.keterangan || ""}
                    onChange={(e) => setEditData({...editData, keterangan: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition">
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}