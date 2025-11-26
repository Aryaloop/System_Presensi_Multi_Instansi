// src/pages/UserSections/components/StatCards.jsx
import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

// Helper
const toLocalDate = (utcString) => {
  const date = new Date(utcString);
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

export default function StatCards() {
  const today = new Date();

  // 1. Ambil data Izin Summary
  const { data: izinData } = useQuery({
    queryKey: ["izinSummary"],
    queryFn: async () => (await axios.get(`/api/user/izin/summary`)).data,
  });

  // 2. Ambil data Kehadiran (hanya untuk bulan ini, untuk status hari ini)
  const { data: kehadiranData } = useQuery({
    queryKey: ["kehadiran", today.getMonth() + 1, today.getFullYear()],
    queryFn: async () => {
       const res = await axios.get(`/api/user/kehadiran?bulan=${today.getMonth() + 1}&tahun=${today.getFullYear()}`);
       return res.data.data || [];
    },
  });
  
  // 3. Ambil data Shift (untuk jam kerja)
  const { data: shiftData } = useQuery({
    queryKey: ["lokasiShift"],
    queryFn: async () => (await axios.get(`/api/user/lokasi-shift`)).data,
  });

  // Kalkulasi status hari ini
  const kehadiran = kehadiranData || [];
  const todayRec = kehadiran.find((d) => {
    const masuk = d.jam_masuk ? toLocalDate(d.jam_masuk) : null;
    return masuk && masuk.toDateString() === today.toDateString();
  });
  const attendanceStatus = todayRec?.status || "belum";
  const totalHadir = kehadiran.filter((k) => k.status === "HADIR").length;

  const izinPending = izinData?.pending || 0;
  const wfhBulanIni = izinData?.totalWFH || 0;
  const jamShift = shiftData?.shift;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Hari Ini */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500">Hari Ini</p>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">
            {attendanceStatus === "HADIR"
              ? "Hadir Tepat Waktu"
              : attendanceStatus === "TERLAMBAT"
              ? "Hadir Terlambat"
              : attendanceStatus === "WFH"
              ? "Work From Home"
              : attendanceStatus === "IZIN"
              ? "Izin"
              : "Belum Hadir"}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-md ${
              attendanceStatus === "HADIR"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
            {attendanceStatus === "HADIR" ? "✔" : "✕"}
          </span>
        </div>
        <p className="text-[11px] text-emerald-600 mt-1">
          {jamShift ? `${jamShift.jam_masuk} - ${jamShift.jam_pulang}` : "..."}
        </p>
      </div>

      {/* Bulan Ini */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500">Bulan Ini</p>
        <div className="mt-1 text-sm font-semibold text-gray-800">{totalHadir} Hari</div>
        <p className="text-[11px] text-gray-400 mt-1">Total Kehadiran</p>
      </div>

      {/* Izin Pending */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500">Izin Pending</p>
        <div className="mt-1 text-sm font-semibold text-gray-800">{izinPending}</div>
        <p className="text-[11px] text-gray-400 mt-1">Menunggu Approval</p>
      </div>

      {/* WFH Bulan Ini */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500">WFH Bulan Ini</p>
        <div className="mt-1 text-sm font-semibold text-gray-800">{wfhBulanIni} Hari</div>
        <p className="text-[11px] text-gray-400 mt-1">Work From Home</p>
      </div>
    </div>
  );
}