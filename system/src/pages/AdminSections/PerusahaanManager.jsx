// src/pages/AdminSections/PerusahaanManager.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2"; // ✅ Tambahkan ini

export default function PerusahaanManager() {
  const [perusahaan, setPerusahaan] = useState({});

  useEffect(() => {
    const fetchPerusahaan = async () => {
      try {
        // Panggil endpoint umum, backend akan kasih data perusahaan milik user yg login
        const res = await axios.get(`/api/admin/perusahaan`);
        setPerusahaan(res.data.data);
      } catch (err) {
        console.error("❌ Gagal memuat data perusahaan:", err);
        Swal.fire("❌ Error", "Gagal memuat data perusahaan", "error");
      }
    };
    fetchPerusahaan();
  }, []);

  if (!perusahaan || Object.keys(perusahaan).length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 animate-pulse">⏳ Sedang memuat data perusahaan...</p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">🏢 Kelola Data Perusahaan</h2>
      <p className="text-gray-600 mb-4">
        Admin dapat memperbarui lokasi kantor perusahaan dan radius presensi.
        ID perusahaan otomatis mengikuti akun login.
      </p>

      <div className="bg-white p-6 rounded-lg shadow w-full md:w-2/3 transition-transform hover:shadow-lg">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              // URL bersih, tanpa ID
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
              console.error("❌ Gagal update perusahaan:", err);
              Swal.fire({
                title: "❌ Gagal!",
                text: "Terjadi kesalahan saat memperbarui data.",
                icon: "error",
                confirmButtonColor: "#d33",
              });
            }
          }}
          className="space-y-4"
        >
          {/* ID Perusahaan */}
          <div>
            <label className="block font-semibold mb-1">ID Perusahaan</label>
            <input
              type="text"
              value={perusahaan.id_perusahaan || ""}
              disabled
              className="w-full border p-2 rounded bg-gray-100"
            />
          </div>

          {/* Nama Perusahaan */}
          <div>
            <label className="block font-semibold mb-1">Nama Perusahaan</label>
            <input
              type="text"
              value={perusahaan.nama_perusahaan || ""}
              disabled
              className="w-full border p-2 rounded bg-gray-100"
            />
          </div>

          {/* Paste Link Maps */}
          <div>
            <label className="block font-semibold mb-1">
              Paste Link Google Maps
            </label>
            <input
              type="text"
              placeholder="Tempel link Google Maps di sini"
              className="w-full border p-2 rounded"
              onChange={async (e) => {
                const input = e.target.value.trim();
                let latitude = perusahaan.latitude;
                let longitude = perusahaan.longitude;
                let alamat = perusahaan.alamat;

                if (input.includes("https://www.google.com/maps")) {
                  const atIndex = input.indexOf("@");
                  if (atIndex !== -1) {
                    const coords = input.substring(atIndex + 1).split(",");
                    latitude = coords[0];
                    longitude = coords[1];
                  }

                  try {
                    const res = await axios.get(
                      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    alamat = res.data.display_name;
                    Swal.fire("📍 Lokasi terdeteksi", "Alamat berhasil diambil dari Google Maps.", "success");
                  } catch (err) {
                    Swal.fire("⚠️ Gagal", "Tidak dapat memproses link Maps tersebut.", "warning");
                  }
                }

                setPerusahaan({
                  ...perusahaan,
                  alamat,
                  latitude,
                  longitude,
                });
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Contoh: https://www.google.com/maps/place/.../@-6.200000,106.816666,...
            </p>
          </div>

          {/* Alamat Perusahaan */}
          <div>
            <label className="block font-semibold mb-1">Alamat Perusahaan</label>
            <textarea
              value={perusahaan.alamat || ""}
              disabled
              className="w-full border p-2 rounded bg-gray-100"
              rows="2"
            />
          </div>

          {/* Latitude & Longitude */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Latitude</label>
              <input
                type="text"
                value={perusahaan.latitude || ""}
                disabled
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Longitude</label>
              <input
                type="text"
                value={perusahaan.longitude || ""}
                disabled
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
          </div>

          {/* Radius */}
          <div>
            <label className="block font-semibold mb-1">Radius Kantor (meter)</label>
            <input
              type="number"
              value={perusahaan.radius_m || ""}
              onChange={(e) =>
                setPerusahaan({ ...perusahaan, radius_m: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 active:scale-95 transition-all"
            >
              💾 Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
