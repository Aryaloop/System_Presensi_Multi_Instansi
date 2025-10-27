import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

// 🔹 Komponen kecil tambahan agar rapi
function StatBox({ title, value, color }) {
  const colorClass = {
    indigo: "text-indigo-600",
    green: "text-green-600",
    blue: "text-blue-600",
  }[color] || "text-gray-600";

  return (
    <div className="bg-white p-6 shadow rounded-lg">
      <p className="text-gray-500">{title}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🧩 State umum
  const [page, setPage] = useState("home");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nama_perusahaan: "", alamat: "" });
  const [showFormAdmin, setShowFormAdmin] = useState(false);
  const [formAdmin, setFormAdmin] = useState({
    username: "",
    email: "",
    id_perusahaan: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [perusahaanPage, setPerusahaanPage] = useState(1);
  const perusahaanLimit = 10;

  const [adminPage, setAdminPage] = useState(1);
  const adminLimit = 10;


  // ✅ React Query ambil data
  const {
    data: perusahaanData,
    isLoading: loadingPerusahaan,
  } = useQuery({
    queryKey: ["perusahaan", perusahaanPage],
    queryFn: async () =>
      (await axios.get(`/api/superadmin/perusahaan?page=${perusahaanPage}&limit=${perusahaanLimit}`)).data,
  });

  const perusahaan = perusahaanData?.data || [];
  const perusahaanTotal = perusahaanData?.total || 0;


  const {
    data: adminData,
    isLoading: loadingAdmins,
  } = useQuery({
    queryKey: ["admins", adminPage],
    queryFn: async () =>
      (await axios.get(`/api/superadmin/admins?page=${adminPage}&limit=${adminLimit}`)).data,
  });

  const admins = adminData?.data || [];
  const adminTotal = adminData?.total || 0;


  // 🧩 Logout
  const handleLogout = () => {
    Swal.fire({
      title: "Keluar dari sistem?",
      text: "Anda akan kembali ke halaman login.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, logout",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/login");
        Swal.fire({
          icon: "success",
          title: "Logout berhasil!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  // 🧩 Form perusahaan
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddPerusahaan = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/superadmin/perusahaan", form);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["perusahaan"] });

      Swal.fire("Berhasil", "Perusahaan berhasil ditambahkan.", "success");
    } catch {
      Swal.fire("Gagal", "Tidak dapat menambahkan perusahaan.", "error");
    }
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditMode(true);
    setShowForm(true);
  };

  const handleUpdatePerusahaan = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/superadmin/perusahaan/${form.id_perusahaan}`, form);
      setShowForm(false);
      setEditMode(false);
      queryClient.invalidateQueries(["perusahaan"]);
      Swal.fire("Berhasil", "Perusahaan diperbarui.", "success");
    } catch {
      Swal.fire("Gagal", "Tidak dapat memperbarui perusahaan.", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Yakin ingin menghapus?",
      text: "Data perusahaan akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/superadmin/perusahaan/${id}`);
        queryClient.invalidateQueries(["perusahaan"]);
        Swal.fire("Terhapus!", "Perusahaan telah dihapus.", "success");
      } catch {
        Swal.fire("Gagal", "Tidak dapat menghapus perusahaan.", "error");
      }
    }
  };

  const handleSuspend = async (id, status) => {
    try {
      await axios.put(`/api/superadmin/suspend/${id}`, { status });
      queryClient.invalidateQueries(["perusahaan"]);
      Swal.fire(
        "Berhasil",
        status ? "Perusahaan diaktifkan!" : "Perusahaan disuspend!",
        "success"
      );
    } catch {
      Swal.fire("Gagal", "Tidak dapat mengubah status perusahaan.", "error");
    }
  };

  // 🧩 Form Admin
  const handleChangeAdmin = (e) =>
    setFormAdmin({ ...formAdmin, [e.target.name]: e.target.value });

  const handleEditAdmin = (admin) => {
    setFormAdmin(admin);
    setShowFormAdmin(true);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await axios.post("/api/superadmin/create-admin", formAdmin);
      Swal.fire("Berhasil", res.data.message || "Admin berhasil ditambahkan.", "success");
      queryClient.invalidateQueries({ queryKey: ["admins"] });

      setShowFormAdmin(false);
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal menambah admin.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEditAdmin = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.put(`/api/superadmin/admins/${formAdmin.id_akun}`, formAdmin);
      Swal.fire("Berhasil", "Admin diperbarui.", "success");
      setShowFormAdmin(false);
      setFormAdmin({ username: "", email: "", id_perusahaan: "" });
      queryClient.invalidateQueries(["admins"]);
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal memperbarui admin.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAdmin = async (id_akun) => {
    const result = await Swal.fire({
      title: "Yakin ingin menghapus admin ini?",
      text: "Data admin akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/superadmin/admins/${id_akun}`);
        queryClient.invalidateQueries(["admins"]);
        Swal.fire("Berhasil", "Admin dihapus!", "success");
      } catch {
        Swal.fire("Gagal", "Tidak dapat menghapus admin.", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Super Admin</h1>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded">
          Logout
        </button>
      </header>

      <nav className="bg-white shadow p-4 flex gap-4">
        {["home", "perusahaan", "admin"].map((item) => (
          <button
            key={item}
            onClick={() => setPage(item)}
            className={`px-4 py-2 rounded ${page === item ? "bg-indigo-600 text-white" : "bg-gray-100"
              }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </nav>

      <main className="p-6">
        {page === "home" && (
          <section>
            <h2 className="text-xl font-bold mb-4">Ringkasan Sistem</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatBox title="Total Perusahaan" value={(perusahaan || []).length} color="indigo" />
              <StatBox title="Total Admin" value={(admins || []).length} color="green" />
              <StatBox
                title="Akses Aktif"
                value={(perusahaan || []).filter((p) => p.status_aktif).length}
                color="blue"
              />
            </div>
          </section>
        )}

        {/* === Perusahaan === */}
        {page === "perusahaan" && (
          <section>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Data Perusahaan</h2>
              <button
                onClick={() => {
                  setEditMode(false);
                  setForm({ nama_perusahaan: "", alamat: "" });
                  setShowForm(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
              >
                + Tambah Perusahaan
              </button>
            </div>

            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                  <h3 className="font-bold mb-3">
                    {editMode ? "Edit Perusahaan" : "Tambah Perusahaan"}
                  </h3>
                  <form
                    onSubmit={editMode ? handleUpdatePerusahaan : handleAddPerusahaan}
                    className="space-y-3"
                  >
                    <input
                      name="nama_perusahaan"
                      value={form.nama_perusahaan}
                      onChange={handleChange}
                      placeholder="Nama Perusahaan"
                      className="w-full border p-2 rounded"
                      required
                    />
                    <input
                      name="alamat"
                      value={form.alamat}
                      onChange={handleChange}
                      placeholder="Alamat"
                      className="w-full border p-2 rounded"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-3 py-1 bg-gray-300 rounded"
                      >
                        Batal
                      </button>
                      <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">
                        {editMode ? "Update" : "Simpan"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loadingPerusahaan ? (
              <p>Memuat data perusahaan...</p>
            ) : (
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Nama</th>
                    <th className="p-2 border">Alamat</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(perusahaan || [])
                    .filter((p) => p.id_perusahaan !== "PRE010")
                    .map((p) => (
                      <tr key={p.id_perusahaan}>
                        <td className="border p-2">{p.id_perusahaan}</td>
                        <td className="border p-2">{p.nama_perusahaan}</td>
                        <td className="border p-2">{p.alamat}</td>
                        <td className="border p-2">
                          {p.status_aktif ? "Aktif" : "Nonaktif"}
                        </td>
                        <td className="border p-2 space-x-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id_perusahaan)}
                            className="bg-gray-500 text-white px-3 py-1 rounded"
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => handleSuspend(p.id_perusahaan, !p.status_aktif)}
                            className={`px-3 py-1 rounded ${p.status_aktif
                              ? "bg-red-500 text-white"
                              : "bg-green-500 text-white"
                              }`}
                          >
                            {p.status_aktif ? "Suspend" : "Aktifkan"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
            <div className="flex justify-center gap-2 mt-4">
              <button
                disabled={perusahaanPage === 1}
                onClick={() => setPerusahaanPage(perusahaanPage - 1)}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                ◀️ Prev
              </button>

              <span className="px-3 py-1">Halaman {perusahaanPage}</span>

              <button
                disabled={perusahaan.length < perusahaanLimit}
                onClick={() => setPerusahaanPage(perusahaanPage + 1)}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next ▶️
              </button>
            </div>


          </section>
        )}

        {/* === Admin === */}
        {page === "admin" && (
          <section>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Data Admin</h2>
              <button
                onClick={() => setShowFormAdmin(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
              >
                + Tambah Admin
              </button>
            </div>

            {showFormAdmin && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                  <h3 className="font-bold mb-3">
                    {formAdmin.id_akun ? "Edit Admin" : "Tambah Admin"}
                  </h3>
                  <form
                    onSubmit={formAdmin.id_akun ? handleSaveEditAdmin : handleAddAdmin}
                    className="space-y-3"
                  >
                    <input
                      name="username"
                      value={formAdmin.username}
                      onChange={handleChangeAdmin}
                      placeholder="Nama Admin"
                      className="w-full border p-2 rounded"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      value={formAdmin.email}
                      onChange={handleChangeAdmin}
                      placeholder="Email Admin"
                      className="w-full border p-2 rounded"
                      required
                    />
                    <input
                      name="id_perusahaan"
                      value={formAdmin.id_perusahaan}
                      onChange={handleChangeAdmin}
                      placeholder="ID Perusahaan"
                      className="w-full border p-2 rounded"
                      required
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowFormAdmin(false);
                          setFormAdmin({
                            username: "",
                            email: "",
                            id_perusahaan: "",
                          });
                        }}
                        className="px-3 py-1 bg-gray-300 rounded"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-3 py-1 text-white rounded ${isSaving
                          ? "bg-indigo-300 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                      >
                        {isSaving ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loadingAdmins ? (
              <p>Memuat data admin...</p>
            ) : (
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Nama</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Perusahaan</th>
                    <th className="p-2 border">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(admins || []).map((a) => (
                    <tr key={a.id_akun}>
                      <td className="border p-2">{a.username}</td>
                      <td className="border p-2">{a.email}</td>
                      <td className="border p-2">{a.id_perusahaan}</td>
                      <td className="border p-2 space-x-2">
                        <button
                          onClick={() => handleEditAdmin(a)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(a.id_akun)}
                          className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex justify-center gap-2 mt-4">
              <button
                disabled={adminPage === 1}
                onClick={() => setAdminPage(adminPage - 1)}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                ◀️ Prev
              </button>

              <span className="px-3 py-1">Halaman {adminPage}</span>

              <button
                disabled={admins.length < adminLimit}
                onClick={() => setAdminPage(adminPage + 1)}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next ▶️
              </button>
            </div>

          </section>
        )}
      </main>
    </div>
  );
}
