// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; // ✅ Tambahkan SweetAlert2

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    id_perusahaan: "",
    password: "",
    confirmPassword: "",
    id_jabatan: "USER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Password Tidak Cocok",
        text: "Pastikan password dan konfirmasi password sama.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    if (form.password.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Password Terlalu Pendek",
        text: "Password minimal 8 karakter.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = form;
      const res = await axios.post("/api/register", submitData);

      // ✅ Notifikasi sukses
      await Swal.fire({
        icon: "success",
        title: "Registrasi Berhasil!",
        text: "Silakan verifikasi email kamu dalam 3 menit.",
        showConfirmButton: false,
        timer: 2000,
      });

      navigate(`/waiting/${res.data.token_verifikasi}`);
    } catch (err) {
      console.error("❌ Error registrasi:", err.response?.data);
      const msg = err.response?.data?.message || "Registrasi gagal, backend belum berjalan";

      // ❌ Notifikasi gagal
      Swal.fire({
        icon: "error",
        title: "Registrasi Gagal!",
        text: msg,
        confirmButtonColor: "#4f46e5",
      });

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl shadow-xl bg-white overflow-hidden">
        {/* Header gradient dengan ikon */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M15 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-3 7c3.866 0 7 2.239 7 5v1H2v-1c0-2.761 3.134-5 7-5h3Zm6-8h-1V6a1 1 0 1 0-2 0v1h-1a1 1 0 1 0 0 2h1v1a1 1 0 1 0 2 0V9h1a1 1 0 1 0 0-2Z"/>
            </svg>
          </div>
          <h1 className="text-white font-bold text-xl mt-3">Daftar Akun Baru</h1>
          <p className="text-white/80 text-xs">Lengkapi form dibawah untuk membuat akun</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nama Lengkap */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Nama Lengkap<span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/>
                </svg>
              </span>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={form.username}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email<span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M1.5 6.75A2.25 2.25 0 0 1 3.75 4.5h16.5a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 20.25 19.5H3.75A2.25 2.25 0 0 1 1.5 17.25V6.75Zm2.04-.75 8.21 6.157a.75.75 0 0 0 .9 0L20.86 6H3.54Z"/>
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="contoh@email.com"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* ID Perusahaan */}
          <div>
            <label htmlFor="id_perusahaan" className="block text-sm font-medium text-gray-700">
              ID Perusahaan<span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3 4a2 2 0 0 1 2-2h6v6h8v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm12 2V2l6 6h-6Z"/>
                </svg>
              </span>
              <input
                id="id_perusahaan"
                name="id_perusahaan"
                type="text"
                placeholder="ID Perusahaan"
                value={form.id_perusahaan}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password<span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25V9H6a2.25 2.25 0 0 0-2.25 2.25v7.5A2.25 2.25 0 0 0 6 21h12a2.25 2.25 0 0 0 2.25-2.25v-7.5A2.25 2.25 0 0 0 18 9h-.75V6.75A5.25 5.25 0 0 0 12 1.5Zm-3.75 7.5V6.75a3.75 3.75 0 0 1 7.5 0V9H8.25Z"/>
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Konfirmasi Password<span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25V9H6a2.25 2.25 0 0 0-2.25 2.25v7.5A2.25 2.25 0 0 0 6 21h12a2.25 2.25 0 0 0 2.25-2.25v-7.5A2.25 2.25 0 0 0 18 9h-.75V6.75A5.25 5.25 0 0 0 12 1.5Zm-3.75 7.5V6.75a3.75 3.75 0 0 1 7.5 0V9H8.25Z"/>
                </svg>
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold shadow hover:from-indigo-700 hover:to-blue-600 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <p className="text-center text-sm text-gray-600">
            Sudah punya akun?{" "}
            <a href="/login" className="text-indigo-600 hover:underline font-medium">
              Masuk disini
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
