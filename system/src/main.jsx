// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Cookies from "js-cookie"; // <--- 1. IMPORT INI

// 2. KONFIGURASI GLOBAL AXIOS
axios.defaults.withCredentials = true; // Wajib agar cookie dikirim
// 3. INTERCEPTOR OTOMATIS (Logic CSRF)
// Setiap kali axios mau kirim request, dia akan cek cookie dulu
axios.interceptors.request.use((config) => {
  // Baca token dari cookie yang dikirim backend saat login
  const csrfToken = Cookies.get("XSRF-TOKEN");
  
  if (csrfToken) {
    // Tempelkan token ke Header request
    config.headers["X-CSRF-Token"] = csrfToken;
    // config.headers["X-XSRF-TOKEN"] = csrfToken; // (Opsional) Beberapa library pakai nama ini
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);