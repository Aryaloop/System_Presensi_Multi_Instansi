// src/pages/UserSections/components/WidgetKalender.jsx
import React, { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function WidgetKalender() {
  const todayStr = new Date().toDateString();
  
  // State untuk melacak bulan/tahun yang dilihat
  const [activeDate, setActiveDate] = useState(new Date());

  // Ambil data Kehadiran (berdasarkan bulan/tahun yang aktif)
  const { data: kehadiranData } = useQuery({
    queryKey: ["kehadiran", activeDate.getMonth() + 1, activeDate.getFullYear()],
    queryFn: async () => {
       const bulan = activeDate.getMonth() + 1;
       const tahun = activeDate.getFullYear();
       const res = await axios.get(`/api/user/kehadiran?bulan=${bulan}&tahun=${tahun}`);
       return res.data.data || [];
    },
    keepPreviousData: true, // Agar kalender lama tidak blank saat ganti bulan
  });
  
  const kehadiran = kehadiranData || [];

  // Logic untuk mewarnai kalender
  const getStatusForDate = (date) => {
    const rec = kehadiran.find((d) => new Date(d.created_at).toDateString() === date.toDateString());
    return rec?.status || null;
  };
  const bgByStatus = {
    HADIR: "bg-emerald-100",
    WFH: "bg-purple-100",
    IZIN: "bg-yellow-100",
    TERLAMBAT: "bg-orange-100",
    ALFA: "bg-red-100",
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="font-semibold mb-2">Kalender Kehadiran</div>
      <Calendar
        nextLabel={null}
        prevLabel={null}
        next2Label={null}
        prev2Label={null}
        // Saat pengguna ganti bulan, update state & trigger refetch
        onActiveStartDateChange={({ activeStartDate }) => setActiveDate(activeStartDate)}
        tileClassName={() => "relative rounded-lg !m-1 overflow-hidden"}
        tileContent={({ date, view }) => {
          if (view !== "month") return null;
          const status = getStatusForDate(date);
          const isToday = date.toDateString() === todayStr;
          if (status) return <div className={`absolute inset-0 ${bgByStatus[status]} opacity-90 pointer-events-none`} />;
          if (isToday) return <div className="absolute inset-0 bg-blue-500/80 pointer-events-none" />;
          return null;
        }}
      />
      {/* ... (JSX Legend) ... */}
    </div>
  );
}