npm install emailjs

npm install bcryptjs

npm install react-router-dom

npm install @emailjs/browser

npm install jsonwebtoken

npm install uuid

npm install -D tailwindcss@3 postcss autoprefixer

npm install concurrently --save-dev

npx tailwindcss init -p
npm install recharts



## Struckture System
```
SYSTEM/
├── .env                        ← konfigurasi environment utama (Supabase_URL, KEY, EmailJS, PORT, dsb)
│
└── frontend/                   ← proyek utama (gabungan frontend React + backend Express)
    ├── index.js                ← backend Express (API login, register, bcrypt, koneksi Supabase)
    ├── config.js               ← konfigurasi koneksi Supabase di sisi frontend
    ├── package.json            ← daftar dependency proyek (express, vite, react, supabase, bcryptjs, axios, dll)
    ├── package-lock.json
    ├── vite.config.js          ← konfigurasi build Vite
    ├── eslint.config.js        ← konfigurasi linting React/Vite
    ├── index.html              ← entry HTML utama untuk React
    │
    ├── src/
    │   ├── App.jsx             ← router utama (login, register, dashboard per role)
    │   ├── App.css             ← stylesheet khusus App.jsx
    │   ├── index.css           ← stylesheet global
    │   ├── main.jsx            ← root render ReactDOM
    │   │
    │   ├── pages/              ← komponen halaman (React Router)
    │   │   ├── Login.jsx        ← halaman login (axios → /api/login)
    │   │   ├── Register.jsx     ← halaman registrasi user
    │   │   ├── DahboardSuperAdmin.jsx ← dashboard role Super Admin
    │   │   ├── DashboardAdmin.jsx      ← dashboard role Admin
    │   │   └── DashboardUser.js       ← dashboard role User/Karyawan
    │   │
    │   └── assets/             ← file pendukung (logo, gambar, ikon)
    │
    ├── public/                 ← aset publik Vite (favicon, manifest, logo)
    ├── node_modules/           ← dependensi hasil npm install
    ├── README.md
    └── .gitignore

```
