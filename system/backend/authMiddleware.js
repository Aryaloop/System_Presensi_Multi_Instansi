import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // 1. Ambil token dari cookies (bukan header Authorization)
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Sesi habis atau Anda belum login." });
  }

  // 2. Verifikasi token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token tidak valid." });
    }
    
    // 3. Simpan data user (id_akun, role, id_perusahaan) ke dalam request
    req.user = decoded; 
    next(); // Lanjut ke controller
  });
};

export const verifyAdmin = (req, res, next) => {
  // Middleware tambahan untuk memastikan role adalah ADMIN, SPRADM, atau SUBADMIN
  if (req.user.role !== "ADMIN" && req.user.role !== "SPRADM" && req.user.role !== "SUBADMIN") {
    return res.status(403).json({ message: "Akses ditolak! Halaman ini khusus Admin." });
  }
  next();
};