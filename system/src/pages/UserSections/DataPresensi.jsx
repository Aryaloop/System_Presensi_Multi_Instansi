// src/pages/UserSections/DataPresensi.jsx
import React, { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// ===========================================================================
// HELPER LOKAL (Pindahkan semua helper yang relevan ke sini)
// ===========================================================================
const pad2 = (n) => String(n).padStart(2, "0");
const fmtTime = (s) => (s ? new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—");
const fmtDate = (s) => new Date(s).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const durasi = (masuk, pulang) => {
  if (!masuk || !pulang) return "—";
  const ms = new Date(pulang) - new Date(masuk);
  if (ms <= 0) return "—";
  const j = Math.floor(ms / 36e5);
  const m = Math.round((ms % 36e5) / 6e4);
  return `${j}j ${m}m`;
};
const badgeClass = (st) =>
  st === "HADIR"
    ? "bg-emerald-100 text-emerald-700"
    : st === "TERLAMBAT"
      ? "bg-orange-100 text-orange-700"
      : st === "IZIN"
        ? "bg-yellow-100 text-yellow-700"
        : st === "WFH"
          ? "bg-purple-100 text-purple-700"
          : "bg-red-100 text-red-700";
const dotClass = (st) =>
  st === "HADIR"
    ? "bg-emerald-500"
    : st === "TERLAMBAT"
      ? "bg-orange-500"
      : st === "IZIN"
        ? "bg-yellow-500"
        : st === "WFH"
          ? "bg-purple-500"
          : "bg-red-500";


export default function DataPresensi() {
  const today = new Date();

  // ===========================================================================
  // STATE LOKAL (Pindahkan semua state yang relevan ke sini)
  // ===========================================================================
  const [search, setSearch] = useState("");
  const [bulanFilter, setBulanFilter] = useState(`${today.getFullYear()}-${pad2(today.getMonth() + 1)}`);
  const [pageData, setPageData] = useState(1);
  const PAGE_SIZE = 10;

  // Ambil tahun dan bulan dari filter
  const [tahun, bulan] = bulanFilter.split('-').map(Number);

  // ===========================================================================
  // DATA FETCHING (useQuery)
  // ===========================================================================
  const { data: kehadiranData, isLoading } = useQuery({
    queryKey: ["kehadiran", bulan, tahun], // Kunci unik
    queryFn: async () => {
      const res = await axios.get(`/api/user/kehadiran?bulan=${bulan}&tahun=${tahun}`);
      return (res.data.data || []); // Pastikan ini mengambil array yang benar
    },
    onError: () => {
      // (handle error, mungkin pakai toast)
    }
  });

  const kehadiran = kehadiranData || [];

  // ===========================================================================
  // LOGIC FILTERING & PAGINATION (Semua logic lama pindah ke sini)
  // ===========================================================================
  const prepared = (kehadiran || []).map((k) => ({
    tanggalLabel: fmtDate(k.created_at),
    masukLabel: fmtTime(k.jam_masuk),
    keluarLabel: fmtTime(k.jam_pulang),
    durasiLabel: durasi(k.jam_masuk, k.jam_pulang),
    status: k.status || "—",
    rawDate: new Date(k.created_at),
  }));

  const filtered = prepared.filter((r) => {
    // Filter by month sudah di-handle oleh useQuery, jadi kita hanya filter search
    const q = search.trim().toLowerCase();
    if (!q) return true; // Tampilkan semua jika search kosong

    return (
      r.tanggalLabel.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.masukLabel.toLowerCase().includes(q) ||
      r.keluarLabel.toLowerCase().includes(q)
    );
  });

  const start = (pageData - 1) * PAGE_SIZE;
  const paginated = filtered.slice(start, start + PAGE_SIZE);

  // ===========================================================================
  // HANDLER LOKAL (CSV, Grafik)
  // ===========================================================================
  const handleExportCSV = () => {
    const header = ["Tanggal", "Masuk", "Keluar", "Jam Kerja", "Status"];
    const rows = filtered.map((r) => [r.tanggalLabel, r.masukLabel, r.keluarLabel, r.durasiLabel, r.status]);
    const csv = [header, ...rows].map((arr) => arr.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-presensi_${bulanFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===========================================================================
  // GRAFIK: hitung total jam kerja per bulan (hanya data lengkap)
  // ===========================================================================
  const calculateMonthlyWorkHours = () => {
    if (!Array.isArray(kehadiran) || kehadiran.length === 0) return [];
    const valid = kehadiran.filter((k) => k.jam_masuk && k.jam_pulang && new Date(k.jam_pulang) > new Date(k.jam_masuk));
    const byMonth = {};
    valid.forEach((k) => {
      const masuk = new Date(k.jam_masuk);
      const pulang = new Date(k.jam_pulang);
      const dur = (pulang - masuk) / 36e5; // jam
      const bulan = masuk.toLocaleString("id-ID", { month: "short" });
      byMonth[bulan] = (byMonth[bulan] || 0) + dur;
    });
    return Object.entries(byMonth).map(([bulan, totalJam]) => ({ bulan, totalJam: parseFloat(totalJam.toFixed(2)) }));
  };


  return (
    <section>
      {/* Header + Toolbar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Data Presensi</h2>
          <p className="text-xs text-gray-500">Riwayat kehadiran Anda</p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          {/* Search */}
          <div className="relative w-full md:w-60">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.5-1.5-5-5z" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageData(1);
              }}
              className="w-full rounded-lg border px-9 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Cari tanggal/status…"
            />
          </div>

          {/* Filter bulan */}
          <input
            type="month"
            value={bulanFilter}
            onChange={(e) => {
              setBulanFilter(e.target.value);
              setPageData(1);
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          />

          {/* Export */}
          <button onClick={handleExportCSV} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 20h14v-2H5v2zM12 3l4 4h-3v7h-2V7H8l4-4z" />
            </svg>
            Export
          </button>

          {/* Download icon */}
          <button onClick={handleExportCSV} className="rounded-lg border p-2.5 hover:bg-gray-50" title="Download CSV">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L11 13.17V3h1Z" />
              <path d="M5 19h14v2H5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Tanggal</th>
              <th className="px-4 py-2 text-left">Masuk</th>
              <th className="px-4 py-2 text-left">Keluar</th>
              <th className="px-4 py-2 text-left">Jam Kerja</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-500">
                  Tidak ada data pada periode ini.
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{row.tanggalLabel}</td>
                  <td className="px-4 py-3">{row.masukLabel}</td>
                  <td className="px-4 py-3">{row.keluarLabel}</td>
                  <td className="px-4 py-3">{row.durasiLabel}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(
                        row.status
                      )}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${dotClass(row.status)}`} />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 p-4">
          <button
            disabled={pageData === 1}
            onClick={() => setPageData((p) => p - 1)}
            className="rounded border bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            &lt; Previous
          </button>
          <span className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white">{pageData}</span>
          <button
            disabled={pageData * PAGE_SIZE >= filtered.length}
            onClick={() => setPageData((p) => p + 1)}
            className="rounded border bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next &gt;
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 mt-6">
        <div className="font-semibold mb-4">
          Grafik Jam Kerja per Bulan Tahun {new Date().toLocaleString("id-ID", { year: "numeric" })}
        </div>
        {calculateMonthlyWorkHours().length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={calculateMonthlyWorkHours()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan" />
              <YAxis label={{ value: "Total Jam Kerja (jam)", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(v) => `${v} jam`} />
              <Legend />
              <Bar dataKey="totalJam" fill="#4f46e5" name="Total Jam Kerja" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-10">Tidak ada data jam kerja lengkap (jam masuk & pulang).</p>
        )}
      </div>

    </section>
  );
}