import { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

export default function KaryawanManager() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState(null);

  // State untuk menyimpan daftar shift
  const [shiftList, setShiftList] = useState([]);
  const limit = 20;


  // HELPER: Format Hari Kerja (Boolean -> Teks)

  const renderHariKerja = (shift) => {
    const days = [];
    if (shift.is_senin) days.push("Sen");
    if (shift.is_selasa) days.push("Sel");
    if (shift.is_rabu) days.push("Rab");
    if (shift.is_kamis) days.push("Kam");
    if (shift.is_jumat) days.push("Jum");
    if (shift.is_sabtu) days.push("Sab");
    if (shift.is_minggu) days.push("Min");
    return days.length > 0 ? days.join(", ") : "Tidak ada jadwal";
  };

  // ===========
  // Ambil Data Karyawan
  // ===========
  const { data: karyawanData = { data: [], total: 0 }, isLoading, isError } = useQuery({
    queryKey: ["karyawan", currentPage],
    queryFn: async () => {
      const res = await axios.get(
        `/api/admin/karyawan?page=${currentPage}&limit=${limit}`
      );
      return res.data;
    },
    keepPreviousData: true,
  });

  const handleRefresh = () =>
    queryClient.invalidateQueries(["karyawan", currentPage]);

  // ===========
  // Ambil Daftar Shift untuk Dropdown
  // ===========
  const fetchShiftList = async () => {
    try {
      const res = await axios.get("/api/admin/shift");
      setShiftList(res.data.data);
    } catch (err) {
      console.error("Gagal ambil shift", err);
    }
  };

  useEffect(() => {
    fetchShiftList();
  }, []);

  // ===========
  // Edit Karyawan
  // ===========
  const handleEditKaryawan = (karyawan) => {
    setSelectedKaryawan({ ...karyawan });
    setShowEditForm(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/karyawan/${selectedKaryawan.id_akun}`, selectedKaryawan);
      Swal.fire("✅ Berhasil", "Data karyawan berhasil diperbarui", "success");
      setShowEditForm(false);
      handleRefresh();
    } catch (err) {
      Swal.fire("❌ Gagal", "Gagal memperbarui data karyawan", "error");
    }
  };

  // HANDLER: Non-aktifkan Karyawan (Soft Delete)

  const handleDeleteKaryawan = async (id_akun) => {
    const confirmAction = await Swal.fire({
      title: "Non-aktifkan Karyawan?",
      text: "Karyawan tidak akan bisa login, namun data presensi tetap aman.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33", // Merah
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, Non-aktifkan!",
      cancelButtonText: "Batal",
    });

    if (confirmAction.isConfirmed) {
      try {
        // Memanggil endpoint DELETE (yang di backend sudah kita ubah jadi Soft Delete)
        await axios.delete(`/api/admin/karyawan/${id_akun}`);

        Swal.fire("Berhasil!", "Akun karyawan telah dinonaktifkan.", "success");
        handleRefresh(); // Refresh tabel
      } catch (err) {
        console.error(err);
        Swal.fire("Gagal", "Terjadi kesalahan saat menonaktifkan akun.", "error");
      }
    }
  };


  // HANDLER: Restore / Aktifkan Kembali

  const handleRestoreKaryawan = async (id_akun) => {
    const confirmAction = await Swal.fire({
      title: "Aktifkan Kembali?",
      text: "Karyawan akan dapat login dan melakukan presensi lagi.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10B981", // Hijau
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, Aktifkan!",
      cancelButtonText: "Batal",
    });

    if (confirmAction.isConfirmed) {
      try {
        // Kita gunakan endpoint PUT untuk update status kembali ke 'AKTIF'
        await axios.put(`/api/admin/karyawan/${id_akun}`, {
          status_akun: 'AKTIF'
        });

        Swal.fire("Berhasil!", "Akun karyawan kembali AKTIF.", "success");
        handleRefresh(); // Refresh tabel
      } catch (err) {
        console.error(err);
        Swal.fire("Gagal", "Gagal mengaktifkan kembali akun.", "error");
      }
    }
  };

  // ===========
  // Tampilan UI
  // ===========
  return (
    <section>
      <h2 className="text-xl font-bold mb-4">👥 Kelola Data Karyawan</h2>
      <p className="text-gray-600">
        Admin dapat menambah, mengedit, dan menghapus akun karyawan di perusahaan Anda.
      </p>

      <div className="bg-white p-6 mt-4 rounded-lg shadow transition-transform duration-200 hover:shadow-lg">
        <div className="flex justify-between mb-4 items-center">
          <h3 className="font-semibold text-lg">Daftar Karyawan</h3>
          <button
            onClick={handleRefresh}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 active:scale-95 transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-500 text-center py-4">⏳ Memuat data...</p>
        ) : isError ? (
          <p className="text-red-500 text-center py-4">❌ Gagal memuat data</p>
        ) : (
          <table className="min-w-full border text-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border">Nama</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Jabatan</th>
                <th className="p-2 border">Shift</th>
                <th className="p-2 border">Hari Kerja</th>
                <th className="p-2 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {karyawanData.data?.map((k) => (
                <tr key={k.id_akun} className={k.status_akun === 'NONAKTIF' ? "bg-gray-200 text-gray-500" : "hover:bg-indigo-50"}>
                  <td className="border p-2">
                    {k.username}
                    {k.status_akun === 'NONAKTIF' && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Non-Aktif
                      </span>
                    )}
                  </td>
                  <td className="border p-2">{k.username}</td>
                  <td className="border p-2">{k.email}</td>
                  <td className="border p-2">{k.id_jabatan}</td>
                  <td className="border p-2">
                    {k.shift ? `${k.shift.nama_shift} (${k.shift.jam_masuk}-${k.shift.jam_pulang})` : "-"}
                  </td>
                  {/* Tampilkan hari kerja juga di tabel utama biar informatif */}
                  <td className="border p-2 text-xs text-gray-600">
                    {k.shift ? renderHariKerja(k.shift) : "-"}
                  </td>
                  {/* Bagian Kolom Aksi di dalam .map */}
                  <td className="border p-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Tombol Edit */}
                      <button
                        onClick={() => handleEditKaryawan(k)}
                        className="bg-yellow-400 px-3 py-1 rounded text-white hover:bg-yellow-500 transition-all text-xs"
                        title="Edit Data"
                      >
                        ✏️ Edit
                      </button>

                      {/* Logic Tombol Non-aktifkan / Aktifkan */}
                      {k.status_akun !== 'NONAKTIF' ? (
                        <button
                          onClick={() => handleDeleteKaryawan(k.id_akun)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-all text-xs"
                          title="Non-aktifkan Akun"
                        >
                          🛑 Non-aktifkan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreKaryawan(k.id_akun)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-all text-xs"
                          title="Aktifkan Kembali"
                        >
                          ✅ Aktifkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="flex justify-center mt-4 space-x-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50 hover:bg-gray-300 active:scale-95 transition-all"
          >
            ◀️ Sebelumnya
          </button>
          <span className="px-3 py-1">Halaman {currentPage}</span>
          <button
            disabled={karyawanData.data?.length < limit}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50 hover:bg-gray-300 active:scale-95 transition-all"
          >
            Berikutnya ▶️
          </button>
        </div>
      </div>

      {/* Modal Edit */}
      {showEditForm && selectedKaryawan && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 animate-fadeIn">
            <h3 className="font-bold mb-3 text-lg">✏️ Edit Karyawan</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                name="username"
                value={selectedKaryawan.username}
                onChange={(e) =>
                  setSelectedKaryawan({ ...selectedKaryawan, username: e.target.value })
                }
                placeholder="Nama Karyawan"
                className="w-full border p-2 rounded"
                required
              />
              <input
                name="email"
                value={selectedKaryawan.email}
                onChange={(e) =>
                  setSelectedKaryawan({ ...selectedKaryawan, email: e.target.value })
                }
                placeholder="Email"
                className="w-full border p-2 rounded"
                required
              />
              <input
                name="no_tlp"
                value={selectedKaryawan.no_tlp || ""}
                onChange={(e) =>
                  setSelectedKaryawan({ ...selectedKaryawan, no_tlp: e.target.value })
                }
                placeholder="No. Telepon"
                className="w-full border p-2 rounded"
              />
              <input
                name="alamat_karyawan"
                value={selectedKaryawan.alamat_karyawan || ""}
                onChange={(e) =>
                  setSelectedKaryawan({
                    ...selectedKaryawan,
                    alamat_karyawan: e.target.value,
                  })
                }
                placeholder="Alamat"
                className="w-full border p-2 rounded"
              />

              {/* ✅ UPDATE DROPDOWN SHIFT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Shift Kerja</label>
                <select
                  name="id_shift"
                  value={selectedKaryawan.id_shift || ""}
                  onChange={(e) =>
                    setSelectedKaryawan({ ...selectedKaryawan, id_shift: e.target.value })
                  }
                  className="border p-2 rounded w-full text-sm"
                >
                  <option value="">-- Pilih Shift --</option>
                  {shiftList.map((shift) => (
                    <option key={shift.id_shift} value={shift.id_shift}>
                      {shift.nama_shift} ({shift.jam_masuk}-{shift.jam_pulang}) — {renderHariKerja(shift)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  *Format: Nama (Jam) — Hari Kerja
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
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