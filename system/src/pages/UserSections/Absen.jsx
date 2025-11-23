// src/pages/UserSections/Absen.jsx
import React from "react";
import StatCards from "./components/StatCards";
import CardAbsenGPS from "./components/CardAbsenGPS";

export default function Absen() {
  return (
    <div className="space-y-6">
      <StatCards />
      <CardAbsenGPS />
    </div>
  );
}