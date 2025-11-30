import React, { useState, useEffect } from "react"; // 1. Tambah useEffect
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  // 2. Ubah Judul Tab
  useEffect(() => {
    document.title = "Reset Password - PresensiKu";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Password Terlalu Pendek",
        text: "Password minimal 8 karakter.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    if (password !== confirm) {
      Swal.fire({
        icon: "error",
        title: "Konfirmasi Tidak Cocok",
        text: "Ulangi dan pastikan password sama.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    try {
      const res = await axios.post(`/api/reset-password/${token}`, { password });
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: res.data.message || "Password telah direset",
        confirmButtonColor: "#4f46e5",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Reset Password",
        text: err.response?.data?.message || "Coba lagi nanti.",
        confirmButtonColor: "#4f46e5",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white shadow-xl rounded-xl p-8 w-96 text-center">
        <h2 className="text-2xl font-bold text-indigo-600 mb-4">Atur Password Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password baru"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Konfirmasi password"
            className="input-field"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button type="submit" className="w-full btn-primary">
            Simpan Password
          </button>
        </form>
      </div>
    </div>
  );
}