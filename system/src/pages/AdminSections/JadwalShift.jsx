import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Edit3, Trash2, Plus } from "lucide-react";

export default function JadwalShift() {
  const [shiftList, setShiftList] = useState([]);
  const [showShiftForm, setShowShiftForm] = useState(false);

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
      setShiftList(res.data.data || []);
    } catch (err) {
      Swal.fire("❌ Error", "Gagal memuat daftar shift", "error");
    }
  };

  useEffect(() => {
    fetchShiftList();
  }, []);

  // --- Handlers ---
  const handleShiftChange = (e) => {
    setShiftForm({ ...shiftForm, [e.target.name]: e.target.value });
  };

  const handleDayChange = (e) => {
    setShiftForm({ ...shiftForm, [e.target.name]: e.target.checked });
  };

  const renderHariKerja = (s) => {
    const days = [];
    if (!s) return "-";
    if (s.is_senin) days.push("Sen");
    if (s.is_selasa) days.push("Sel");
    if (s.is_rabu) days.push("Rab");
    if (s.is_kamis) days.push("Kam");
    if (s.is_jumat) days.push("Jum");
    if (s.is_sabtu) days.push("Sab");
    if (s.is_minggu) days.push("Min");
    return days.length > 0 ? days : ["-"];
  };

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
      setEditShift(false);
      // reset form
      setShiftForm({
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
      fetchShiftList();
    } catch (err) {
      Swal.fire("❌ Gagal", "Terjadi kesalahan saat menyimpan shift", "error");
    }
  };

  const handleEditShift = (shift) => {
    setShiftForm({
      id_shift: shift.id_shift,
      nama_shift: shift.nama_shift,
      jam_masuk: shift.jam_masuk,
      jam_pulang: shift.jam_pulang,
      is_senin: !!shift.is_senin,
      is_selasa: !!shift.is_selasa,
      is_rabu: !!shift.is_rabu,
      is_kamis: !!shift.is_kamis,
      is_jumat: !!shift.is_jumat,
      is_sabtu: !!shift.is_sabtu,
      is_minggu: !!shift.is_minggu,
    });
    setEditShift(true);
    setShowShiftForm(true);
  };

  const handleDeleteShift = async (id_shift) => {
    const confirm = await Swal.fire({
      title: "Hapus shift?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
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

  // --- UI ---
  return (
    <section className="min-h-[70vh]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Manajemen Shift Kerja</h2>
          <p className="text-sm text-gray-500">Atur jadwal shift karyawan — nama, jam dan hari kerja.</p>
        </div>

        <div>
          <button
            onClick={() => {
              setShiftForm({
                id_shift: "",
                nama_shift: "",
                jam_masuk: "",
                jam_pulang: "",
                is_senin: true,
                is_selasa: true,
                is_rabu: true,
                is_kamis: true,
                is_jumat: true,
                is_sabtu: false,
                is_minggu: false,
              });
              setEditShift(false);
              setShowShiftForm(true);
            }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm text-sm"
          >
            <Plus size={16} /> Tambah Shift
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-md font-medium mb-4">Daftar Shift</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b">
                <th className="py-3 text-left">Nama Shift</th>
                <th className="py-3 text-left">Jam</th>
                <th className="py-3 text-left">Hari Kerja</th>
                <th className="py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shiftList.map((s) => (
                <tr key={s.id_shift} className="h-16 border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-4 px-2 font-medium text-gray-800">{s.nama_shift}</td>
                  <td className="py-4 px-2 text-gray-600">
                    {s.jam_masuk} - {s.jam_pulang}
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex flex-wrap gap-2">
                      {renderHariKerja(s).map((d, idx) => (
                        <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <div className="inline-flex gap-2 items-center justify-center">
                      <button
                        onClick={() => handleEditShift(s)}
                        title="Edit"
                        className="p-2 rounded-md bg-white border hover:bg-indigo-50 text-indigo-600"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(s.id_shift)}
                        title="Hapus"
                        className="p-2 rounded-md bg-white border hover:bg-red-50 text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shiftList.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">Belum ada shift.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showShiftForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h4 className="text-lg font-semibold">{editShift ? "Edit Shift" : "Tambah Shift"}</h4>
              <button onClick={() => setShowShiftForm(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSaveShift} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nama Shift</label>
                <input
                  name="nama_shift"
                  value={shiftForm.nama_shift}
                  onChange={handleShiftChange}
                  placeholder="Contoh: Shift Pagi"
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Jam Masuk</label>
                  <input
                    type="time"
                    name="jam_masuk"
                    value={shiftForm.jam_masuk}
                    onChange={handleShiftChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Jam Pulang</label>
                  <input
                    type="time"
                    name="jam_pulang"
                    value={shiftForm.jam_pulang}
                    onChange={handleShiftChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Hari Kerja</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    ["is_senin", "Sen"],
                    ["is_selasa", "Sel"],
                    ["is_rabu", "Rab"],
                    ["is_kamis", "Kam"],
                    ["is_jumat", "Jum"],
                    ["is_sabtu", "Sab"],
                    ["is_minggu", "Min"],
                  ].map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 cursor-pointer border rounded p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        name={name}
                        checked={!!shiftForm[name]}
                        onChange={handleDayChange}
                        className="accent-indigo-600"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowShiftForm(false)} className="px-4 py-2 rounded bg-gray-100">Batal</button>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">{editShift ? "Simpan" : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
