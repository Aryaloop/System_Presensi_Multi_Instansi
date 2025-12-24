// frontend/src/pages/Verify.jsx
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export default function Verify() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Memproses Verifikasi...";

    const processVerify = async () => {
      try {
        // Panggil API Backend
        const res = await axios.get(`/api/verify/${token}`);

        if (res.data.success) {
          // SUKSES
          await Swal.fire({
            icon: "success",
            title: "Verifikasi Berhasil!",
            text: "Akun Anda telah aktif. Mengalihkan ke halaman login...",
            timer: 3000,
            showConfirmButton: false,
          });
          navigate("/login");
        } else {
          throw new Error(res.data.message);
        }
      } catch (err) {
        // GAGAL
        Swal.fire({
          icon: "error",
          title: "Verifikasi Gagal",
          text: err.response?.data?.message || "Token tidak valid atau kadaluwarsa.",
          confirmButtonText: "Ke Halaman Login",
        }).then(() => {
          navigate("/login");
        });
      }
    };

    processVerify();
  }, [token, navigate]);

  // Tampilan Loading saat proses berjalan
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Memverifikasi Akun...</h2>
        <p className="text-gray-500">Mohon tunggu sebentar.</p>
      </div>
    </div>
  );
}