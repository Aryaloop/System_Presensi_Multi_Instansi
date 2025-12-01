// src/pages/AdminSections/VerifikasiIzin.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function VerifikasiIzin() {
  const [izinData, setIzinData] = useState([]);
  const [izinPage, setIzinPage] = useState(1);
  const izinLimit = 10;
  const [totalIzin, setTotalIzin] = useState(0);

  const fetchIzinList = async () => {
    // URL Bersih
    const res = await axios.get(
      `/api/admin/izin?page=${izinPage}&limit=${izinLimit}`
    );
    setIzinData(res.data.data);
    setTotalIzin(res.data.total);
  };

  useEffect(() => {
    fetchIzinList();
  }, [izinPage]);

  const handleUpdateStatus = async (id_izin, newStatus) => {
    try {
      // PERBAIKAN DISINI: Tambahkan "/verifikasi" di akhir URL
      await axios.patch(`/api/admin/izin/${id_izin}/verifikasi`, {
        status_persetujuan: newStatus,
        keterangan_verifikator: "Diupdate oleh Admin via Dashboard" // Opsional
      });

      // Refresh data setelah update
      Swal.fire("Berhasil", "Status izin diperbarui", "success");
      queryClient.invalidateQueries(["admin-izin"]);

    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Terjadi kesalahan sistem", "error");
    }
  };
  return (
    <section>
      <h2 className="text-xl font-bold mb-4">📝 Verifikasi Izin / WFH</h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Nama</th>
              <th className="p-2 border">Jenis</th>
              <th className="p-2 border">Tanggal</th>
              <th className="p-2 border">Alasan</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {izinData.map((i) => (
              <tr key={i.id_izin}>
                <td className="border p-2">{i.akun?.username}</td>
                <td className="border p-2">{i.jenis_izin}</td>
                <td className="border p-2">
                  {i.tanggal_mulai} → {i.tanggal_selesai}
                </td>
                <td className="border p-2">{i.alasan}</td>
                <td className="border p-2">
                  <select
                    value={i.status_persetujuan}
                    onChange={async (e) => {
                      await axios.patch(`/api/admin/izin/${i.id_izin}/verifikasi`, {
                        status_persetujuan: e.target.value,
                        id_verifikator: localStorage.getItem("id_akun"),
                      });
                      fetchIzinList(); // refresh tabel
                    }}
                    className={`border p-2 rounded w-full ${i.status_persetujuan === "DISETUJUI"
                      ? "bg-green-100 text-green-700"
                      : i.status_persetujuan === "DITOLAK"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="DISETUJUI">DISETUJUI</option>
                    <option value="DITOLAK">DITOLAK</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={izinPage === 1}
            onClick={() => setIzinPage(izinPage - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            ◀️ Previous
          </button>

          <span>Halaman {izinPage}</span>

          <button
            disabled={izinData.length < izinLimit}
            onClick={() => setIzinPage(izinPage + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next ▶️
          </button>
        </div>

      </div>
    </section>
  );
}
