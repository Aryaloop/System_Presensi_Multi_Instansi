// src/pages/AdminSections/KaryawanManager.jsx
import React from "react";

export default function RekapReward({ data, handleRefresh, ...props }) {
  return (
    <section>
      <h2 className="text-xl font-bold mb-4">🏅 Rekap Kedisiplinan & Reward</h2>
      <p className="text-gray-600 mb-4">
        Halaman ini berfungsi untuk menampilkan data tingkat kedisiplinan
        berdasarkan waktu kehadiran, keterlambatan, dan absensi tanpa
        keterangan. Sistem akan menghitung poin kedisiplinan otomatis
        sebagai dasar pemberian reward atau teguran.
      </p>
      <div className="bg-white p-8 rounded-lg shadow text-center text-gray-400">
        <p>📊 Belum ada data rekap ditampilkan.</p>
        <p className="text-sm mt-2">
          (Fitur filter tanggal, laporan bulanan, dan ekspor ke Excel/PDF akan ditambahkan nanti)
        </p>
      </div>

      {/* 💬 Komentar khusus halaman ini */}
      <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
        <p className="text-sm text-gray-700">
          💡 <strong>Catatan Khusus:</strong> Halaman ini digunakan oleh admin
          untuk melakukan <em>analisis performa kehadiran</em> karyawan.
          Di tahap pengembangan berikutnya, sistem akan menghitung skor
          kedisiplinan dan menghasilkan laporan digital yang bisa
          diekspor ke format Excel atau PDF sebagai dokumen resmi perusahaan.
        </p>
      </div>
    </section>
  );
}
