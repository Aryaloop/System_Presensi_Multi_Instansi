import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Settings() {
  // State untuk menampung semua data profil
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    jabatan: "",
    no_tlp: "",
    alamat_karyawan: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. GET DATA (Mirip Admin Perusahaan)
  // Ambil data langsung dari API agar lengkap (termasuk email & alamat)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/user/profile");
        const data = res.data.data; // Sesuaikan dengan respon backend userProfile.js
        
        setFormData({
          username: data.username || "",
          email: data.email || "",
          jabatan: data.jabatan?.nama_jabatan || "Karyawan",
          no_tlp: data.no_tlp || "",
          alamat_karyawan: data.alamat_karyawan || "",
        });
      } catch (err) {
        console.error("Gagal ambil profil:", err);
        Swal.fire("Gagal", "Tidak dapat memuat data profil", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle Ketik
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. SIMPAN DATA (PUT)
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Kirim hanya field yang boleh diedit
      await axios.put("/api/user/profile", {
        no_tlp: formData.no_tlp,
        alamat_karyawan: formData.alamat_karyawan,
      });

      Swal.fire({
        icon: "success",
        title: "Berhasil Disimpan",
        text: "Data profil Anda telah diperbarui.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: "Terjadi kesalahan saat memperbarui profil.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat data profil...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header Simple */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pengaturan Profil</h2>
        <p className="text-sm text-gray-500">Kelola informasi kontak dan alamat Anda.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* SECTION 1: READ ONLY (Akun) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              Informasi Akun
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Username"
                value={formData.username}
                icon={<UserIcon />}
                readOnly={true}
              />
              
              <InputField
                label="Jabatan"
                value={formData.jabatan}
                icon={<BriefcaseIcon />}
                readOnly={true}
              />
            </div>

            <InputField
              label="Email Address"
              value={formData.email}
              icon={<EmailIcon />}
              readOnly={true}
              helperText="Email tidak dapat diubah demi keamanan akun."
            />
          </div>

          <hr className="border-gray-100" />

          {/* SECTION 2: EDITABLE (Kontak) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              Data Kontak
            </h3>

            <InputField
              label="Nomor Telepon / WhatsApp"
              name="no_tlp"
              value={formData.no_tlp}
              onChange={handleChange}
              icon={<PhoneIcon />}
              readOnly={false}
              placeholder="Contoh: 081234567890"
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                Alamat Domisili
              </label>
              <div className="relative group">
                <div className="absolute top-3 left-3 pointer-events-none text-indigo-500">
                  <MapPinIcon />
                </div>
                <textarea
                  name="alamat_karyawan"
                  rows="3"
                  value={formData.alamat_karyawan}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap domisili saat ini..."
                  className="block w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* BUTTON SIMPAN */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? "Menyimpan..." : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// --- Komponen Input & Icons ---

function InputField({ label, name, value, onChange, icon, readOnly = false, helperText, placeholder }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${readOnly ? "text-gray-400" : "text-indigo-500"}`}>
          {icon}
        </div>

        <input
          type="text"
          name={name}
          value={value || ""}
          onChange={readOnly ? undefined : onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border
            transition-colors duration-200
            ${readOnly
              ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            }
          `}
        />
        
        {readOnly && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <LockIcon />
          </div>
        )}
      </div>
      {helperText && <p className="mt-1 ml-1 text-xs text-gray-400">{helperText}</p>}
    </div>
  );
}

// Icons
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>);
const EmailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" /><path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" /></svg>);
const BriefcaseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v1.5h12v-1.5a1.5 1.5 0 0 0-1.5-1.5h-9ZM1.5 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.016.17.045.248.01.029.025.054.04.08a2.99 2.99 0 0 0 2.665 1.922h16.5A3 3 0 0 0 22.5 18V7.5a.75.75 0 0 0-.75-.75H1.5Zm6 4.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM6 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 6 15Z" clipRule="evenodd" /></svg>);
const PhoneIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" /></svg>);
const MapPinIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742zM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd" /></svg>);
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" /></svg>);