## 📝 System Activity Logs (Audit Trail)

Sistem ini menerapkan pencatatan aktivitas pengguna (*Audit Trail*) untuk keamanan dan pemantauan data. Semua aktivitas penting disimpan dalam tabel database `activity_logs`.

Berikut adalah daftar aktivitas yang dicatat oleh sistem:

### 1. Otentikasi & Keamanan Akun
Aktivitas terkait akses masuk dan perubahan kredensial pengguna.

| Action Name | Deskripsi | Trigger / Pemicu |
| :--- | :--- | :--- |
| `LOGIN` | User berhasil masuk ke sistem | Saat endpoint `/login` sukses |
| `LOGOUT` | User keluar dari sistem | Saat endpoint `/logout` dipanggil |
| `REGISTER_USER` | Pendaftaran user baru (Mandiri) | Saat user mendaftar via halaman Register |
| `VERIFY_EMAIL` | Verifikasi email user | Saat user mengklik link verifikasi di email |
| `REQUEST_RESET_PASSWORD` | Permintaan reset password | Saat user menggunakan fitur Lupa Password |
| `RESET_PASSWORD_SUCCESS` | Perubahan password berhasil | Saat user sukses mengganti password via token reset |

### 2. Manajemen Super Admin
Aktivitas administratif tingkat tinggi yang dilakukan oleh Super Admin.

| Action Name | Deskripsi | Trigger / Pemicu |
| :--- | :--- | :--- |
| `CREATE_ADMIN` | Pembuatan Admin baru | Super Admin membuat akun Admin untuk perusahaan |
| `CREATE_PERUSAHAAN` | Menambah data perusahaan | Super Admin input perusahaan baru |
| `UPDATE_PERUSAHAAN` | Edit data perusahaan | Perubahan nama, alamat, atau status perusahaan |
| `SUSPEND_PERUSAHAAN` | Suspend/Aktifkan perusahaan | Mengubah status aktif/non-aktif perusahaan |
| `DELETE_PERUSAHAAN` | Menghapus perusahaan | Menghapus data perusahaan (Soft/Hard delete) |

### 3. Struktur Tabel Log
Log disimpan di tabel `activity_logs` dengan struktur data JSONB untuk fleksibilitas detail.

- **id_akun**: UUID pelakunya (User/Admin).
- **id_perusahaan**: ID Perusahaan asal pelaku (kecuali Super Admin).
- **action**: Kode aksi (seperti daftar di atas).
- **target_table**: Tabel yang dimodifikasi (misal: `akun`, `perusahaan`).
- **details**: JSON berisi detail perubahan (misal: `{"old_value": "...", "new_value": "..."}`).
- **ip_address**: Alamat IP pelaku.
- **user_agent**: Informasi browser/perangkat pelaku.

> **Catatan Security:** ID Perusahaan System (`PRE010`) diproteksi dari modifikasi (Edit/Delete) dan upaya akses ilegal terhadap ID ini akan ditolak oleh sistem (403 Forbidden).

### 🛡️ Konfigurasi System Company ID (Hardcoded Protection)

Secara default, sistem menggunakan ID **`PRE010`** sebagai identitas "Perusahaan System" (Root/Internal). ID ini memiliki proteksi khusus di Backend agar tidak bisa dihapus atau disuspend, karena biasanya digunakan untuk akun Super Admin atau SysAdmin.

**Panduan untuk Developer (Customizing System ID):**

Jika Anda ingin mengubah ID ini agar sesuai dengan kode perusahaan Anda (misal: `MYCORP01` atau `HO_JKT`), ikuti langkah berikut:

1.  **Persiapan Database:**
    Pastikan Anda sudah menginsert data perusahaan dengan ID baru tersebut di tabel `perusahaan` database Anda.

2.  **Update Logic Backend:**
    Buka file controller berikut:
    `backend/superAdminRoutes/controllers/perusahaanController.js`

    Cari variabel konstanta berikut di bagian atas file dan ubah nilainya:
    ```javascript
    // 🔒 CONSTANT: ID Perusahaan System/Internal
    const SYSTEM_COMPANY_ID = "PRE010"; // <-- Ganti string ini dengan ID Perusahaan Anda
    ```

3.  **Update Filter Frontend (Opsional):**
    Jika Anda ingin menyembunyikan perusahaan sistem ini dari tabel manajemen di dashboard, sesuaikan juga filter di file:
    `src/pages/SuperAdminSections/PerusahaanManager.jsx`
    ```javascript
    // Filter visual agar System ID tidak muncul di tabel
    const perusahaan = rawData.filter(p => p.id_perusahaan !== "PRE010"); // <-- Sesuaikan ID di sini juga
    ```

> **Penting:** Pastikan ID yang Anda pasang di code **BENAR-BENAR ADA** di database. Jika tidak, logika proteksi mungkin tidak berjalan semestinya atau Super Admin kehilangan akses ke fitur tertentu.

system/
└── backend/
    ├── adminRoutes/                ← Modul Khusus Admin (Logika & Route)
    │   ├── adminAbsen.js           ← Kelola Presensi Karyawan
    │   ├── adminIzin.js            ← Verifikasi Izin
    │   ├── adminKaryawan.js        ← CRUD Data Karyawan
    │   ├── adminPerusahaan.js      ← Setting Lokasi Kantor
    │   ├── adminRoutes.js          ← Main Router untuk /api/admin
    │   ├── adminShift.js           ← Kelola Shift Kerja
    │   └── createSubAdmin.js       ← Fitur Tambah Sub-Admin
    │
    ├── config/
    │   └── db.js                   ← Koneksi Supabase/PostgreSQL
    │
    ├── controllers/                ← Controller Global (Auth)
    │   └── authController.js       ← Logic Login, Register, Logout
    │
    ├── middleware/                 ← Keamanan
    │   ├── authMiddleware.js       ← Verifikasi JWT & Role
    │   ├── csrfMiddleware.js       ← Proteksi CSRF (Double Submit Cookie)
    │   └── limiter.js              ← Rate Limiting
    │
    ├── routes/                     ← Route Global
    │   └── authRoutes.js           ← Router untuk Auth (/api/login, etc)
    │
    ├── superAdminRoutes/           ← Modul Khusus Super Admin
    │   ├── controllers/            ← Controller Terpisah (Lebih Rapi)
    │   │   ├── activityLogController.js
    │   │   ├── adminManagementController.js
    │   │   └── perusahaanController.js
    │   └── superAdminRoutes.js     ← Main Router untuk /api/superadmin
    │
    ├── userRoutes/                 ← Modul Khusus User/Pegawai
    │   ├── cronJobAbsenUser.js     ← Auto-Alfa (Scheduler)
    │   ├── userAbsen.js            ← Logic Absen GPS
    │   ├── userIzin.js             ← Logic Pengajuan Izin
    │   ├── userKehadiran.js        ← Get History Kehadiran
    │   ├── userProfile.js          ← Get/Update Profile
    │   └── userRoutes.js           ← Main Router untuk /api/user
    │
    ├── utils/                      ← Fungsi Bantuan
    │   ├── emailService.js         ← Nodemailer Config
    │   ├── logger.js               ← Pencatat Log Sistem
    │   └── scheduler.js            ← Cron Job Manager
    │
    ├── node_modules/               ← Library Dependencies
    ├── index.js                    ← Entry Point (Server Utama)
    ├── package.json                ← Daftar Dependensi
    └── package-lock.json           ← Lock Versi Dependensi