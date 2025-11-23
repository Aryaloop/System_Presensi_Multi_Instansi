// src/pages/AdminSections/AbsenKaryawan.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function AbsenKaryawan() {
  const id_perusahaan = localStorage.getItem("id_perusahaan");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [dataAbsen, setDataAbsen] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAbsen, setSelectedAbsen] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 50;

  // 📡 Fetch data kehadiran bulanan
  const fetchAbsenBulanan = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `/api/admin/kehadiran-bulanan/${id_perusahaan}?bulan=${bulan}&tahun=${tahun}&page=${page}&limit=${limit}`
      );
      setDataAbsen(res.data.data);
    } catch (err) {
      Swal.fire("❌ Error", "Gagal memuat data kehadiran bulanan", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsenBulanan();
  }, [bulan, tahun, page]);

  // ✏️ Buka modal edit
  const handleEdit = (row) => {
    setSelectedAbsen({ ...row });
    setShowEditModal(true);
  };

  // 💾 Simpan perubahan
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { id_kehadiran, status, jam_masuk, jam_pulang } = selectedAbsen;

      const parseToISO = (value) => {
        if (!value) return null;
        if (/^\d{2}:\d{2}$/.test(value)) {
          const today = new Date();
          const [hour, minute] = value.split(":");
          today.setHours(hour, minute, 0, 0);
          return today.toISOString();
        }
        const dateObj = new Date(value);
        return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
      };

      const fixJamMasuk = parseToISO(jam_masuk);
      const fixJamPulang = parseToISO(jam_pulang);

      await axios.patch(`/api/admin/kehadiran/${id_kehadiran}`, {
        status,
        jam_masuk: fixJamMasuk,
        jam_pulang: fixJamPulang,
      });

      Swal.fire("✅ Berhasil", "Data kehadiran berhasil diperbarui", "success");
      setShowEditModal(false);
      fetchAbsenBulanan();
    } catch (err) {
      console.error("❌ Gagal update kehadiran:", err);
      Swal.fire("❌ Gagal", "Terjadi kesalahan saat memperbarui data", "error");
    }
  };

  // =============================
  // 🧱 Render UI
  // =============================
  return (
    <section>
      <h2 className="text-xl font-bold mb-4">📅 Kehadiran Karyawan Bulanan</h2>

      {/* Filter Bulan & Tahun */}
      <div className="flex gap-4 mb-6">
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
            </option>
          ))}
        </select>

        <select
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          onClick={fetchAbsenBulanan}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 active:scale-95 transition-all"
        >
          🔄 Tampilkan
        </button>
      </div>

      {/* Tabel Data */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        {isLoading ? (
          <p className="text-center text-gray-500 py-4">⏳ Memuat data...</p>
        ) : dataAbsen.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Tidak ada data kehadiran bulan ini.</p>
        ) : (
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border">Username</th>
                <th className="p-2 border">User ID</th>
                <th className="p-2 border">Shift</th>
                <th className="p-2 border">Masuk</th>
                <th className="p-2 border">Hadir</th>
                <th className="p-2 border">Izin</th>
                <th className="p-2 border">Terlambat</th>
                <th className="p-2 border">WFH</th>
                <th className="p-2 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataAbsen.map((row) => (
                <tr key={row.id_kehadiran} className="hover:bg-gray-50 transition-all">
                  <td className="border p-2">{row.username}</td>
                  <td className="border p-2">{row.id_akun}</td>
                  <td className="border p-2">{row.nama_shift || "-"}</td>
                  <td className="border p-2">{row.jam_masuk || "-"}</td>
                  <td className="border p-2 text-center">{row.status === "HADIR" ? "✅" : "-"}</td>
                  <td className="border p-2 text-center">{row.status === "IZIN" ? "✅" : "-"}</td>
                  <td className="border p-2 text-center">{row.status === "TERLAMBAT" ? "✅" : "-"}</td>
                  <td className="border p-2 text-center">{row.status === "WFH" ? "✅" : "-"}</td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleEdit(row)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 active:scale-95 transition-all"
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 active:scale-95 transition-all"
        >
          ◀️ Previous
        </button>
        <span>Halaman {page}</span>
        <button
          disabled={dataAbsen.length < limit}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 active:scale-95 transition-all"
        >
          Next ▶️
        </button>
      </div>

      {/* Modal Edit */}
      {showEditModal && selectedAbsen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
            <h3 className="text-lg font-bold mb-4">✏️ Edit Kehadiran</h3>
            <form onSubmit={handleSave}>
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select
                value={selectedAbsen.status}
                onChange={(e) => setSelectedAbsen({ ...selectedAbsen, status: e.target.value })}
                className="border rounded w-full p-2 mb-3"
              >
                <option value="HADIR">HADIR</option>
                <option value="TERLAMBAT">TERLAMBAT</option>
                <option value="IZIN">IZIN</option>
                <option value="WFH">WFH</option>
                <option value="ALFA">ALFA</option>
              </select>

              <label className="block text-sm font-semibold mb-1">Jam Masuk</label>
              <input
                type="time"
                value={selectedAbsen.jam_masuk || ""}
                onChange={(e) => setSelectedAbsen({ ...selectedAbsen, jam_masuk: e.target.value })}
                className="border rounded w-full p-2 mb-3"
              />

              <label className="block text-sm font-semibold mb-1">Jam Pulang</label>
              <input
                type="time"
                value={selectedAbsen.jam_pulang || ""}
                onChange={(e) => setSelectedAbsen({ ...selectedAbsen, jam_pulang: e.target.value })}
                className="border rounded w-full p-2 mb-4"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
