# 📍 PresensiKu - Sistem Presensi Digital Berbasis GPS



![Status](https://img.shields.io/badge/Status-Development-orange)
![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Supabase-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**PresensiKu** adalah aplikasi manajemen kehadiran modern yang dirancang untuk perusahaan multi-shift. Aplikasi ini menggunakan **Geofencing (GPS)** untuk memvalidasi lokasi karyawan saat absen, dilengkapi dengan sistem pengajuan izin, manajemen shift, dan laporan kehadiran real-time.



## 📂 Struktur Project (Monorepo)

Project ini memiliki dua `package.json` terpisah karena Frontend dan Backend dipisahkan dalam folder berbeda.

````
root-project/
├── .env                  <-- File Environment Variable (Simpan di sini)
├── frontend/             <-- Aplikasi Client (React + Vite)
│   ├── src/
│   ├── public/
│   └── package.json
│
└── system/
    └── backend/          <-- Aplikasi Server (Express + Node.js)
        ├── config/
        ├── controllers/
        ├── routes/
        └── package.json
````

-----

## 🛠 Teknologi yang Digunakan

### **Frontend** (Folder `frontend`)

  - **Core:** React JS v19 (Vite)
  - **Styling:** Tailwind CSS
  - **State Management:** TanStack Query v5
  - **HTTP Client:** Axios
  - **Fitur Utama:**
      - `geolib`: Kalkulasi jarak & radius GPS.
      - `react-calendar`: Visualisasi riwayat kehadiran.
      - `recharts`: Grafik statistik dashboard.
      - `sweetalert2`: Notifikasi interaktif.
      - `emailjs`: Fitur email client-side (opsional).

### **Backend** (Folder `system/backend`)

  - **Core:** Node.js & Express.js v5
  - **Database:** Supabase (PostgreSQL)
  - **Auth & Security:**
      - `jsonwebtoken` (JWT): Autentikasi token.
      - `bcryptjs`: Hashing password.
      - `cookie-parser`: Penyimpanan token aman (HttpOnly).
      - `cors`: Keamanan akses resource.
  - **Fitur Utama:**
      - `nodemailer`: Layanan pengiriman email (Reset Password/Notifikasi).
      - Modular Routing (Pemisahan logic User, Admin, SuperAdmin).

-----

## 🚀 Fitur Utama per Aktor

### 👤 1. User (Karyawan)

  - **Absen GPS:** Absen Masuk/Pulang hanya bisa dilakukan jika berada dalam radius kantor.
  - **Validasi Shift:** Sistem otomatis mendeteksi keterlambatan berdasarkan jam shift.
  - **Pengajuan Izin:** Form pengajuan Cuti, Sakit, atau WFH.
  - **Dashboard Personal:** Melihat statistik kehadiran bulanan sendiri.
  - **Riwayat Kalender:** Visualisasi kehadiran (Hadir, Telat, Izin, Alpha) dalam kalender.
  - **Profil:** Update data diri (Email, No HP, Alamat).

### 🏢 2. Admin (HR/Manajer)

  - **Dashboard Admin:** Ringkasan statistik perusahaan (Total Karyawan, Hadir Hari Ini).
  - **Manajemen Karyawan:** Tambah, Edit, Hapus, dan Reset Password karyawan.
  - **Manajemen Shift:** Membuat jadwal shift (Pagi, Siang, Malam) fleksibel.
  - **Verifikasi Izin:** Menyetujui atau menolak pengajuan izin karyawan (Otomatis update ke rekap kehadiran).
  - **Rekap Absensi:** Melihat daftar kehadiran karyawan per bulan/tahun.
  - **Lokasi Kantor:** Mengatur titik koordinat (Latitude/Longitude) dan radius absensi.

### ⚡ 3. Super Admin (Platform Owner)

  - **Manajemen Perusahaan:** Mendaftarkan perusahaan baru ke dalam sistem.
  - **Suspend:** Menonaktifkan akses perusahaan tertentu.
  - **Monitoring Global:** Melihat total user di seluruh platform.

-----

## ⚙️ Persiapan & Instalasi

Pastikan sudah menginstall:

  - [Node.js](https://nodejs.org/) (v18+)
  - [Git](https://git-scm.com/)
  - Database [Supabase](https://supabase.com/)

### 1\. Clone Repository

```bash
git clone [https://github.com/username-anda/presensiku.git](https://github.com/username-anda/presensiku.git)
cd presensiku
```

### 2\. Instalasi Dependencies

**Backend:**

```bash
cd system/backend
npm install
```

**Frontend:**
Buka terminal baru/tab baru, lalu:

```bash
cd frontend
npm install
```

-----

## 🔐 Konfigurasi Environment (.env)

Buat file bernama `.env` di **folder paling luar (Root)** proyek ini. Copy konfigurasi di bawah:

```env

# --- DATABASE (SUPABASE) ---
# Dapatkan ini dari Dashboard Supabase -> Project Settings -> API
SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
SUPABASE_KEY=your-supabase-anon-key

# --- SECURITY (JWT) ---
# Isi dengan string acak yang panjang
JWT_SECRET=rahasia_super_aman_ganti_ini

# --- EMAIL SERVICE (Nodemailer) ---
# Gunakan App Password Gmail, bukan password login biasa
EMAIL_USER=email-anda@gmail.com
EMAIL_PASS=password-app-google-anda
```

-----

## ▶️ Cara Menjalankan Aplikasi

Anda perlu menjalankan 2 terminal secara bersamaan.

**Terminal 1 (Backend):**

```bash
cd system/backend
npm run dev
# Server berjalan di: http://localhost:5000
```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev
# Aplikasi berjalan di: http://localhost:3000
```

Buka browser dan akses `http://localhost:3000`.

-----

## 🗄 Skema Database (Supabase)

Pastikan tabel-tabel berikut sudah dibuat di Supabase:

1.  **`akun`**: Menyimpan data user (email, password, role, id\_perusahaan).
2.  **`perusahaan`**: Menyimpan data kantor (lokasi lat/long, radius).
3.  **`shift`**: Menyimpan aturan jam kerja.
4.  **`kehadiran`**: Menyimpan log absen harian (jam masuk, pulang, status, lokasi).
5.  **`izin_wfh`**: Menyimpan data pengajuan izin.
6.  **`jabatan`**: Tabel master untuk role (ADMIN, USER, SPRADM).

-----

## 🤝 Kontribusi

Pull Request dipersilakan. Untuk perubahan besar, harap buka issue terlebih dahulu untuk mendiskusikan apa yang ingin Anda ubah.

1.  Fork project ini
2.  Create feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4.  Push ke branch (`git push origin feature/AmazingFeature`)
5.  Open Pull Request

-----

Created with ❤️ by **PresensiKita**

