import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
// import ReCAPTCHA from "react-google-recaptcha";
import Swal from "sweetalert2"; // ✅ Import SweetAlert2

// const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", captcha: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  // const handleCaptcha = (token) => setForm((prev) => ({ ...prev, captcha: token }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/login", { ...form, remember });
      const { role, id_jabatan } = res.data || {};

      // ✅ Simpan data login ke localStorage
      localStorage.setItem("id_akun", res.data.id_akun);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("id_jabatan", res.data.id_jabatan);
      localStorage.setItem("id_perusahaan", res.data.id_perusahaan); // 🟢 penting

      await Swal.fire({
        icon: "success",
        title: "Login Berhasil!",
        text: "Selamat datang di sistem PresensiKu.",
        showConfirmButton: false,
        timer: 1500,
      });

      // 🔀 Arahkan sesuai role
      if (id_jabatan === "SPRADM" || role === "SUPERADMIN") {
        navigate("/dashboard_super_admin");
      } else if (id_jabatan === "ADMIN") {
        navigate("/dashboard_admin");
      } else {
        navigate("/dashboard_user");
      }
    }
    catch (err) {
      console.error("Error dari server:", err.response?.data);
      const msg = err.response?.data?.message || "Login gagal atau backend belum berjalan";
      setError(msg);

      // ❌ Tampilkan notifikasi error
      Swal.fire({
        icon: "error",
        title: "Login Gagal!",
        text: msg,
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 flex items-stretch justify-center">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-10 p-4 lg:p-6">
        {/* LEFT: Card */}
        <div className="flex items-center justify-center order-2 lg:order-1">
          <div className="bg-white/95 backdrop-blur shadow-xl rounded-2xl w-full max-w-md p-6 sm:p-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 8H4v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9Zm-1-5H5a1 1 0 0 0-1 1v2h16V6a1 1 0 0 0-1-1Z" />
              </svg>
            </div>

            <h1 className="text-center text-2xl font-extrabold mt-3">PresensiKu</h1>
            <p className="text-center text-xs text-gray-500">Sistem Presensi Digital Terpercaya</p>

            <div className="mt-6">
              <h2 className="text-gray-900 font-semibold">Selamat Datang!</h2>
              <p className="text-sm text-gray-500 mt-1">Silakan login untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M1.5 6.75A2.25 2.25 0 0 1 3.75 4.5h16.5a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 20.25 19.5H3.75A2.25 2.25 0 0 1 1.5 17.25V6.75Zm2.04-.75 8.21 6.157a.75.75 0 0 0 .9 0L20.86 6H3.54Z" /></svg>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="masukkan@email.com"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25V9H6a2.25 2.25 0 0 0-2.25 2.25v7.5A2.25 2.25 0 0 0 6 21h12a2.25 2.25 0 0 0 2.25-2.25v-7.5A2.25 2.25 0 0 0 18 9h-.75V6.75A5.25 5.25 0 0 0 12 1.5Zm-3.75 7.5V6.75a3.75 3.75 0 0 1 7.5 0V9H8.25Z" /></svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 select-none">
                  <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="text-gray-600">Ingat saya</span>
                </label>
                <Link to="/forgot-password" className="text-indigo-600 hover:underline">Lupa password?</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>

              {/* <div className="pt-1">
                <ReCAPTCHA sitekey={SITE_KEY} onChange={handleCaptcha} />
              </div> */}
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Belum punya akun?{" "}
              <a href="/register" className="text-indigo-600 hover:underline font-medium">Daftar sekarang</a>
            </p>
          </div>
        </div>

        {/* RIGHT: Marketing Panel */}
        <div className="relative rounded-2xl overflow-hidden order-1 lg:order-2 min-h-[300px] lg:min-h-[unset]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-900" />
          <div className="relative h-full w-full flex items-center justify-center px-8 py-12">
            <div className="max-w-md text-white">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-white/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6"><path strokeWidth="1.8" d="M7 3v2m10-2v2M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm0 4h14" /></svg>
              </div>

              <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold leading-tight">Kelola Presensi dengan
                <span className="block">Mudah</span>
              </h2>
              <p className="mt-3 text-sm text-white/80 leading-relaxed">
                Sistem presensi digital yang membantu perusahaan mengelola kehadiran karyawan secara efisien dan akurat
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Presensi real-time dengan GPS",
                  "Laporan kehadiran otomatis",
                  "Dashboard analitik lengkap",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15 border border-white/20">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M9.53 16.28 4.75 11.5l1.5-1.5 3.28 3.28 7.22-7.22 1.5 1.5-8.72 8.72Z" /></svg>
                    </span>
                    <span className="text-white/90">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
