import React from "react";

/* ==========================================================================
   1. BADGE (Label Status Warna-warni)
   ========================================================================== */
export const Badge = ({ children, tone = "gray" }) => {
  const map = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
};

/* ==========================================================================
   2. STAT CARD (Kotak Statistik Dashboard)
   ========================================================================== */
export const StatCard = ({ title, value, icon, tone = "indigo", delta = null }) => {
  const valueColor =
    tone === "green" ? "text-green-600" :
    tone === "blue" ? "text-blue-600" :
    tone === "red" ? "text-red-600" :
    "text-indigo-600";

  // Logic warna background icon agar serasi
  const iconBg = 
    tone === "green" ? "bg-green-50 text-green-600" :
    tone === "blue" ? "bg-blue-50 text-blue-600" :
    tone === "red" ? "bg-red-50 text-red-600" :
    tone === "yellow" ? "bg-yellow-50 text-yellow-600" :
    "bg-indigo-50 text-indigo-600";

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 transition-transform hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
        </div>
        <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}>
          {icon}
        </span>
      </div>

      {/* Baris Delta (Persentase kenaikan/penurunan) */}
      {delta && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${delta.tone === 'green' ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className={`font-semibold ${delta.tone === 'green' ? 'text-green-600' : 'text-gray-500'}`}>
            {delta.value}
          </span>
          <span className="text-gray-400">{delta.note || "dari bulan lalu"}</span>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   3. ICON BUTTON (Tombol Aksi Kecil di Tabel)
   ========================================================================== */
export const IconButton = ({ tone = "indigo", title, onClick, children }) => {
  const map = {
    indigo: "text-indigo-600 hover:bg-indigo-50",
    blue: "text-blue-600 hover:bg-blue-50",
    red: "text-red-600 hover:bg-red-50",
    gray: "text-gray-600 hover:bg-gray-100",
    green: "text-green-600 hover:bg-green-50",
    yellow: "text-yellow-600 hover:bg-yellow-50",
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition ${map[tone]}`}
    >
      {children}
    </button>
  );
};