// src/pages/UserSections/Kalender.jsx
import React from "react";
import StatCards from "./components/StatCards";
import WidgetKalender from "./components/WidgetKalender";

export default function Kalender() {
  return (
    <div className="space-y-6">
      <StatCards />
      <WidgetKalender />
    </div>
  );
}