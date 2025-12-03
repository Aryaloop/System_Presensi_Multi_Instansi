import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // Gunakan Swal biar cantik

export default function WaitingVerify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [isExpired, setIsExpired] = useState(false); // State baru untuk cek kadaluwarsa

  // 🧭 1. Hitung Mundur & Cek Expired
  useEffect(() => {
    // Ambil waktu target dari localStorage atau set 3 menit dari sekarang
    const savedEndTime = localStorage.getItem("verify_end_time");
    let endTime = savedEndTime ? parseInt(savedEndTime, 10) : Date.now() + 3 * 60 * 1000;

    if (!savedEndTime) {
      localStorage.setItem("verify_end_time", endTime);
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setCountdown(remaining);

      // 🛑 JIKA WAKTU HABIS
      if (remaining <= 0) {
        clearInterval(interval);
        localStorage.removeItem("verify_end_time");
        setIsExpired(true); // Set status expired
        
        // Tampilkan pesan & lempar ke register
        Swal.fire({
          icon: "error",
          title: "Waktu Habis!",
          text: "Batas waktu verifikasi 3 menit telah berakhir. Data Anda dihapus demi keamanan. Silakan daftar ulang.",
          confirmButtonColor: "#4f46e5",
          confirmButtonText: "Daftar Ulang",
          allowOutsideClick: false
        }).then(() => {
          navigate("/register");
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  // 🔄 2. Auto Check Status (Polling)
  useEffect(() => {
    if (isExpired) return; // Jangan cek jika sudah expired

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/check-verification/${token}`);
        if (res.data.verified) {
          clearInterval(interval);
          localStorage.removeItem("verify_end_time");
          
          await Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Akun Anda telah terverifikasi.",
            timer: 1500,
            showConfirmButton: false
          });
          
          navigate("/login");
        }
      } catch (err) {
        // Silent error (mungkin token sudah dihapus server)
        console.log("Waiting verification..."); 
      }
    }, 3000); // Cek tiap 3 detik

    return () => clearInterval(interval);
  }, [token, navigate, isExpired]);

  // 📩 3. Handle Kirim Ulang
  const handleResend = async () => {
    // Cegah klik jika expired
    if (isExpired) return;

    try {
      setResendDisabled(true);
      await axios.post("/api/resend-verification", { token }); // Pastikan backend terima { token } atau logic cari email by token
      
      Swal.fire({
        icon: "success",
        title: "Terkirim",
        text: "Link verifikasi baru telah dikirim ke email Anda.",
        confirmButtonColor: "#4f46e5",
      });

      // Disable tombol selama 60 detik agar tidak spam
      setTimeout(() => setResendDisabled(false), 60000);
    } catch (err) {
      console.error("Gagal resend:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal mengirim ulang email.",
      });
      setResendDisabled(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full animate-fadeIn">
        
        {/* Icon Amplop */}
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Cek Email Anda</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Kami telah mengirimkan tautan verifikasi. Silakan cek kotak masuk atau folder spam Anda.
        </p>

        {/* Timer */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
          <p className="text-orange-700 text-sm font-medium flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
            </svg>
            Sisa Waktu: <span className="text-lg font-bold">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</span>
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={resendDisabled || isExpired}
            className={`w-full py-2.5 px-4 rounded-lg font-medium transition text-sm ${
              resendDisabled || isExpired
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
            }`}
          >
            {resendDisabled ? "Tunggu sebentar..." : "Kirim Ulang Email"}
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            className="text-gray-500 hover:text-indigo-600 text-sm font-medium transition"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
}