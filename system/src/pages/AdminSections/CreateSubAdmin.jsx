import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function CreateSubAdmin() {
  const [form, setForm] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sesuaikan URL dengan route backend Anda
      await axios.post("/api/admin/create-subadmin", form);
      
      Swal.fire("Berhasil", "Akun Sub Admin berhasil dibuat & email terkirim.", "success");
      setForm({ username: "", email: "" }); // Reset form
    } catch (error) {
      Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Sub Admin</h2>
      <p className="text-sm text-gray-600 mb-6">
        Sub Admin akan memiliki akses untuk mengelola karyawan, presensi, dan shift 
        pada perusahaan ini, namun tidak dapat membuat Sub Admin baru.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            required
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Contoh: HR Manager"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Aktif</label>
          <input
            type="email"
            required
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="email@perusahaan.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">Password akan digenerate otomatis dan dikirim ke email ini.</p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 text-white font-semibold rounded-lg transition 
              ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {loading ? "Memproses..." : "Buat Akun Sub Admin"}
          </button>
        </div>
      </form>
    </div>
  );
}