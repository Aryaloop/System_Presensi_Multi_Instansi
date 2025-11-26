import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function JadwalShift() {
  const [shiftList, setShiftList] = useState([]);
  const [showShiftForm, setShowShiftForm] = useState(false);
  
  // State form disesuaikan dengan kolom boolean baru
  const [shiftForm, setShiftForm] = useState({
    id_shift: "",
    nama_shift: "",
    jam_masuk: "",
    jam_pulang: "",
    is_senin: false,
    is_selasa: false,
    is_rabu: false,
    is_kamis: false,
    is_jumat: false,
    is_sabtu: false,
    is_minggu: false,
  });
  
  const [editShift, setEditShift] = useState(false);

  // --- Fetch Data ---
  const fetchShiftList = async () => {
    try {
      const res = await axios.get(`/api/admin/shift`);
      setShiftList(res.data.data);
    } catch (err) {
      Swal.fire("❌ Error", "Gagal memuat daftar shift", "error");
    }
  };

  useEffect(() => {
    fetchShiftList();
  }, []);

  // --- Handle Input Text ---
  const handleShiftChange = (e) => {
    setShiftForm({ ...shiftForm, [e.target.name]: e.target.value });
  };

  // --- Handle Checkbox Hari (PENTING) ---
  const handleDayChange = (e) => {
    setShiftForm({ ...shiftForm, [e.target.name]: e.target.checked });
  };

  // --- Helper: Format Tampilan Hari di Tabel agar rapi ---
  const renderHariKerja = (s) => {
    const days = [];
    if (s.is_senin) days.push("Sen");
    if (s.is_selasa) days.push("Sel");
    if (s.is_rabu) days.push("Rab");
    if (s.is_kamis) days.push("Kam");
    if (s.is_jumat) days.push("Jum");
    if (s.is_sabtu) days.push("Sab");
    if (s.is_minggu) days.push("Min");
    return days.length > 0 ? days.join(", ") : "-";
  };

  // --- Simpan ---
  const handleSaveShift = async (e) => {
    e.preventDefault();
    try {
      const url = editShift
        ? `/api/admin/shift/${shiftForm.id_shift}`
        : "/api/admin/shift";
      const method = editShift ? axios.put : axios.post;

      await method(url, { ...shiftForm });
      Swal.fire("✅ Berhasil", `Shift berhasil ${editShift ? "diedit" : "ditambahkan"}`, "success");
      setShowShiftForm(false);
      fetchShiftList();
    } catch (err) {
      Swal.fire("❌ Gagal", "Terjadi kesalahan saat menyimpan shift", "error");
    }
  };

  // --- Edit ---
  const handleEditShift = (shift) => {
    setShiftForm({
      id_shift: shift.id_shift,
      nama_shift: shift.nama_shift,
      jam_masuk: shift.jam_masuk,
      jam_pulang: shift.jam_pulang,
      // Load status boolean dari database
      is_senin: shift.is_senin,
      is_selasa: shift.is_selasa,
      is_rabu: shift.is_rabu,
      is_kamis: shift.is_kamis,
      is_jumat: shift.is_jumat,
      is_sabtu: shift.is_sabtu,
      is_minggu: shift.is_minggu,
    });
    setEditShift(true);
    setShowShiftForm(true);
  };

  // --- Delete ---
  const handleDeleteShift = async (id_shift) => {
    const confirm = await Swal.fire({
      title: "Hapus shift?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
    });
    if (confirm.isConfirmed) {
      try {
        await axios.delete(`/api/admin/shift/${id_shift}`);
        fetchShiftList();
        Swal.fire("Terhapus!", "", "success");
      } catch (err) {
        Swal.fire("Gagal", "Error server", "error");
      }
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">🕒 Manajemen Shift Kerja</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-lg">Daftar Shift</h3>
          <button
            onClick={() => {
              // Default: Senin-Jumat tercentang
              setShiftForm({
                nama_shift: "", jam_masuk: "", jam_pulang: "",
                is_senin: true, is_selasa: true, is_rabu: true, is_kamis: true, is_jumat: true,
                is_sabtu: false, is_minggu: false
              });
              setEditShift(false);
              setShowShiftForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            ➕ Tambah Shift
          </button>
        </div>

        {/* Modal Form */}
        {showShiftForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
              <h3 className="font-bold mb-4 text-lg">{editShift ? "Edit Shift" : "Tambah Shift"}</h3>
              <form onSubmit={handleSaveShift} className="space-y-4">
                <input
                  name="nama_shift"
                  placeholder="Nama Shift (e.g. Regular Pagi)"
                  value={shiftForm.nama_shift}
                  onChange={handleShiftChange}
                  className="w-full border p-2 rounded"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Jam Masuk</label>
                    <input
                      type="time"
                      name="jam_masuk"
                      value={shiftForm.jam_masuk}
                      onChange={handleShiftChange}
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Jam Pulang</label>
                    <input
                      type="time"
                      name="jam_pulang"
                      value={shiftForm.jam_pulang}
                      onChange={handleShiftChange}
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>
                </div>

                {/* CHECKBOX HARI KERJA (UI Baru) */}
                <div>
                  <label className="block text-sm font-medium mb-2">Hari Kerja Aktif:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"].map((day) => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer border p-2 rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          name={`is_${day}`}
                          checked={shiftForm[`is_${day}`]}
                          onChange={handleDayChange}
                          className="accent-indigo-600"
                        />
                        <span className="capitalize text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setShowShiftForm(false)} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabel */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left">Nama Shift</th>
              <th className="p-3 border text-left">Jam</th>
              <th className="p-3 border text-left">Hari Kerja</th>
              <th className="p-3 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {shiftList.map((s) => (
              <tr key={s.id_shift} className="hover:bg-gray-50">
                <td className="p-3 border font-medium">{s.nama_shift}</td>
                <td className="p-3 border">{s.jam_masuk} - {s.jam_pulang}</td>
                <td className="p-3 border">
                  {/* Panggil helper render hari */}
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-semibold">
                    {renderHariKerja(s)}
                  </span>
                </td>
                <td className="p-3 border text-center space-x-2">
                  <button onClick={() => handleEditShift(s)} className="text-yellow-600 hover:underline">Edit</button>
                  <button onClick={() => handleDeleteShift(s.id_shift)} className="text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}