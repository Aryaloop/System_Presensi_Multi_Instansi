import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

export default function DashboardAdmin() {
useEffect(() => {
  const timer = setTimeout(() => {
    const role = localStorage.getItem("role");
    const jabatan = localStorage.getItem("id_jabatan");
    if (role !== "ADMIN" && jabatan !== "ADMIN") {
      navigate("/login");
    }
  }, 100); // delay 100ms supaya sempat baca localStorage
  return () => clearTimeout(timer);
}, []);


  const navigate = useNavigate();
  const [page, setPage] = useState("dashboard");

  // Load data karyawan per 20
  // 🔹 State untuk pagination data karyawan
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;
  // 🔹 State untuk pagination data Izin
  const [izinPage, setIzinPage] = useState(1);
  const izinLimit = 10;


  const handleLogout = () => {
    navigate("/login");
  };

  // Load data karyawah di halaman Kelola Karyawan
  // const [karyawanData, setKaryawanData] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState(null);
  const [shiftList, setShiftList] = useState([]);
  const queryClient = useQueryClient();
  const id_perusahaan = localStorage.getItem("id_perusahaan");

  // ✅ React Query hook untuk caching data karyawan
  // ✅ React Query untuk ambil data karyawan per halaman
  const {
    data: karyawanData = { data: [], total: 0 },
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["karyawan", id_perusahaan, currentPage],
    queryFn: async () => {
      const res = await axios.get(
        `/api/admin/karyawan/${id_perusahaan}?page=${currentPage}&limit=${limit}`
      );
      return res.data;
    },
    keepPreviousData: true, // biar nggak flicker saat pindah halaman
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries(["karyawan", id_perusahaan, currentPage]);
  };


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const id_perusahaan = localStorage.getItem("id_perusahaan");
    console.log("🧭 ID perusahaan dari localStorage:", id_perusahaan);
    fetchShiftList(); // cukup panggil shiftList saja
  }, [page]);


  const handleDeleteKaryawan = async (id_akun) => {
    if (confirm("Yakin ingin menghapus karyawan ini?")) {
      await axios.delete(`/api/admin/karyawan/${id_akun}`);
      queryClient.invalidateQueries(["karyawan", id_perusahaan]);
    }
  };




  // 🔹 State untuk menyimpan daftar pengajuan izin/WFH dari tabel `izin_wfh`
  const [izinData, setIzinData] = useState([]);

  // 🔹 State untuk menyimpan daftar shift kerja dari tabel `shift`
  const [shiftData, setShiftData] = useState([]);

  // 🔹 State untuk menyimpan input form pembuatan shift baru (nama, jam masuk, jam pulang, hari kerja)
  const [shiftForm, setShiftForm] = useState({
    nama_shift: "",
    jam_masuk: "",
    jam_pulang: "",
    hari_shift: "",
  });

  // 🔹 State untuk menampilkan atau menyembunyikan modal form shift
  const [showShiftForm, setShowShiftForm] = useState(false);

  // 🔹 State penanda apakah form sedang digunakan untuk mengedit shift (true) atau menambah shift baru (false)
  const [editShift, setEditShift] = useState(false);

  // Update perusahaan
  const [perusahaan, setPerusahaan] = useState({});
  // =========================================
  // 🧩 EVENT HANDLER & LOGIC
  // =========================================

  // 🟢 handleShiftChange()
  // Fungsi ini dijalankan setiap kali ada perubahan input di form shift.
  // Contoh: saat user mengetik jam masuk, state `shiftForm` akan otomatis diperbarui.
  const handleShiftChange = (e) => {
    setShiftForm({ ...shiftForm, [e.target.name]: e.target.value });
  };

  // 🟢 handleAddShift()
  // Dipanggil saat admin menekan tombol “Simpan” di form tambah shift.
  // - Mencegah reload halaman default dengan `e.preventDefault()`
  // - Mengirim data form shift ke backend melalui endpoint:
  //     POST /api/presensi/shift
  // - Setelah berhasil, memanggil `fetchShift()` agar tabel langsung terupdate.
  // - Menutup modal form dengan `setShowShiftForm(false)`
  const handleAddShift = async (e) => {
    e.preventDefault();
    const id_perusahaan = localStorage.getItem("id_perusahaan");

    await axios.post("/api/admin/shift", {
      ...shiftForm,
      id_perusahaan, // 🟢 wajib
    });

    fetchShiftList();
    setShowShiftForm(false);
    setShiftForm({ nama_shift: "", jam_masuk: "", jam_pulang: "", hari_shift: "" });
  };




  // 🟢 fetchIzin()
  // Mengambil seluruh data pengajuan izin/WFH dari tabel `izin_wfh`.
  // Endpoint backend yang dipanggil:
  //    GET /api/presensi/izin
  // Hasilnya disimpan ke state `izinData`, yang kemudian ditampilkan di tabel verifikasi izin admin.
  const fetchIzin = async () => {
    const res = await axios.get("/api/presensi/izin");
    setIzinData(res.data.data);
  };

  // Func Edit karyawan 
  const handleEditKaryawan = (karyawan) => {
    setSelectedKaryawan({ ...karyawan }); // isi form dengan data karyawan lama
    setShowEditForm(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `/api/admin/karyawan/${selectedKaryawan.id_akun}`,
        {
          username: selectedKaryawan.username,
          email: selectedKaryawan.email,
          no_tlp: selectedKaryawan.no_tlp,
          alamat_karyawan: selectedKaryawan.alamat_karyawan,
          id_shift: selectedKaryawan.id_shift,
        }
      );

      // ✅ Refetch data dari React Query biar sinkron dengan server
      await queryClient.invalidateQueries(["karyawan", id_perusahaan]);

      Swal.fire("✅ Berhasil", "Data karyawan berhasil diperbarui", "success");
      setShowEditForm(false);
    } catch (err) {
      console.error("❌ Gagal update:", err);
      Swal.fire("❌ Gagal", "Terjadi kesalahan saat memperbarui data", "error");
    }
  };



  const fetchShiftList = async () => {
    try {
      const id_perusahaan = localStorage.getItem("id_perusahaan");
      if (!id_perusahaan) return console.warn("⚠️ ID perusahaan tidak ditemukan.");

      const res = await axios.get(`/api/admin/shift/${id_perusahaan}`);
      console.log("✅ Data shift:", res.data.data);
      setShiftList(res.data.data);
    } catch (err) {
      console.error("❌ Gagal memuat daftar shift:", err);
    }
  };
  // ===================================================
  // ---------------Edit Shift Func----------------------
  // ====================================================
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


  const handleSaveEditShift = async (e) => {
    e.preventDefault();

    await axios.put(`/api/admin/shift/${shiftForm.id_shift}`, {
      nama_shift: shiftForm.nama_shift,
      jam_masuk: shiftForm.jam_masuk,
      jam_pulang: shiftForm.jam_pulang,
      hari_shift: shiftForm.hari_shift,
    });

    fetchShiftList();
    setShowShiftForm(false);
    setEditShift(false);
  };

  const handleDeleteShift = async (id_shift) => {
    if (confirm("Yakin ingin menghapus shift ini?")) {
      await axios.delete(`/api/admin/shift/${id_shift}`);
      fetchShiftList();
    }
  };

  // ==============================================
  // ---------------Verifikasi Izin----------------
  // ===============================================

  const fetchIzinList = async () => {
    const res = await axios.get(
      `/api/admin/izin/${id_perusahaan}?page=${izinPage}&limit=${izinLimit}`
    );
    setIzinData(res.data.data);
    setTotalIzin(res.data.total);
  };

  useEffect(() => {
    if (page === "izin") fetchIzinList();
  }, [page, izinPage]);


  const handleVerifikasiIzin = async (id_izin, status) => {
    await axios.patch(`/api/admin/izin/${id_izin}`, {
      status_persetujuan: status,
      id_verifikator: localStorage.getItem("id_akun"),
    });
    fetchIzinList();
  };

  // ===================================================
  // -----------------Perusahaan Update-----------------
  // ===================================================
  useEffect(() => {
    const fetchPerusahaan = async () => {
      try {
        if (!id_perusahaan) return console.warn("⚠️ ID perusahaan belum tersimpan di session");
        const res = await axios.get(`/api/admin/perusahaan/${id_perusahaan}`);
        setPerusahaan(res.data.data);
      } catch (err) {
        console.error("❌ Gagal memuat data perusahaan:", err);
      }
    };
    if (page === "perusahaan") fetchPerusahaan();
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ================= HEADER ================= */}
      <header className="bg-indigo-700 text-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
        >
          Logout
        </button>
      </header>

      {/* ================= NAVIGATION ================= */}
      <nav className="bg-white shadow p-4 flex flex-wrap gap-3 justify-center">
        {[
          { key: "dashboard", label: "🏠 Dashboard" },
          { key: "karyawan", label: "👥 Kelola Karyawan" },
          { key: "jadwal", label: "🕒 Jadwal Kerja" },
          { key: "izin", label: "📝 Verifikasi Izin" },
          { key: "rekap", label: "🏅 Rekap & Reward" },
          { key: "perusahaan", label: "Perusahaan" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${page === item.key
              ? "bg-indigo-600 text-white shadow"
              : "bg-gray-100 hover:bg-indigo-100"
              }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="p-6">
        {/* ---------------- DASHBOARD ---------------- */}
        {page === "dashboard" && (
          <section>
            <h2 className="text-xl font-bold mb-4">🏠 Ringkasan Sistem</h2>
            <p className="text-gray-600 mb-4">
              Halaman utama admin menampilkan ringkasan aktivitas perusahaan
              dan statistik singkat sistem kehadiran.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-500">Total Karyawan</p>
                <p className="text-3xl font-bold text-indigo-600">--</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-500">Presensi Hari Ini</p>
                <p className="text-3xl font-bold text-green-600">--</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-500">Izin / WFH Aktif</p>
                <p className="text-3xl font-bold text-yellow-600">--</p>
              </div>
            </div>
          </section>
        )}

        {/* ---------------- KELOLA KARYAWAN ---------------- */}
        {page === "karyawan" && (
          <section>
            <h2 className="text-xl font-bold mb-4">👥 Kelola Data Karyawan</h2>
            <p className="text-gray-600">
              Admin dapat menambah, mengedit, dan menghapus akun karyawan di perusahaan Anda.
            </p>

            <div className="bg-white p-6 mt-4 rounded-lg shadow">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">Daftar Karyawan</h3>
                <button
                  onClick={handleRefresh}
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  🔄 Refresh
                </button>

              </div>

              {isLoading ? (
                <p className="text-gray-500 text-center py-4">⏳ Memuat data...</p>
              ) : isError ? (
                <p className="text-red-500 text-center py-4">❌ Gagal memuat data</p>
              ) : (
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Nama</th>
                      <th className="p-2 border">Email</th>
                      <th className="p-2 border">Jabatan</th>
                      <th className="p-2 border">Shift</th>
                      <th className="p-2 border">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {karyawanData.data?.map((k) => (

                      <tr key={k.id_akun}>
                        <td className="border p-2">{k.username}</td>
                        <td className="border p-2">{k.email}</td>
                        <td className="border p-2">{k.id_jabatan}</td>
                        <td className="border p-2">{k.shift?.nama_shift || "-"}</td>
                        <td className="border p-2 space-x-2">
                          <button
                            onClick={() => handleEditKaryawan(k)}
                            className="bg-yellow-400 px-3 py-1 rounded text-white"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteKaryawan(k.id_akun)}
                            className="bg-red-500 px-3 py-1 rounded text-white"
                          >
                            🗑 Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              )}
              {/*  */}
              <div className="flex justify-center mt-4 space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                >
                  ◀️ Sebelumnya
                </button>

                <span className="px-3 py-1">Halaman {currentPage}</span>

                <button
                  disabled={karyawanData.data?.length < limit}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                >
                  Berikutnya ▶️
                </button>
              </div>

              {/* 🟢 Tambahkan modal edit di bawah tabel */}

              {showEditForm && selectedKaryawan && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                    <h3 className="font-bold mb-3">✏️ Edit Karyawan</h3>
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
                      <select
                        name="id_shift"
                        value={selectedKaryawan.id_shift || ""}
                        onChange={(e) =>
                          setSelectedKaryawan({ ...selectedKaryawan, id_shift: e.target.value })
                        }
                        className="w-full border p-2 rounded"
                        required
                      >
                        <option value="">-- Pilih Shift --</option>
                        {shiftList.map((s) => (
                          <option key={s.id_shift} value={s.id_shift}>
                            {s.nama_shift} ({s.jam_masuk} - {s.jam_pulang})
                          </option>
                        ))}
                      </select>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowEditForm(false)}
                          className="px-3 py-1 bg-gray-300 rounded"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-indigo-600 text-white rounded"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}


        {/* ---------------- JADWAL KERJA ---------------- */}
        {page === "jadwal" && (
          <section>
            <h2 className="text-xl font-bold mb-4">🕒 Jadwal & Shift Kerja</h2>
            <p className="text-gray-600 mb-4">
              Admin dapat membuat, mengubah, dan mengatur jadwal kerja setiap karyawan.
            </p>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">Daftar Shift Kerja</h3>
                <button
                  onClick={() => {
                    setShiftForm({ nama_shift: "", jam_masuk: "", jam_pulang: "", hari_shift: "" });
                    setEditShift(false);
                    setShowShiftForm(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  + Tambah Shift
                </button>


              </div>

              {/* Modal Form Tambah/Edit Shift */}
              {showShiftForm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                    <h3 className="font-bold mb-3">
                      {editShift ? "Edit Shift" : "Tambah Shift"}
                    </h3>
                    <form onSubmit={editShift ? handleSaveEditShift : handleAddShift} className="space-y-3">

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
                        placeholder="Jam Masuk"
                        value={shiftForm.jam_masuk}
                        onChange={handleShiftChange}
                        className="w-full border p-2 rounded"
                        required
                      />
                      <input
                        type="time"
                        name="jam_pulang"
                        placeholder="Jam Pulang"
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
                          className="px-3 py-1 bg-gray-300 rounded"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-indigo-600 text-white rounded"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Tabel Shift */}
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Nama Shift</th>
                    <th className="p-2 border">Jam Masuk</th>
                    <th className="p-2 border">Jam Pulang</th>
                    <th className="p-2 border">Hari</th>
                    <th className="p-2 border">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftList.map((s) => (
                    <tr key={s.id_shift}>
                      <td className="border p-2">{s.nama_shift}</td>
                      <td className="border p-2">{s.jam_masuk}</td>
                      <td className="border p-2">{s.jam_pulang}</td>
                      <td className="border p-2">{s.hari_shift}</td>
                      <td className="border p-2 space-x-2">
                        <button
                          onClick={() => handleEditShift(s)}
                          className="bg-yellow-400 px-3 py-1 rounded text-white"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteShift(s.id_shift)}
                          className="bg-red-500 px-3 py-1 rounded text-white"
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
        )}


        {page === "izin" && (
          <section>
            <h2 className="text-xl font-bold mb-4">📝 Verifikasi Izin / WFH</h2>

            <div className="bg-white p-6 rounded-lg shadow">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Nama</th>
                    <th className="p-2 border">Jenis</th>
                    <th className="p-2 border">Tanggal</th>
                    <th className="p-2 border">Alasan</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {izinData.map((i) => (
                    <tr key={i.id_izin}>
                      <td className="border p-2">{i.akun?.username}</td>
                      <td className="border p-2">{i.jenis_izin}</td>
                      <td className="border p-2">
                        {i.tanggal_mulai} → {i.tanggal_selesai}
                      </td>
                      <td className="border p-2">{i.alasan}</td>
                      <td className="border p-2">
                        <select
                          value={i.status_persetujuan}
                          onChange={async (e) => {
                            await axios.patch(`/api/admin/izin/${i.id_izin}`, {
                              status_persetujuan: e.target.value,
                              id_verifikator: localStorage.getItem("id_akun"),
                            });
                            fetchIzinList(); // refresh tabel
                          }}
                          className={`border p-2 rounded w-full ${i.status_persetujuan === "DISETUJUI"
                            ? "bg-green-100 text-green-700"
                            : i.status_persetujuan === "DITOLAK"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="DISETUJUI">DISETUJUI</option>
                          <option value="DITOLAK">DITOLAK</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-center gap-2 mt-4">
                <button
                  disabled={izinPage === 1}
                  onClick={() => setIzinPage(izinPage - 1)}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  ◀️ Previous
                </button>

                <span>Halaman {izinPage}</span>

                <button
                  disabled={izinData.length < izinLimit}
                  onClick={() => setIzinPage(izinPage + 1)}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Next ▶️
                </button>
              </div>

            </div>
          </section>
        )}




        {/* ---------------- REKAP & REWARD ---------------- */}

        {page === "rekap" && (
          <section>
            <h2 className="text-xl font-bold mb-4">🏅 Rekap Kedisiplinan & Reward</h2>
            <p className="text-gray-600 mb-4">
              Halaman ini berfungsi untuk menampilkan data tingkat kedisiplinan
              berdasarkan waktu kehadiran, keterlambatan, dan absensi tanpa
              keterangan. Sistem akan menghitung poin kedisiplinan otomatis
              sebagai dasar pemberian reward atau teguran.
            </p>
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-400">
              <p>📊 Belum ada data rekap ditampilkan.</p>
              <p className="text-sm mt-2">
                (Fitur filter tanggal, laporan bulanan, dan ekspor ke Excel/PDF akan ditambahkan nanti)
              </p>
            </div>

            {/* 💬 Komentar khusus halaman ini */}
            <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
              <p className="text-sm text-gray-700">
                💡 <strong>Catatan Khusus:</strong> Halaman ini digunakan oleh admin
                untuk melakukan <em>analisis performa kehadiran</em> karyawan.
                Di tahap pengembangan berikutnya, sistem akan menghitung skor
                kedisiplinan dan menghasilkan laporan digital yang bisa
                diekspor ke format Excel atau PDF sebagai dokumen resmi perusahaan.
              </p>
            </div>
          </section>
        )}
        {/* ---------------- Perusahaan ---------------- */}
        {page === "perusahaan" && (
          <section>
            <h2 className="text-xl font-bold mb-4">🏢 Kelola Data Perusahaan</h2>
            <p className="text-gray-600 mb-4">
              Admin dapat memperbarui lokasi kantor perusahaan dan radius presensi.
              ID perusahaan otomatis mengikuti akun login.
            </p>

            <div className="bg-white p-6 rounded-lg shadow w-full md:w-2/3">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await axios.put(`/api/admin/perusahaan/${id_perusahaan}`, {
                      alamat: perusahaan.alamat,
                      latitude: perusahaan.latitude,
                      longitude: perusahaan.longitude,
                      radius_m: perusahaan.radius_m,
                    });
                    Swal.fire("✅ Berhasil", "Data perusahaan berhasil diperbarui", "success");
                  } catch (err) {
                    console.error("❌ Gagal update perusahaan:", err);
                    Swal.fire("❌ Gagal", "Terjadi kesalahan saat memperbarui data", "error");
                  }
                }}
                className="space-y-4"
              >
                {/* ID Perusahaan */}
                <div>
                  <label className="block font-semibold mb-1">ID Perusahaan</label>
                  <input
                    type="text"
                    value={perusahaan.id_perusahaan || id_perusahaan || ""}
                    disabled
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>

                {/* Nama Perusahaan */}
                <div>
                  <label className="block font-semibold mb-1">Nama Perusahaan</label>
                  <input
                    type="text"
                    value={perusahaan.nama_perusahaan || ""}
                    disabled
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>

                {/* Paste link Google Maps */}
                <div>
                  <label className="block font-semibold mb-1">
                    Paste Link Google Maps
                  </label>
                  <input
                    type="text"
                    placeholder="Tempel link Google Maps di sini"
                    className="w-full border p-2 rounded"
                    onChange={async (e) => {
                      const input = e.target.value.trim();
                      let latitude = perusahaan.latitude;
                      let longitude = perusahaan.longitude;
                      let alamat = perusahaan.alamat;

                      if (input.includes("https://www.google.com/maps")) {
                        const atIndex = input.indexOf("@");
                        if (atIndex !== -1) {
                          const coords = input.substring(atIndex + 1).split(",");
                          latitude = coords[0];
                          longitude = coords[1];
                        }

                        // 🔹 Reverse geocoding gratis dari OpenStreetMap (tanpa API key)
                        try {
                          const res = await axios.get(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                          );
                          alamat = res.data.display_name;
                        } catch (err) {
                          console.error("❌ Gagal mendapatkan alamat dari Nominatim:", err);
                        }
                      }

                      setPerusahaan({
                        ...perusahaan,
                        alamat,
                        latitude,
                        longitude,
                      });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Contoh: https://www.google.com/maps/place/Nama Alamat/@-x.xxxxxxxx,xxx.xxxxxx,...
                  </p>
                </div>

                {/* Alamat Perusahaan (otomatis hasil geocoding, disable) */}
                <div>
                  <label className="block font-semibold mb-1">Alamat Perusahaan</label>
                  <textarea
                    value={perusahaan.alamat || ""}
                    disabled
                    className="w-full border p-2 rounded bg-gray-100"
                    rows="2"
                  />
                </div>

                {/* Latitude & Longitude */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Latitude</label>
                    <input
                      type="text"
                      value={perusahaan.latitude || ""}
                      disabled
                      className="w-full border p-2 rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Longitude</label>
                    <input
                      type="text"
                      value={perusahaan.longitude || ""}
                      disabled
                      className="w-full border p-2 rounded bg-gray-100"
                    />
                  </div>
                </div>

                {/* Radius */}
                <div>
                  <label className="block font-semibold mb-1">Radius Kantor (meter)</label>
                  <input
                    type="number"
                    value={perusahaan.radius_m || ""}
                    onChange={(e) =>
                      setPerusahaan({ ...perusahaan, radius_m: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>

                {/* Tombol Simpan */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    💾 Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

      </main>
    </div>
  );

}
