import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function WaitingVerify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);

  // 🧭 Hitung ulang sisa waktu dari localStorage
  useEffect(() => {
    const savedEndTime = localStorage.getItem("verify_end_time");
    let endTime = savedEndTime ? parseInt(savedEndTime, 10) : Date.now() + 180000 ; // 3 menit 180000

    if (!savedEndTime) {
      localStorage.setItem("verify_end_time", endTime);
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setCountdown(remaining);

      // Jika waktu habis
      if (remaining <= 0) {
        clearInterval(interval);
        localStorage.removeItem("verify_end_time");
        alert("⏰ Waktu verifikasi habis. Akun kamu akan dihapus otomatis.");
        navigate("/register");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  // 🔄 Cek status verifikasi tiap 5 detik
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/check-verification/${token}`);
        if (res.data.verified) {
          clearInterval(interval);
          localStorage.removeItem("verify_end_time"); // hapus timer saat sudah verif
          alert("✅ Akun kamu sudah diverifikasi! Silakan login.");
          navigate("/login");
        }
      } catch (err) {
        console.error("Gagal cek status verifikasi:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, navigate]);

  // 📩 Kirim ulang email verifikasi
  const handleResend = async () => {
    try {
      setResendDisabled(true);
      await axios.post("/api/resend-verification", { token });
      alert("Email verifikasi telah dikirim ulang ke inbox kamu.");
      setTimeout(() => setResendDisabled(false), 60000);
    } catch (err) {
      console.error("Gagal kirim ulang email:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-indigo-600 mb-2">Menunggu Verifikasi</h2>
        <p className="mb-4">Silakan cek email Anda untuk tautan verifikasi.</p>
        <p className="text-gray-600 mb-4">
          ⏳ Waktu tersisa: <b>{countdown}</b> detik
        </p>
        <button
          onClick={handleResend}
          disabled={resendDisabled}
          className={`btn-primary ${resendDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Kirim Ulang Email Verifikasi
        </button>
      </div>
    </div>
  );
}
