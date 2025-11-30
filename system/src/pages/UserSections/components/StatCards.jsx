// src/pages/UserSections/components/StatCards.jsx
import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

// Helper Date
const toLocalDate = (utcString) => {
  const date = new Date(utcString);
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

// Komponen Kartu Reusable yang lebih refined
const CardItem = ({ title, value, subtext, icon, colorInfo, isLoading }) => {
  const { bg, text, ring } = colorInfo;

  return (
    <div className="relative bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden">
      {/* Background Decor (Circle) */}
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 ${bg} group-hover:opacity-15 transition-all duration-500`} />
      
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
          <div className="mb-1">
            {isLoading ? (
              <div className="h-7 w-20 bg-gray-200 animate-pulse rounded-md"></div>
            ) : (
              <h3 className="text-xl font-bold text-gray-900 truncate">{value}</h3>
            )}
          </div>
          <p className={`text-xs font-medium ${text} truncate`}>
            {subtext}
          </p>
        </div>
        
        <div className={`p-2.5 rounded-lg ml-3 flex-shrink-0 ${bg} ${text} shadow-sm ring-1 ${ring}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function StatCards() {
  const today = new Date();

  // 1. Ambil data Izin
  const { data: izinData, isLoading: loadIzin } = useQuery({
    queryKey: ["izinSummary"],
    queryFn: async () => (await axios.get(`/api/user/izin/summary`)).data,
  });

  // 2. Ambil data Kehadiran
  const { data: kehadiranData, isLoading: loadHadir } = useQuery({
    queryKey: ["kehadiran", today.getMonth() + 1, today.getFullYear()],
    queryFn: async () => {
       const res = await axios.get(`/api/user/kehadiran?bulan=${today.getMonth() + 1}&tahun=${today.getFullYear()}`);
       return res.data.data || [];
    },
  });
  
  // 3. Ambil Shift
  const { data: shiftData, isLoading: loadShift } = useQuery({
    queryKey: ["lokasiShift"],
    queryFn: async () => (await axios.get(`/api/user/lokasi-shift`)).data,
  });

  // Logic Kalkulasi
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

  // Tentukan teks status hari ini
  let statusText = "Belum Absen";
  let statusColor = { bg: "bg-gray-50", text: "text-gray-500", ring: "ring-gray-100" };

  if (attendanceStatus === "HADIR") {
    statusText = "Hadir";
    statusColor = { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" };
  } else if (attendanceStatus === "TERLAMBAT") {
    statusText = "Terlambat";
    statusColor = { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-100" };
  } else if (attendanceStatus === "WFH") {
    statusText = "WFH";
    statusColor = { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" };
  } else if (attendanceStatus === "IZIN") {
    statusText = "Izin";
    statusColor = { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-100" };
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* CARD 1: STATUS HARI INI */}
      <CardItem 
        title="Status Hari Ini"
        value={statusText}
        subtext={jamShift ? `Shift: ${jamShift.jam_masuk} - ${jamShift.jam_pulang}` : "Tidak ada jadwal"}
        colorInfo={statusColor}
        isLoading={loadHadir || loadShift}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* CARD 2: TOTAL HADIR */}
      <CardItem 
        title="Total Kehadiran"
        value={`${totalHadir} Hari`}
        subtext="Akumulasi bulan ini"
        isLoading={loadHadir}
        colorInfo={{ bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" }}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* CARD 3: IZIN PENDING */}
      <CardItem 
        title="Izin Pending"
        value={izinPending}
        subtext="Menunggu persetujuan"
        isLoading={loadIzin}
        colorInfo={{ bg: "bg-yellow-50", text: "text-yellow-600", ring: "ring-yellow-100" }}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      />

      {/* CARD 4: WFH */}
      <CardItem 
        title="Total WFH"
        value={`${wfhBulanIni} Hari`}
        subtext="Bekerja dari rumah"
        isLoading={loadIzin}
        colorInfo={{ bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" }}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        }
      />
    </div>
  );
}