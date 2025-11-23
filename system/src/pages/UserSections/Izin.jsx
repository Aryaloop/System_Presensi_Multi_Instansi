// src/pages/UserSections/Izin.jsx
import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Izin() {
  const idAkun = localStorage.getItem("id_akun");
  
  // ===========================================================================
  // STATE LOKAL (Form)
  // ===========================================================================
  const [loading, setLoading] = useState(false);
  const [jenis_izin, setJenisIzin] = useState("");
  const [tanggal_mulai, setTanggalMulai] = useState("");
  const [tanggal_selesai, setTanggalSelesai] = useState("");
  const [alasan, setAlasan] = useState("");
  const [keterangan, setKeterangan] = useState("");

  // ===========================================================================
  // HANDLER LOKAL (Submit)
  // ===========================================================================
  const handleSubmitIzin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("/api/user/izin", {
        id_akun: idAkun,
        tanggal_mulai,
        tanggal_selesai,
        jenis_izin,
        alasan,
        keterangan,
      });
      Swal.fire({ icon: "success", title: res.data.message || "Pengajuan terkirim", timer: 1500, showConfirmButton: false });
      
      // Reset form
      setJenisIzin("");
      setTanggalMulai("");
      setTanggalSelesai("");
      setAlasan("");
      setKeterangan("");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal mengirim izin." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-5 max-w-2xl">
      <h2 className="text-base font-semibold mb-4">📝 Ajukan Izin / WFH</h2>
      <form onSubmit={handleSubmitIzin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Jenis Izin</label>
          <select value={jenis_izin} onChange={(e) => setJenisIzin(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">-- Pilih Jenis Izin --</option>
            <option value="IZIN">Izin</option>
            <option value="WFH">Work From Home</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
            <input type="date" value={tanggal_mulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
            <input type="date" value={tanggal_selesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Alasan</label>
          <input type="text" value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Contoh: Sakit, acara keluarga, dsb" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Keterangan Tambahan</label>
          <textarea rows="3" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2 text-sm font-medium disabled:opacity-50">
          {loading ? "⏳ Mengirim..." : "Kirim Pengajuan"}
        </button>
      </form>
    </div>
  );
}