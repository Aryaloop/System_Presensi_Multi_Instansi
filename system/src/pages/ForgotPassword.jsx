// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // ✅ SweetAlert2

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Email belum diisi",
        text: "Silakan masukkan email terdaftar Anda.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/forgot-password", { email });

      await Swal.fire({
        icon: "success",
        title: "Email Terkirim!",
        text:
          res.data?.message ||
          "Tautan reset password telah dikirim ke email Anda.",
        showConfirmButton: false,
        timer: 2000,
      });

      // Opsional: arahkan kembali ke login setelah sukses
      navigate("/login");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Terjadi kesalahan saat mengirim tautan reset password.";

      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim",
        text: msg,
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center px-4">
      <div className="relative bg-white shadow-xl rounded-2xl w-full max-w-md p-8">
        {/* Tombol close */}
        <button
          onClick={() => navigate(-1)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Ikon kunci */}
        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25V9H6a2.25 2.25 0 0 0-2.25 2.25v7.5A2.25 2.25 0 0 0 6 21h12a2.25 2.25 0 0 0 2.25-2.25v-7.5A2.25 2.25 0 0 0 18 9h-.75V6.75A5.25 5.25 0 0 0 12 1.5Zm-3.75 7.5V6.75a3.75 3.75 0 0 1 7.5 0V9H8.25Z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-800 text-center">Lupa Password?</h2>
        <p className="text-sm text-gray-500 text-center mt-1 mb-6">
          Jangan khawatir! Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M1.5 6.75A2.25 2.25 0 0 1 3.75 4.5h16.5a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 20.25 19.5H3.75A2.25 2.25 0 0 1 1.5 17.25V6.75Zm2.04-.75 8.21 6.157a.75.75 0 0 0 .9 0L20.86 6H3.54Z" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                placeholder="masukkan@email.anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium shadow hover:from-indigo-700 hover:to-blue-600 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Mengirim..." : (
              <>
                Kirim Link Reset Password
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18m0 0-6-6m6 6-6 6" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-3 text-center">
          <a
            href="/login"
            className="text-sm text-indigo-600 hover:underline font-medium flex items-center justify-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Login
          </a>
        </div>
      </div>
    </div>
  );
}
