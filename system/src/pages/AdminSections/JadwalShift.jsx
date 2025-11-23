// src/pages/AdminSections/JadwalShift.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function JadwalShift() {
  const id_perusahaan = localStorage.getItem("id_perusahaan");
  const [shiftList, setShiftList] = useState([]);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    id_shift: "",
    nama_shift: "",
    jam_masuk: "",
    jam_pulang: "",
    hari_shift: "",
  });
  const [editShift, setEditShift] = useState(false);

  // =============================
  // 📡 Ambil daftar shift
  // =============================
  const fetchShiftList = async () => {
    try {
      const res = await axios.get(`/api/admin/shift/${id_perusahaan}`);
      setShiftList(res.data.data);
    } catch (err) {
      console.error("❌ Gagal memuat shift:", err);
      Swal.fire("❌ Error", "Gagal memuat daftar shift", "error");
    }
  };

  useEffect(() => {
    fetchShiftList();
  }, []);

  // =============================
  // ✏️ Ubah form input
  // =============================
  const handleShiftChange = (e) => {
    setShiftForm({ ...shiftForm, [e.target.name]: e.target.value });
  };

  // =============================
  // 💾 Simpan (Tambah/Edit)
  // =============================
  const handleSaveShift = async (e) => {
    e.preventDefault();
    try {
      const url = editShift
        ? `/api/admin/shift/${shiftForm.id_shift}`
        : "/api/admin/shift";
      const method = editShift ? axios.put : axios.post;

      await method(url, { ...shiftForm, id_perusahaan });
      Swal.fire("✅ Berhasil", `Shift berhasil ${editShift ? "diedit" : "ditambahkan"}`, "success");
      setShowShiftForm(false);
      setEditShift(false);
      setShiftForm({ nama_shift: "", jam_masuk: "", jam_pulang: "", hari_shift: "" });
      fetchShiftList();
    } catch (err) {
      Swal.fire("❌ Gagal", "Terjadi kesalahan saat menyimpan data shift", "error");
    }
  };

  // =============================
  // ✏️ Edit Shift
  // =============================
  const handleEditShift = (shift) => {
    setShiftForm({
      id_shift: shift.id_shift,
      nama_shift: shift.nama_shift,
      jam_masuk: shift.jam_masuk,
      jam_pulang: shift.jam_pulang,
      hari_shift: shift.hari_shift,
    });
    setEditShift(true);
    setShowShiftForm(true);
  };

  // =============================
  // 🗑 Hapus Shift (pakai Swal)
  // =============================
  const handleDeleteShift = async (id_shift) => {
    const confirmDelete = await Swal.fire({
      title: "Yakin ingin menghapus?",
      text: "Shift ini akan dihapus secara permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (confirmDelete.isConfirmed) {
      try {
        await axios.delete(`/api/admin/shift/${id_shift}`);
        Swal.fire("🗑️ Dihapus!", "Shift berhasil dihapus.", "success");
        fetchShiftList();
      } catch (err) {
        Swal.fire("❌ Gagal", "Terjadi kesalahan saat menghapus shift", "error");
      }
    }
  };

  // =============================
  // 🧱 Render UI
  // =============================
  return (
    <section>
      <h2 className="text-xl font-bold mb-4">🕒 Jadwal & Shift Kerja</h2>
      <p className="text-gray-600 mb-4">
        Admin dapat menambah, mengedit, dan menghapus jadwal shift karyawan.
      </p>

      <div className="bg-white p-6 rounded-lg shadow transition-transform hover:shadow-lg">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-lg">Daftar Shift Kerja</h3>
          <button
            onClick={() => {
              setShiftForm({ nama_shift: "", jam_masuk: "", jam_pulang: "", hari_shift: "" });
              setEditShift(false);
              setShowShiftForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 active:scale-95 transition-all"
          >
            ➕ Tambah Shift
          </button>
        </div>

        {/* ========================= Modal Tambah/Edit ========================= */}
        {showShiftForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 animate-fadeIn">
              <h3 className="font-bold mb-3 text-lg">
                {editShift ? "✏️ Edit Shift" : "➕ Tambah Shift"}
              </h3>
              <form onSubmit={handleSaveShift} className="space-y-3">
                <input
                  name="nama_shift"
                  placeholder="Nama Shift"
                  value={shiftForm.nama_shift}
                  onChange={handleShiftChange}
                  className="w-full border p-2 rounded"
                  required
                />
                <input
                  type="time"
                  name="jam_masuk"
                  value={shiftForm.jam_masuk}
                  onChange={handleShiftChange}
                  className="w-full border p-2 rounded"
                  required
                />
                <input
                  type="time"
                  name="jam_pulang"
                  value={shiftForm.jam_pulang}
                  onChange={handleShiftChange}
                  className="w-full border p-2 rounded"
                  required
                />
                <input
                  name="hari_shift"
                  placeholder="Hari Shift (contoh: Senin-Jumat)"
                  value={shiftForm.hari_shift}
                  onChange={handleShiftChange}
                  className="w-full border p-2 rounded"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowShiftForm(false)}
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

        {/* ========================= Tabel Shift ========================= */}
        <table className="min-w-full border text-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 border">Nama Shift</th>
              <th className="p-2 border">Jam Masuk</th>
              <th className="p-2 border">Jam Pulang</th>
              <th className="p-2 border">Hari</th>
              <th className="p-2 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {shiftList.map((s) => (
              <tr key={s.id_shift} className="hover:bg-indigo-50 transition-colors duration-150">
                <td className="border p-2">{s.nama_shift}</td>
                <td className="border p-2">{s.jam_masuk}</td>
                <td className="border p-2">{s.jam_pulang}</td>
                <td className="border p-2">{s.hari_shift}</td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => handleEditShift(s)}
                    className="bg-yellow-400 px-3 py-1 rounded text-white hover:bg-yellow-500 active:scale-95 transition-all"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteShift(s.id_shift)}
                    className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600 active:scale-95 transition-all"
                  >
                    🗑 Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
