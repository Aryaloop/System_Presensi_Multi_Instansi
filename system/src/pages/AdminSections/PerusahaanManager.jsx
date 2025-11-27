// src/pages/AdminSections/PerusahaanManager.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function PerusahaanManager() {
  const [perusahaan, setPerusahaan] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Ambil Data Perusahaan saat Load
  useEffect(() => {
    const fetchPerusahaan = async () => {
      try {
        // Menggunakan endpoint modular (tanpa ID di URL, karena diambil dari Token)
        const res = await axios.get(`/api/admin/perusahaan`);
        setPerusahaan(res.data.data);
      } catch (err) {
        console.error("❌ Gagal memuat data perusahaan:", err);
        Swal.fire("Error", "Gagal memuat data perusahaan", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchPerusahaan();
  }, []);

  // 2. Logic "Magic Paste" (Metode Lama yang Diperbaiki)
  // Fitur: Paste link maps -> Otomatis ambil Latitude & Longitude
  // 2. Logic "Magic Paste" yang Lebih Aman & Cerdas
  const handlePasteLink = (e) => {
    const input = e.target.value.trim();

    // REGEX: Cari pola koordinat desimal (contoh: -6.9460234, 107.6099119)
    // Regex ini menangkap angka positif/negatif dengan desimal di dalam teks apa saja
    // Group 1: Latitude, Group 2: Longitude
    const regex = /([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/;
    const match = input.match(regex);

    // Cek juga format khusus Google Maps (biasanya ada @lat,long)
    const regexGoogle = /@([-+]?\d+\.\d+),([-+]?\d+\.\d+)/;
    const matchGoogle = input.match(regexGoogle);

    let lat = null;
    let long = null;

    if (matchGoogle) {
      lat = parseFloat(matchGoogle[1]);
      long = parseFloat(matchGoogle[2]);
    } else if (match) {
      lat = parseFloat(match[1]);
      long = parseFloat(match[2]);
    }

    if (lat && long) {
      // Update state koordinat
      setPerusahaan((prev) => ({
        ...prev,
        latitude: lat,
        longitude: long
        // PENTING: Kita TIDAK mengubah alamat otomatis karena kita tidak pakai Geocoding API
        // Biarkan alamat tetap seperti sebelumnya atau user isi manual
      }));

      Swal.fire({
        icon: 'success',
        title: 'Koordinat Ditemukan!',
        html: `
          <p>Latitude: <b>${lat}</b></p>
          <p>Longitude: <b>${long}</b></p>
          <br/>
          <small style="color:red">⚠️ Perhatian: Silakan ketik <b>Alamat Lengkap</b> secara manual agar sesuai.</small>
        `,
        timer: 3000,
        showConfirmButton: false
      });
    } else {
      // Jika link tidak mengandung koordinat yang bisa dibaca
      Swal.fire({
        icon: 'info',
        title: 'Koordinat Tidak Terbaca',
        text: 'Pastikan link mengandung format angka koordinat (contoh: @-6.917,107.619)',
      });
    }
  };

  // 3. Simpan Perubahan ke Backend
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/perusahaan`, {
        alamat: perusahaan.alamat,
        latitude: perusahaan.latitude,
        longitude: perusahaan.longitude,
        radius_m: perusahaan.radius_m,
      });

      Swal.fire({
        title: "✅ Berhasil!",
        text: "Data perusahaan berhasil diperbarui.",
        icon: "success",
        confirmButtonColor: "#4F46E5",
      });
    } catch (err) {
      console.error("Error save:", err);
      Swal.fire("❌ Gagal", "Terjadi kesalahan saat menyimpan.", "error");
    }
  };

  if (loading) return <div className="text-center p-10 text-gray-500">⏳ Memuat data...</div>;

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">🏢 Kelola Data Perusahaan</h2>
      <p className="text-gray-600 mb-4">
        Admin dapat memperbarui lokasi kantor perusahaan dan radius presensi.
        ID perusahaan otomatis mengikuti akun login.
      </p>

      <div className="bg-white p-6 rounded-lg shadow w-full md:w-2/3 transition-transform hover:shadow-lg">
        <form onSubmit={handleSave} className="space-y-4">

          {/* Info Read-Only */}
          <div>
            <label className="block font-semibold mb-1">ID Perusahaan</label>
            <input
              value={perusahaan.id_perusahaan || ""}
              disabled
              className="w-full border p-2 rounded bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Nama Perusahaan</label>
            <input
              value={perusahaan.nama_perusahaan || ""}
              disabled
              className="w-full border p-2 rounded bg-gray-100 text-gray-600"
            />
          </div>

          {/* FITUR MAGIC PASTE (Kotak Biru) */}
          {/* Ini adalah metode lama Anda, dengan perbaikan regex di background */}
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <label className="block font-semibold mb-1 text-blue-800">
              📍 Paste Link Google Maps
            </label>
            <input
              type="text"
              placeholder="Tempel link Google Maps di sini (harus ada @lat,long)"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={handlePasteLink}
            />
            <p className="text-xs text-gray-500 mt-1">
              Contoh: https://www.google.com/maps/.../@-6.917,107.619...
            </p>
          </div>

          {/* Alamat (Editable) */}
          <div>
            <label className="block font-semibold mb-1">Alamat Perusahaan</label>
            <textarea
              value={perusahaan.alamat || ""}
              onChange={(e) => setPerusahaan({ ...perusahaan, alamat: e.target.value })}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
              rows="3"
              required
            />
          </div>

          {/* Koordinat (Editable - Dibuka kuncinya agar bisa diedit manual jika perlu) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={perusahaan.latitude || ""}
                onChange={(e) => setPerusahaan({ ...perusahaan, latitude: parseFloat(e.target.value) })}
                className="w-full border p-2 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={perusahaan.longitude || ""}
                onChange={(e) => setPerusahaan({ ...perusahaan, longitude: parseFloat(e.target.value) })}
                className="w-full border p-2 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Radius */}
          <div>
            <label className="block font-semibold mb-1">Radius Kantor (meter)</label>
            <input
              type="number"
              value={perusahaan.radius_m || ""}
              onChange={(e) => setPerusahaan({ ...perusahaan, radius_m: parseInt(e.target.value) })}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 active:scale-95 transition-all font-semibold"
            >
              💾 Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}