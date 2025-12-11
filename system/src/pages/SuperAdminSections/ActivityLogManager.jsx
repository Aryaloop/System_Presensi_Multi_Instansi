import React, { useState, useEffect } from "react"; // Tambah useEffect
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function ActivityLogManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1); // State Halaman Saat Ini
  const limit = 30; // Limit per halaman

  // Fetch Data Logs (Sekarang bergantung pada 'page' dan 'searchTerm')
  const { data: apiResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ["activityLogs", page, searchTerm], // Refetch jika page/search berubah
    queryFn: async () => {
      // Kirim parameter page & limit ke backend
      const res = await axios.get(`/api/superadmin/activity-logs?page=${page}&limit=${limit}&search=${searchTerm}`);
      return res.data; // Struktur: { data: [...], pagination: {...} }
    },
    keepPreviousData: true, // Agar tidak flicker saat ganti halaman
    refetchInterval: 30000,
  });

  const logs = apiResponse?.data || [];
  const pagination = apiResponse?.pagination || {};

  // Reset ke halaman 1 jika melakukan pencarian baru
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleNext = () => {
    if (page < pagination.total_pages) setPage((old) => old + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage((old) => old - 1);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">⏳ Memuat Log Aktivitas...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">❌ Gagal memuat data log.</div>;

  return (
    <section className="animate-fadeIn pb-10">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Log Aktivitas Sistem</h2>
            <p className="text-sm text-gray-500">Memantau tindakan user. Total: <b>{pagination.total_data || 0}</b> Aktivitas.</p>
        </div>
        
        <div className="mt-4 md:mt-0 relative">
          <input
            type="text"
            placeholder="Cari berdasarkan Aksi..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">User (Akun)</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Detail Info</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id_log} className="hover:bg-gray-50 transition">
                  {/* Waktu */}
                  <td className="p-4 text-sm text-gray-600 whitespace-nowrap align-top">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(log.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>

                  {/* User & Email */}
                  <td className="p-4 align-top">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 flex-shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase border border-indigo-200 mt-0.5">
                            {log.akun?.username ? log.akun.username.substring(0, 2) : "SY"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                                {log.akun?.username || "System / Guest"}
                            </span>
                            {log.akun?.email && (
                                <span className="text-xs text-gray-500 font-normal">
                                    {log.akun.email}
                                </span>
                            )}
                        </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="p-4 align-top">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {log.akun?.id_jabatan || "SYSTEM"}
                      </span>
                  </td>

                  {/* Action */}
                  <td className="p-4 align-top">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                    </span>
                  </td>

                  {/* Detail Info */}
                  <td className="p-4 text-sm text-gray-600 align-top">
                    <p className="line-clamp-2 max-w-xs" title={JSON.stringify(log.details, null, 2)}>
                       {renderDetails(log.details)}
                    </p>
                  </td>

                  {/* IP Address */}
                  <td className="p-4 text-xs text-gray-400 font-mono align-top">
                    {log.ip_address || "-"}
                  </td>
                </tr>
              ))}
              
              {logs.length === 0 && (
                  <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">Tidak ada log aktivitas ditemukan.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER PAGINATION (NEW) --- */}
        <div className="bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
                Menampilkan Halaman <b>{page}</b> dari <b>{pagination.total_pages || 1}</b>
            </span>

            <div className="flex items-center gap-2">
                <button
                    onClick={handlePrev}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border bg-white text-gray-600 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    &larr; Previous
                </button>
                <button
                    onClick={handleNext}
                    disabled={page >= (pagination.total_pages || 1)}
                    className="px-3 py-1.5 rounded-lg border bg-white text-gray-600 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    Next &rarr;
                </button>
            </div>
        </div>

      </div>
    </section>
  );
}

// --- Helper Functions (Sama seperti sebelumnya) ---
const getActionColor = (action) => {
    const act = action?.toUpperCase() || "";
    if (act.includes("LOGIN")) return "bg-green-50 text-green-700 border-green-200";
    if (act.includes("LOGOUT")) return "bg-gray-100 text-gray-600 border-gray-200";
    if (act.includes("CREATE") || act.includes("REGISTER")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (act.includes("UPDATE") || act.includes("EDIT")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (act.includes("DELETE") || act.includes("SUSPEND")) return "bg-red-50 text-red-700 border-red-200";
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
};

const renderDetails = (details) => {
    if (!details) return "-";
    if (typeof details === 'string') return details;
    if (details.msg) return details.msg;
    const str = JSON.stringify(details);
    return str.length > 50 ? str.substring(0, 50) + "..." : str;
};