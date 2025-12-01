import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Komponen UI Sederhana untuk StatCard (Langsung di file ini agar tidak error import)
const StatCard = ({ title, value, icon, tone, delta }) => {
  const bgColors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  };
  const textColors = {
    indigo: "text-indigo-600",
    green: "text-green-600",
    blue: "text-blue-600",
  };

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm flex justify-between items-start">
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        <h3 className={`text-3xl font-bold mt-2 ${textColors[tone] || "text-gray-800"}`}>
          {value}
        </h3>
        {delta && (
          <div className="mt-2 text-xs flex items-center gap-1 text-gray-500">
            <span className="text-green-600 font-bold">{delta.value}</span> {delta.note}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${bgColors[tone] || "bg-gray-100"}`}>
        {icon}
      </div>
    </div>
  );
};

export default function DashboardHome() {
  // 1. Fetch Data Statistik
  const { data: stats, isLoading } = useQuery({
    queryKey: ["superAdminStats"],
    queryFn: async () => {
      // Mengambil data real dari API
      const [resPerusahaan, resAdmins] = await Promise.all([
        axios.get("/api/superadmin/perusahaan?limit=1"), // Limit 1 cukup untuk ambil 'total' dari metadata
        axios.get("/api/superadmin/admins?limit=1")
      ]);

      return {
        totalPerusahaan: resPerusahaan.data.total || 0,
        totalAdmin: resAdmins.data.total || 0,
        // Contoh data hardcode untuk user, bisa diganti endpoint real nanti
        totalUser: 0 
      };
    },
    // Data Default agar tidak error saat loading
    initialData: { totalPerusahaan: 0, totalAdmin: 0, totalUser: 0 }
  });

  return (
    <section className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Overview Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Perusahaan */}
        <StatCard
          title="Total Perusahaan"
          value={isLoading ? "..." : stats.totalPerusahaan} // GUNAKAN stats.totalPerusahaan
          tone="indigo"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          delta={{ value: "+Data", note: "Realtime" }}
        />

        {/* Total Admin */}
        <StatCard
          title="Total Admin"
          value={isLoading ? "..." : stats.totalAdmin} // GUNAKAN stats.totalAdmin
          tone="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-7a4 4 0 110 8 4 4 0 010-8z" />
            </svg>
          }
          delta={{ value: "Aktif", note: "Terdaftar" }}
        />

        {/* Server Status */}
        <StatCard
          title="Server Status"
          value="Online"
          tone="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          }
          delta={{ value: "OK", note: "Normal" }}
        />
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Sistem</h3>
        <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Database Connected
            </span>
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> API Online
            </span>
        </div>
      </div>
    </section>
  );
}