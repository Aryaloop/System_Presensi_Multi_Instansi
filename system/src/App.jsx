// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import semua halaman
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import DashboardSuperAdmin from "./pages/DashboardSuperAdmin";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardUser from "./pages/DashboardUser";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";

import './index.css';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route path="/verify/:token" element={<Verify />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/dashboard_super_admin" element={<DashboardSuperAdmin />} />
          <Route path="/dashboard_admin" element={<DashboardAdmin />} />
          <Route path="/dashboard_user" element={<DashboardUser />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
