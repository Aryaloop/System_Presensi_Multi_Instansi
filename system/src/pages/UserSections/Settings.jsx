// src/pages/UserSections/Settings.jsx
import React from "react";

export default function Settings({ user }) {
  return (
    <div className="bg-white rounded-xl border p-4 max-w-xl">
      <div className="font-semibold mb-4">Profil</div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center">
          <div className="w-32 text-gray-500">Nama</div>
          <div className="font-medium">{user.nama}</div>
        </div>
        <div className="flex items-center">
          <div className="w-32 text-gray-500">Email</div>
          <div>{user.email || "-"}</div>
        </div>
        <div className="flex items-center">
          <div className="w-32 text-gray-500">Jabatan</div>
          <div>{user.jabatan || "Karyawan"}</div>
        </div>
      </div>
    </div>
  );
}