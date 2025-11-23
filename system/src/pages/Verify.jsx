import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Verify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("🔄 Memverifikasi akun...");

  useEffect(() => {
    const verifyAccount = async () => {
      setStatus("🔄 Memverifikasi akun...");
      await new Promise((r) => setTimeout(r, 500)); // jeda 0.5 detik
      try {
        const res = await axios.get(`/api/verify/${token}`);
        if (res.data.success) {
          setStatus(res.data.message);
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setStatus(res.data.message || "❌ Token tidak valid atau sudah digunakan.");
        }
      } catch (err) {
        console.error("Verifikasi error:", err.response ? err.response.data : err.message);
        setStatus("❌ Gagal memverifikasi akun. Token mungkin sudah kedaluwarsa.");
      }
    };
    verifyAccount();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="bg-white shadow-xl rounded-xl p-8 w-96 text-center">
        <h2 className="text-2xl font-bold text-indigo-600 mb-4">Verifikasi Akun</h2>
        <p className="text-gray-700">{status}</p>
      </div>
    </div>
  );
}
