import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
  },
  // Konfigurasi Server Development (npm run dev)
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Sesuaikan port backend kamu (di index.js kamu pakai process.env.PORT || 3001)
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // --- TAMBAHKAN BAGIAN INI ---
  // Konfigurasi Server Preview (npm run preview)
  preview: {
    port: 3000,        // Paksa jalan di port 3000
    strictPort: true,  // Error jika port 3000 sedang dipakai aplikasi lain
  }
});