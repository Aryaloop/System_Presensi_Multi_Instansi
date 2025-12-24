import crypto from "crypto";

// 1. Middleware untuk Generate Token (Dipasang di Login/Register)
export const generateCsrfToken = (req, res, next) => {
  // Buat token random
  const csrfToken = crypto.randomBytes(32).toString("hex");
  
  // Simpan di Cookie yang BISA DIBACA oleh Frontend (httpOnly: false)
  res.cookie("XSRF-TOKEN", csrfToken, {
    httpOnly: false, // Penting! Agar React bisa baca token ini
    secure: process.env.NODE_ENV === "production", // HTTPS di production
    sameSite: "lax",
    path: "/"
  });

  next();
};

// 2. Middleware untuk Validasi Token (Dipasang di Route POST/PUT/DELETE)
export const verifyCsrfToken = (req, res, next) => {
  // Lewati validasi untuk method GET/HEAD/OPTIONS (Safe methods)
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Ambil token dari Header (dikirim oleh Frontend)
  const tokenFromHeader = req.headers["x-csrf-token"] || req.headers["x-xsrf-token"];
  
  // Ambil token dari Cookie
  const tokenFromCookie = req.cookies["XSRF-TOKEN"];

  // Bandingkan
  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ 
      message: "CSRF Token Mismatch. Silakan refresh halaman atau login ulang." 
    });
  }

  next();
};