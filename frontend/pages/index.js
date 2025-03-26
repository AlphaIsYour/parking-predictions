import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { io } from "socket.io-client";
const MapParkir = dynamic(() => import("../components/MapParkir"), {
  ssr: false,
});

export default function Home() {
  const [lokasiId, setLokasiId] = useState("");
  const [prediksi, setPrediksi] = useState(null);
  const [status, setStatus] = useState("kosong");
  const [jam, setJam] = useState("");
  const [hari, setHari] = useState("");
  const [parkirData, setParkirData] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    minKapasitas: "",
    maxKapasitas: "",
  });

  // Fungsi untuk mengambil data awal
  const fetchInitialData = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/lokasi-parkir");
      const data = await res.json();
      setParkirData(data);
    } catch (err) {
      console.error("Gagal mengambil data awal:", err);
    }
  };

  // Fungsi filter
  const fetchDataWithFilters = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await fetch(
        `http://localhost:5001/api/lokasi-parkir/filter?${queryParams}`
      );
      const data = await res.json();
      setParkirData(data);
    } catch (err) {
      console.error("Gagal filter:", err);
    }
  };

  useEffect(() => {
    fetchInitialData();

    const socket = io("http://localhost:5001");
    socket.on("parkir-update", (data) => {
      setParkirData(data);
    });

    return () => socket.disconnect();
  }, []);

  const checkPrediksi = async () => {
    // Validasi input
    if (!jam || !hari) {
      alert("Harap isi jam dan hari terlebih dahulu!");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5001/api/prediksi/1?jam=${jam}&hari=${hari}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors", // <--- Penting untuk development
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengambil prediksi");
      }

      const data = await response.json();
      setPrediksi(data);
    } catch (err) {
      alert(`ERROR: ${err.message}`);
      console.error("Detail error:", {
        url: `http://localhost:5001/api/prediksi/1?jam=${jam}&hari=${hari}`,
        error: err.stack,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/api/lapor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lokasiId: Number(lokasiId),
          status,
        }),
      });

      if (!response.ok) throw new Error("Gagal mengirim laporan");

      alert("Laporan berhasil! 🎉");
      setLokasiId("");
      setStatus("kosong");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", color: "#fff", marginBottom: "20px" }}>
        Sistem Prediksi Parkir UB
      </h1>

      {/* Section Filter */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          color: "#000",
        }}
      >
        <h2 style={{ color: "#34495e", marginBottom: "15px" }}>
          🔍 Filter Parkir
        </h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              padding: "8px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              minWidth: "150px",
            }}
          >
            <option value="">Semua Status</option>
            <option value="kosong">Kosong</option>
            <option value="ramai">Ramai</option>
            <option value="penuh">Penuh</option>
          </select>

          <input
            type="number"
            placeholder="Kapasitas Min"
            value={filters.minKapasitas}
            onChange={(e) =>
              setFilters({ ...filters, minKapasitas: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              width: "120px",
            }}
          />

          <input
            type="number"
            placeholder="Kapasitas Max"
            value={filters.maxKapasitas}
            onChange={(e) =>
              setFilters({ ...filters, maxKapasitas: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              width: "120px",
            }}
          />

          <button
            onClick={fetchDataWithFilters}
            style={{
              padding: "8px 15px",
              backgroundColor: "#e67e22",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Peta */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ color: "#fff", marginBottom: "10px" }}>Peta Parkir UB</h2>
        <MapParkir parkirData={parkirData} />
      </div>

      {/* ... (section prediksi dan laporan tetap sama seperti sebelumnya) ... */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#34495e" }}>🕵️ Cek Prediksi Kepadatan</h2>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            type="number"
            min="0"
            max="23"
            placeholder="Jam (0-23)"
            value={jam}
            onChange={(e) => setJam(e.target.value)}
            style={{
              color: "black",
              padding: "8px",
              borderRadius: "5px",
              border: "1px solid #ddd",
            }}
          />
          <select
            value={hari}
            onChange={(e) => setHari(e.target.value)}
            style={{
              padding: "8px",
              color: "black",
              borderRadius: "5px",
              border: "1px solid #ddd",
            }}
          >
            <option value="">Pilih Hari</option>
            <option value="1">Senin</option>
            <option value="2">Selasa</option>
            <option value="3">Rabu</option>
            <option value="4">Kamis</option>
            <option value="5">Jumat</option>
            <option value="6">Sabtu</option>
            <option value="0">Minggu</option>
          </select>
          <button
            onClick={checkPrediksi}
            style={{
              padding: "8px 15px",
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Cek Prediksi
          </button>
        </div>

        {/* Hasil Prediksi */}
        {prediksi && (
          <div
            style={{
              backgroundColor: "white",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #3498db",
            }}
          >
            <h3 style={{ color: "#3498db", marginTop: 0 }}>
              📊 Hasil Prediksi
            </h3>
            <p style={{ color: "#000" }}>📍 Lokasi: Parkiran Vokasi</p>
            <p style={{ color: "#000" }}>⏰ Jam: {prediksi.jam}.00</p>
            <p style={{ color: "#000" }}>📅 Hari: {prediksi.hari}</p>
            <p style={{ color: "#000" }}>
              🚦 Status: <strong>{prediksi.prediksi.toUpperCase()}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Section Lapor Parkir */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#34495e" }}>📢 Lapor Status Parkir</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
          <input
            type="number"
            placeholder="ID Lokasi"
            value={lokasiId}
            onChange={(e) => setLokasiId(e.target.value)}
            required
            style={{
              color: "black",
              padding: "8px",
              borderRadius: "5px",
              border: "1px solid #ddd",
            }}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              color: "black",
              padding: "8px",
              borderRadius: "5px",
              border: "1px solid #ddd",
            }}
          >
            <option value="kosong">Kosong</option>
            <option value="ramai">Ramai</option>
            <option value="penuh">Penuh</option>
          </select>
          <button
            type="submit"
            style={{
              padding: "8px 15px",
              backgroundColor: "#2ecc71",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Kirim Laporan
          </button>
        </form>
      </div>
    </div>
  );
}
