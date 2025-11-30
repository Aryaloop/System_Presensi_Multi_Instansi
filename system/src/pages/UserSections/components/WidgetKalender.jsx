// src/pages/UserSections/components/WidgetKalender.jsx
import React, { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Pastikan CSS ini terload

export default function WidgetKalender() {
  const todayStr = new Date().toDateString();
  
  // State untuk melacak bulan/tahun yang dilihat di kalender
  const [activeDate, setActiveDate] = useState(new Date());

  // Ambil data Kehadiran
  const { data: kehadiranData } = useQuery({
    queryKey: ["kehadiran", activeDate.getMonth() + 1, activeDate.getFullYear()],
    queryFn: async () => {
       const bulan = activeDate.getMonth() + 1;
       const tahun = activeDate.getFullYear();
       const res = await axios.get(`/api/user/kehadiran?bulan=${bulan}&tahun=${tahun}`);
       return res.data.data || [];
    },
    keepPreviousData: true, 
  });
  
  const kehadiran = kehadiranData || [];

  // Konfigurasi Warna & Label UX Standard
  const statusConfig = {
    HADIR:     { bg: "bg-emerald-100", dot: "bg-emerald-500", label: "Hadir" },
    TERLAMBAT: { bg: "bg-orange-100",  dot: "bg-orange-500",  label: "Terlambat" },
    WFH:       { bg: "bg-purple-100",  dot: "bg-purple-500",  label: "WFH" },
    IZIN:      { bg: "bg-yellow-100",  dot: "bg-yellow-500",  label: "Izin" },
    ALFA:      { bg: "bg-red-100",     dot: "bg-red-500",     label: "Alfa" },
  };

  // Logic cek status per tanggal
  const getStatusForDate = (date) => {
    // Bandingkan tanggal string lokal/ISO
    const rec = kehadiran.find((d) => {
        const recordDate = new Date(d.created_at);
        return recordDate.toDateString() === date.toDateString();
    });
    return rec?.status || null;
  };

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <div className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <span>📅</span> Kalender Kehadiran
      </div>
      
      {/* Wrapper Kalender */}
      <div className="custom-calendar-wrapper">
        <Calendar
          // Hapus props nextLabel={null} jika ingin panah navigasi muncul standar

          
          // Update state saat user ganti bulan via panah navigasi
          onActiveStartDateChange={({ activeStartDate }) => setActiveDate(activeStartDate)}
          value={activeDate}
          
          className="w-full border-none font-sans"
          tileClassName={({ date }) => {
            // Styling dasar kotak tanggal
            return "relative h-14 rounded-lg text-sm flex items-start justify-center pt-1 hover:bg-gray-50 transition";
          }}
          tileContent={({ date, view }) => {
            if (view !== "month") return null;
            
            const status = getStatusForDate(date);
            const config = statusConfig[status];
            const isToday = date.toDateString() === todayStr;

            return (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Indikator Hari Ini (Border Biru) */}
                {isToday && (
                   <div className="absolute inset-1 border-2 border-blue-500 rounded-lg z-10" />
                )}

                {/* Background Warna Status */}
                {config && (
                  <div className={`absolute inset-1 ${config.bg} rounded-md opacity-80`} />
                )}
                
                {/* Dot Kecil di bawah angka (Opsional, untuk penanda visual tambahan) */}
                {config && (
                    <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${config.dot}`} />
                )}
              </div>
            );
          }}
        />
      </div>

      {/* --- Bagian LEGEND (Keterangan) --- */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Keterangan Status</p>
        <div className="flex flex-wrap gap-3">
            {Object.entries(statusConfig).map(([key, conf]) => (
                <div key={key} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${conf.dot}`} />
                    <span className="text-xs text-gray-600 font-medium">{conf.label}</span>
                </div>
            ))}
            {/* Legend Hari Ini */}
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded border-2 border-blue-500 bg-transparent" />
                <span className="text-xs text-gray-600 font-medium">Hari Ini</span>
            </div>
        </div>
      </div>
    </div>
  );
}