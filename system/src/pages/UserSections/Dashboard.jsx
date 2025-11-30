// src/pages/UserSections/Dashboard.jsx
import React from "react";

// 1. Impor komponen cerdas
import StatCards from "./components/StatCards";
import CardAbsenGPS from "./components/CardAbsenGPS";
import WidgetKalender from "./components/WidgetKalender";

export default function Dashboard({ setPage }) {
  return (
    <>
      {/* 2. Susun komponen cerdas */}
      <StatCards />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <CardAbsenGPS />

        </div>
        <div className="space-y-6">
          <WidgetKalender />
        </div>
      </div>
    </>
  );
}