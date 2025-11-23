// src/pages/AdminSections/KaryawanManager.jsx
import React from "react";

export default function DashboardHome({ data, handleRefresh, ...props }) {
  return (
    <section>
      <h2 className="text-xl font-bold mb-4">🏠 Ringkasan Sistem</h2>
      <p className="text-gray-600 mb-4">
        Halaman utama admin menampilkan ringkasan aktivitas perusahaan
        dan statistik singkat sistem kehadiran.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Karyawan</p>
          <p className="text-3xl font-bold text-indigo-600">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Presensi Hari Ini</p>
          <p className="text-3xl font-bold text-green-600">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Izin / WFH Aktif</p>
          <p className="text-3xl font-bold text-yellow-600">--</p>
        </div>
      </div>
    </section>
  );
}
