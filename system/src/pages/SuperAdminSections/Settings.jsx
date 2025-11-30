import React from "react";

export default function Settings() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800">Pengaturan Sistem</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-semibold text-lg mb-2">Konfigurasi Global</h3>
        <p className="text-gray-500 text-sm mb-4">
          Pengaturan global untuk aplikasi PresensiKu (Waktu Server, Backup Database, dll).
        </p>
        
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm border border-yellow-100">
          🚧 Fitur ini sedang dalam tahap pengembangan.
        </div>
      </div>
    </div>
  );
}