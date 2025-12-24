// src/pages/AdminSections/VerifikasiIzin.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Home } from "lucide-react";

/* ---------- Helpers ---------- */
function toText(v) {
  if (v == null) return "-";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    const keys = ["nama_jabatan", "nama", "name", "label", "jabatan", "divisi"];
    for (const k of keys) {
      if (v[k] != null && (typeof v[k] === "string" || typeof v[k] === "number")) return String(v[k]);
    }
    const primitiveVal = Object.values(v).find(x => typeof x === "string" || typeof x === "number");
    if (primitiveVal != null) return String(primitiveVal);
    try {
      const s = JSON.stringify(v);
      return s.length > 60 ? s.slice(0, 57) + "..." : s;
    } catch {
      return "-";
    }
  }
  return String(v);
}

const StatCard = ({ label, value, icon, tagText, tagColorClass }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className="p-3 rounded-lg bg-gray-50">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <div className="text-2xl font-bold text-gray-900">{typeof value === "number" ? value : 0}</div>
      </div>
    </div>
    {tagText && <div className={`text-xs font-semibold px-2 py-1 rounded-full ${tagColorClass}`}>{tagText}</div>}
  </div>
);

const KindBadge = ({ jenis }) => {
  const jk = (jenis || "").toString().toLowerCase();
  if (jk.includes("wfh")) return (<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">🏠 WFH</span>);
  if (jk.includes("cuti")) return (<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 text-xs font-semibold">🌴 Cuti</span>);
  if (jk.includes("sakit")) return (<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">🤒 Sakit</span>);
  if (jk.includes("dinas")) return (<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">💼 Dinas</span>);
  return (<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">{jenis ?? "-"}</span>);
};

const StatusBadge = ({ status }) => {
  const s = (status || "").toString().toUpperCase();
  if (s === "DISETUJUI") return <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">DISETUJUI</span>;
  if (s === "DITOLAK") return <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">DITOLAK</span>;
  return <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">PENDING</span>;
};

export default function VerifikasiIzin() {
  const [izinData, setIzinData] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [jenisFilter, setJenisFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const fetchIzinList = async (p = page) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = { page: p, limit };
      if (jenisFilter !== "ALL") params.jenis_izin = jenisFilter;
      if (statusFilter !== "ALL") params.status_persetujuan = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await axios.get("/api/admin/izin", { params });
      const data = res && res.data ? res.data : {};
      let items = [];
      if (Array.isArray(data.data)) items = data.data;
      else if (Array.isArray(res.data)) items = res.data;
      else items = [];
      const totalFromRes = (data.total != null) ? data.total : (data.pagination?.total_data ?? items.length);
      setIzinData(items);
      setTotal(totalFromRes);
      setPage(data.pagination?.current_page ?? p);
    } catch (err) {
      console.error("fetchIzinList error:", err);
      setFetchError(err?.message || "Gagal memfetch data izin");
      setIzinData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIzinList(1); }, []);

  const applyFilter = async () => { setPage(1); await fetchIzinList(1); };

  const updateStatus = async (id_izin, newStatus) => {
    try {
      setLoading(true);
      await axios.patch(`/api/admin/izin/${id_izin}/verifikasi`, {
        status_persetujuan: newStatus,
        id_verifikator: localStorage.getItem("id_akun") || null
      });
      Swal.fire("Sukses", `Status diubah menjadi ${newStatus}`, "success");
      await fetchIzinList(page);
    } catch (err) {
      console.error("updateStatus error:", err);
      Swal.fire("Gagal", "Tidak dapat mengubah status", "error");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const s = { pending: 0, approved: 0, rejected: 0, wfh: 0 };
    izinData.forEach(it => {
      const st = (it.status_persetujuan || "").toString().toUpperCase();
      if (st === "PENDING") s.pending++;
      if (st === "DISETUJUI") s.approved++;
      if (st === "DITOLAK") s.rejected++;
      if ((it.jenis_izin || "").toString().toLowerCase().includes("wfh")) s.wfh++;
    });
    return s;
  }, [izinData]);

  if (fetchError) {
    return (
      <section className="p-6 bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-semibold mb-4">Verifikasi Izin / WFH</h2>
        <div className="bg-white p-6 rounded shadow">
          <p className="text-red-600 font-semibold">Terjadi kesalahan saat memuat data:</p>
          <pre className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">{String(fetchError)}</pre>
          <div className="mt-4">
            <button onClick={() => fetchIzinList(1)} className="px-4 py-2 bg-indigo-600 text-white rounded">Muat Ulang</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Verifikasi Izin / WFH</h2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Menunggu Verifikasi" value={stats.pending} icon={<Clock size={18} className="text-indigo-600" />} tagText="Pending" tagColorClass="bg-indigo-50 text-indigo-700" />
        <StatCard label="Disetujui" value={stats.approved} icon={<CheckCircle size={18} className="text-emerald-600" />} tagText="Approved" tagColorClass="bg-emerald-50 text-emerald-700" />
        <StatCard label="Ditolak" value={stats.rejected} icon={<XCircle size={18} className="text-red-600" />} tagText="Rejected" tagColorClass="bg-red-50 text-red-700" />
        <StatCard label="Work From Home" value={stats.wfh} icon={<Home size={18} className="text-purple-600" />} tagText="WFH" tagColorClass="bg-purple-50 text-purple-700" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-3">
            <select className="border px-3 py-2 rounded-lg text-sm" value={jenisFilter} onChange={(e) => setJenisFilter(e.target.value)}>
              <option value="ALL">Semua Jenis</option>
              <option value="WFH">WFH</option>
              <option value="Cuti">Cuti</option>
              <option value="Sakit">Sakit</option>
              <option value="Dinas">Dinas</option>
            </select>

            <select className="border px-3 py-2 rounded-lg text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>

          <div className="flex items-center gap-3 ml-auto md:ml-0 md:mx-6">
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg text-sm" />
            </div>

            <button onClick={applyFilter} className="ml-auto md:ml-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">Terapkan Filter</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Jenis</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Alasan</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">⏳ Memuat...</td></tr>
              ) : izinData.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Belum ada pengajuan.</td></tr>
              ) : izinData.map((row) => {
                const statusText = toText(row.status_persetujuan);
                // select background class depending on current value
                const selectClass = statusText === "DISETUJUI"
                  ? "bg-emerald-100 text-emerald-800"
                  : statusText === "DITOLAK"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-50 text-amber-800";

                return (
                  <tr key={row.id_izin} className="hover:bg-gray-50">
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-gray-900">{toText(row.akun?.username ?? row.akun)}</div>
                      <div className="text-xs text-gray-400">{toText(row.akun?.jabatan ?? row.akun?.divisi ?? row.akun)}</div>
                    </td>

                    <td className="px-6 py-4 align-top"><KindBadge jenis={toText(row.jenis_izin)} /></td>

                    <td className="px-6 py-4 align-top text-sm text-gray-600">
                      {toText(row.tanggal_mulai)} → {toText(row.tanggal_selesai)}
                      <div className="text-xs text-gray-400 mt-1">{row.lama_hari ? `${row.lama_hari} hari kerja` : ""}</div>
                    </td>

                    <td className="px-6 py-4 align-top text-gray-700">{toText(row.alasan)}</td>

                    <td className="px-6 py-4 align-top text-center"><StatusBadge status={statusText} /></td>

                    <td className="px-6 py-4 align-top text-center">
                      {/* Native-like select with colored options and select background changes based on value */}
                      <select
                        value={statusText}
                        onChange={(e) => {
                          const v = e.target.value;
                          // Update immediately
                          updateStatus(row.id_izin, v);
                        }}
                        className={`px-3 py-1 rounded border text-xs font-semibold ${selectClass}`}
                        style={{ minWidth: 120 }}
                      >
                        <option value="PENDING" style={{ background: "#FEF3C7", color: "#92400E" }}>PENDING</option>
                        <option value="DISETUJUI" style={{ background: "#ECFDF5", color: "#065F46" }}>DISETUJUI</option>
                        <option value="DITOLAK" style={{ background: "#FEF2F2", color: "#991B1B" }}>DITOLAK</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <div className="text-xs text-gray-500 mr-auto">Total: {total}</div>
          <button disabled={page === 1} onClick={() => { const n = Math.max(1, page - 1); setPage(n); fetchIzinList(n); }} className="px-3 py-1 rounded border disabled:opacity-40"><ChevronLeft size={14} /></button>
          <div className="px-3 py-1 border rounded bg-white text-sm">{page}</div>
          <button disabled={izinData.length < limit} onClick={() => { const n = page + 1; setPage(n); fetchIzinList(n); }} className="px-3 py-1 rounded border disabled:opacity-40"><ChevronRight size={14} /></button>
        </div>
      </div>
    </section>
  );
}
