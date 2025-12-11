// src/pages/AdminSections/PerusahaanManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MapPin, Building } from "lucide-react";

export default function PerusahaanManager() {
  const [perusahaan, setPerusahaan] = useState({});
  const [initialPerusahaan, setInitialPerusahaan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPerusahaan = async () => {
      try {
        const res = await axios.get(`/api/admin/perusahaan`);
        const data = res?.data?.data ?? {};
        setPerusahaan({
          id_perusahaan: data.id_perusahaan ?? "",
          nama_perusahaan: data.nama_perusahaan ?? "",
          alamat: data.alamat ?? "",
          latitude: data.latitude ?? "",
          longitude: data.longitude ?? "",
          radius_m: data.radius_m ?? 150,
        });
        setInitialPerusahaan(data ?? {});
      } catch (err) {
        console.error("❌ Gagal memuat data perusahaan:", err);
        Swal.fire("Error", "Gagal memuat data perusahaan", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchPerusahaan();
  }, []);

  // Handle paste / detect coords from various link formats
  const handlePasteLink = (e) => {
    const input = e.target.value.trim();

    // Try Google Maps @lat,long pattern
    const regexGoogle = /@([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/;
    const matchGoogle = input.match(regexGoogle);

    // Generic pattern lat,long anywhere
    const regexGeneric = /([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/;
    const matchGeneric = input.match(regexGeneric);

    let lat = null;
    let lon = null;

    if (matchGoogle) {
      lat = parseFloat(matchGoogle[1]);
      lon = parseFloat(matchGoogle[2]);
    } else if (matchGeneric) {
      lat = parseFloat(matchGeneric[1]);
      lon = parseFloat(matchGeneric[2]);
    }

    if (lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon)) {
      setPerusahaan((p) => ({ ...p, latitude: lat, longitude: lon }));
      Swal.fire({
        icon: "success",
        title: "Koordinat Ditemukan",
        html: `Latitude: <b>${lat}</b><br/>Longitude: <b>${lon}</b><br/><small class="text-red-600">⚠️ Silakan pastikan & lengkapi Alamat secara manual.</small>`,
        timer: 2500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "info",
        title: "Koordinat Tidak Terbaca",
        text: "Pastikan link mengandung koordinat (contoh: @-6.917,107.619) atau teks lat,long.",
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
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
        confirmButtonColor: "#10B981",
      });
      // Refresh initial snapshot
      setInitialPerusahaan({ ...perusahaan });
    } catch (err) {
      console.error("Error save:", err);
      Swal.fire("❌ Gagal", "Terjadi kesalahan saat menyimpan.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!initialPerusahaan) return;
    setPerusahaan({
      id_perusahaan: initialPerusahaan.id_perusahaan ?? "",
      nama_perusahaan: initialPerusahaan.nama_perusahaan ?? "",
      alamat: initialPerusahaan.alamat ?? "",
      latitude: initialPerusahaan.latitude ?? "",
      longitude: initialPerusahaan.longitude ?? "",
      radius_m: initialPerusahaan.radius_m ?? 150,
    });
  };

  // Build map iframe url when coords available
  const renderMapPreview = () => {
    const lat = Number(perusahaan.latitude);
    const lon = Number(perusahaan.longitude);
    if (!lat || !lon || Number.isNaN(lat) || Number.isNaN(lon)) {
      return (
        <div className="h-40 md:h-48 flex items-center justify-center rounded border-dashed border-2 border-gray-200 bg-gray-50 text-gray-400">
          <div className="text-center">
            <p className="font-semibold">Preview peta akan muncul di sini</p>
            <p className="text-xs mt-1">Masukkan koordinat (atau paste link Google Maps)</p>
          </div>
        </div>
      );
    }

    // zoom tuned by radius (approx)
    const zoom = (() => {
      const r = Number(perusahaan.radius_m) || 150;
      if (r <= 50) return 18;
      if (r <= 200) return 16;
      if (r <= 1000) return 14;
      return 12;
    })();

    const src = `https://maps.google.com/maps?q=${lat},${lon}&z=${zoom}&output=embed`;

    return (
      <div className="h-48 md:h-64 rounded overflow-hidden border">
        <iframe
          title="preview-lokasi"
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
        />
      </div>
    );
  };

  if (loading) {
    return <div className="text-center p-10 text-gray-500">⏳ Memuat data...</div>;
  }

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white">
            <Building size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Informasi Perusahaan</h1>
            <p className="text-sm text-gray-500">Atur identitas & lokasi kantor perusahaan untuk fitur presensi.</p>
          </div>
        </div>

        {/* Card: Informasi Dasar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded bg-indigo-50 text-indigo-600">
              <Building size={18} />
            </div>
            <h2 className="font-semibold text-gray-800">Informasi Dasar Perusahaan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ID Perusahaan</label>
              <input
                value={perusahaan.id_perusahaan ?? ""}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-400 mt-1">ID otomatis berdasarkan akun login</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nama Perusahaan</label>
              <input
                value={perusahaan.nama_perusahaan ?? ""}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Card: Lokasi */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-blue-50 text-blue-600">
              <MapPin size={18} />
            </div>
            <h2 className="font-semibold text-gray-800">Pengaturan Lokasi Kantor</h2>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded p-4">
            <label className="block text-sm font-medium text-blue-800 mb-1">📍 Paste Link Google Maps</label>
            <input
              type="text"
              placeholder="Tempel link Google Maps di sini (harus ada @lat,long)"
              onChange={handlePasteLink}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none"
            />
            <p className="text-xs text-blue-600 mt-2">Contoh: https://www.google.com/maps/.../@-6.917,107.619...</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Alamat Perusahaan</label>
              <input
                value={perusahaan.alamat ?? ""}
                onChange={(e) => setPerusahaan({ ...perusahaan, alamat: e.target.value })}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-200"
                placeholder="Alamat lengkap kantor"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={perusahaan.latitude ?? ""}
                  onChange={(e) => setPerusahaan({ ...perusahaan, latitude: e.target.value })}
                  className="w-full border rounded px-3 py-2 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={perusahaan.longitude ?? ""}
                  onChange={(e) => setPerusahaan({ ...perusahaan, longitude: e.target.value })}
                  className="w-full border rounded px-3 py-2 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Radius Kantor (meter)</label>
                <input
                  type="number"
                  value={perusahaan.radius_m ?? 150}
                  onChange={(e) => setPerusahaan({ ...perusahaan, radius_m: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Preview */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded bg-indigo-50 text-indigo-600">
              <MapPin size={16} />
            </div>
            <h3 className="font-semibold text-gray-800">Preview Lokasi</h3>
          </div>

          {renderMapPreview()}

          <p className="text-xs text-gray-400 mt-3">Preview peta akan muncul setelah memasukkan koordinat valid.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            ✕ Batal
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold"
          >
            💾 {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </section>
  );
}
