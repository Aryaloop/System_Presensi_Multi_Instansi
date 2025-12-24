// src/pages/AdminSections/CreateSubAdmin.jsx
import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { CheckCircle, XCircle, UserPlus } from "lucide-react";

export default function CreateSubAdmin() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    role: "",
    departemen: "",
  });
  const [loading, setLoading] = useState(false);

  const canSubmit = form.username.trim() !== "" && form.email.trim() !== "" && form.role.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      Swal.fire("Lengkapi form", "Mohon lengkapi username, email, dan role.", "warning");
      return;
    }

    setLoading(true);
    try {
      // Tetap gunakan endpoint backend yang sama (tidak diubah)
      await axios.post("/api/admin/create-subadmin", form);

      Swal.fire("Berhasil", "Akun Sub Admin berhasil dibuat & email terkirim.", "success");
      setForm({ username: "", email: "", role: "", departemen: "" });
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form Card (9 cols on lg) */}
        <div className="lg:col-span-8">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Tambah Sub Admin</h1>
            <p className="text-sm text-gray-600 mt-1">
              Sub Admin akan memiliki akses untuk mengelola karyawan, presensi, dan shift pada perusahaan ini, namun tidak dapat membuat Sub Admin baru.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="text-sm text-gray-700 font-medium">Informasi Sub Admin</div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Contoh: HR Manager"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Username akan digunakan untuk login ke sistem</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Aktif <span className="text-red-500">*</span></label>
              <input
                type="email"
                placeholder="email@perusahaan.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Password akan digenerate otomatis dan dikirim ke email ini.</p>
            </div>

            {/* Role & Departemen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role Sub Admin <span className="text-red-500">*</span></label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                  required
                >
                  <option value="">Pilih Role</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR">HR</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="STAFF">Staff</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Role menentukan tingkat akses Sub Admin.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Departemen (Opsional)</label>
                <select
                  value={form.departemen}
                  onChange={(e) => setForm({ ...form, departemen: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                >
                  <option value="">Pilih Departemen</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="FINANCE">Finance</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Departemen membantu pembatasan akses (opsional).</p>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  // reset / batal -> go back logic could be added here, for now clear form
                  setForm({ username: "", email: "", role: "", departemen: "" });
                }}
                className="px-4 py-2 rounded-lg border text-sm bg-white hover:bg-gray-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${(!canSubmit || loading) ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {loading ? "Memproses..." : "Buat Akun Sub Admin"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Access panel (4 cols on lg) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded bg-indigo-50 text-indigo-600">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Hak Akses Sub Admin</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Hal-hal yang bisa dan tidak bisa dilakukan Sub Admin.</p>
                </div>
              </div>

              <ul className="space-y-3 mt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">Mengelola Karyawan</div>
                    <div className="text-xs text-gray-500">Tambah, edit, dan hapus data karyawan.</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">Mengelola Presensi</div>
                    <div className="text-xs text-gray-500">Melihat & mengkoreksi data presensi.</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">Mengelola Shift</div>
                    <div className="text-xs text-gray-500">Atur jadwal dan shift karyawan.</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <XCircle className="text-red-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">Membuat Sub Admin</div>
                    <div className="text-xs text-gray-500">Tidak dapat membuat akun Sub Admin baru.</div>
                  </div>
                </li>
              </ul>

              <div className="mt-6 text-xs text-gray-500">
                <p><span className="font-semibold text-gray-700">Catatan:</span> Sub Admin hanya punya akses pada perusahaan tempat akun ini dibuat.</p>
              </div>
            </div>

            {/* Small help card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mt-4 text-xs text-gray-600">
              <div className="font-medium text-gray-800 mb-1">Tips</div>
              <p>- Pastikan email aktif supaya password otomatis terkirim.</p>
              <p className="mt-2">- Role menentukan level akses. Pilih sesuai tanggung jawab.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
