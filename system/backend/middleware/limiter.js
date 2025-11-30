import rateLimit from "express-rate-limit";

// Limiter Khusus Auth (Login/Register/Forgot) - Lebih Ketat
// Maksimal 5 percobaan per 15 menit per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, 
  message: {
    message: "Terlalu banyak percobaan login/daftar. Silakan coba lagi dalam 15 menit."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter Umum (API lainnya) - Lebih Longgar
// Maksimal 100 request per 15 menit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Terlalu banyak request ke server. Santai dulu."
  }
});