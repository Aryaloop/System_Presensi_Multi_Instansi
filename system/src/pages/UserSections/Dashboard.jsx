// src/pages/UserSections/Dashboard.jsx
import React from "react";

// 1. Impor komponen cerdas
import StatCards from "./components/StatCards";
import CardAbsenGPS from "./components/CardAbsenGPS";
import WidgetKalender from "./components/WidgetKalender";

// Komponen 'bodoh' bisa didefinisikan di sini atau impor
const CardAjukanIzin = ({ setPage }) => (
  <div className="bg-white rounded-xl border">
    <div className="p-4 border-b font-semibold">Ajukan Izin / WFH</div>
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {["Izin Sakit", "Cuti", "Dinas Luar", "Work From Home"].map((t, i) => (
        <div key={i}
          className="rounded-xl border-2 border-dashed text-center p-6 text-gray-500 hover:border-indigo-300 cursor-pointer"
          onClick={() => setPage("izin")} // Navigasi via props
        >
          <div className="text-3xl mb-2">🏷️</div>
          <div className="text-sm font-medium">{t}</div>
        </div>
      ))}
    </div>
  </div>
);

const WidgetAktivitas = () => (
  <div className="bg-white rounded-xl border p-4">
    <div className="font-semibold mb-2">Aktivitas Terbaru</div>
    <ul className="space-y-3 text-sm">
      {[
        { t: "Absen Masuk", s: "08:00 WIB", c: "text-emerald-600" },
        { t: "Izin WFH Disetujui", s: "Kemarin, 14:32 WIB", c: "text-blue-600" },
        { t: "Pengajuan Cuti", s: "2 hari lalu, 10:15 WIB", c: "text-gray-600" },
      ].map((i, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <span
            className={`mt-1 inline-flex w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-500" : "bg-gray-300"
              }`}
          />
          <div>
            <div className={`font-medium ${i.c}`}>{i.t}</div>
            <div className="text-xs text-gray-500">{i.s}</div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export default function Dashboard({ setPage }) {
  return (
    <>
      {/* 2. Susun komponen cerdas */}
      <StatCards />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <CardAbsenGPS />
          <CardAjukanIzin setPage={setPage} />
        </div>
        <div className="space-y-6">
          <WidgetKalender />
          <WidgetAktivitas />
        </div>
      </div>
    </>
  );
}