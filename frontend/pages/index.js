import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { io } from "socket.io-client";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { FiSun, FiMoon, FiNavigation } from "react-icons/fi";
import LoadingSpinner from "../components/LoadingSpinner";
import ChartSkeleton from "../components/ChartSkeleton";
import ChartDataLabels from "chartjs-plugin-datalabels";
import Swal from "sweetalert2";
Chart.register(ChartDataLabels);
const MapParkir = dynamic(() => import("../components/MapParkir"), {
  ssr: false,
});

Chart.register(...registerables);

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [parkirData, setParkirData] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [prediksi, setPrediksi] = useState(null);
  const [lokasiId, setLokasiId] = useState("");
  const [status, setStatus] = useState("kosong");
  const [jam, setJam] = useState("");
  const [hari, setHari] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    minKapasitas: "",
    maxKapasitas: "",
    sortBy: "nama",
    order: "ASC",
  });

  const checkPrediksi = async () => {
    if (!jam || jam === "") {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Harap masukkan jam terlebih dahulu!",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Validasi rentang jam
    const jamNumber = parseInt(jam);
    if (isNaN(jamNumber) || jamNumber < 0 || jamNumber > 23) {
      Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Jam harus berupa angka antara 0-23!",
        confirmButtonColor: "#d33",
      });
      return;
    }

    if (!hari) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Harap pilih hari terlebih dahulu!",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5001/api/prediksi/1?jam=${jam}&hari=${hari}`,
        {
          headers: { "Content-Type": "application/json" },
          mode: "cors",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengambil prediksi");
      }

      const data = await response.json();

      Swal.fire({
        icon: "info",
        title: "Hasil Prediksi",
        html: `
          <p>📍 Lokasi: Parkiran Vokasi</p>
          <p>⏰ Jam: ${data.jam}.00</p>
          <p>📅 Hari: ${data.hari}</p>
          <p>🚦 Status: <strong>${data.prediksi.toUpperCase()}</strong></p>
        `,
        confirmButtonColor: "#3085d6",
      });

      setPrediksi(data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Prediksi Gagal",
        text: err.message || "Terjadi kesalahan saat mengambil prediksi",
        confirmButtonColor: "#d33",
        footer: '<a href="#">Hubungi admin jika masalah berlanjut</a>',
      });
      console.error("Detail error:", {
        url: `http://localhost:5001/api/prediksi/1?jam=${jam}&hari=${hari}`,
        error: err.stack,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lokasiId) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Harap masukkan ID Lokasi!",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/lapor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lokasiId: Number(lokasiId),
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Gagal mengirim laporan");
      }

      Swal.fire({
        icon: "success",
        title: "Laporan Berhasil",
        text: "Status parkir berhasil diperbarui!",
        confirmButtonColor: "#28a745",
        timer: 2000,
        timerProgressBar: true,
      });

      setLokasiId("");
      setStatus("kosong");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Laporan Gagal",
        text: err.message || "Gagal mengirim laporan",
        confirmButtonColor: "#d33",
        footer: '<a href="#">Hubungi admin jika masalah berlanjut</a>',
      });
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const [parkirRes, statsRes] = await Promise.all([
        fetch(`http://localhost:5001/api/lokasi-parkir/filter?${queryParams}`),
        fetch("http://localhost:5001/api/statistik"),
      ]);

      const parkirData = await parkirRes.json();
      const statsData = await statsRes.json();

      setParkirData(parkirData);
      setStatsData(statsData);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const socket = io("http://localhost:5001");
    socket.on("parkir-update", fetchData);

    return () => socket.disconnect();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const themeClasses = darkMode
    ? "bg-gray-900 text-white"
    : "bg-gray-50 text-gray-800";

  return (
    <div className={`min-h-screen p-6 ${themeClasses}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🅿️ Sistem Prediksi Parkir UB</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-opacity-20 hover:bg-opacity-30 bg-gray-500"
          >
            {darkMode ? <FiSun size={24} /> : <FiMoon size={24} />}
          </button>
        </div>

        {isLoading && <LoadingSpinner />}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">🔍 Filter & Sorting</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="p-2 rounded border dark:bg-gray-700"
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
              className="p-2 rounded border text-white dark:bg-gray-700"
            />

            <input
              type="number"
              placeholder="Kapasitas Max"
              value={filters.maxKapasitas}
              onChange={(e) =>
                setFilters({ ...filters, maxKapasitas: e.target.value })
              }
              className="p-2 rounded border text-white dark:bg-gray-700"
            />

            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
              className="p-2 rounded border dark:bg-gray-700"
            >
              <option value="nama">Urutkan Nama</option>
              <option value="kapasitas">Urutkan Kapasitas</option>
            </select>

            <select
              value={filters.order}
              onChange={(e) =>
                setFilters({ ...filters, order: e.target.value })
              }
              className="p-2 rounded border dark:bg-gray-700"
            >
              <option value="ASC">A-Z / Kecil-Besar</option>
              <option value="DESC">Z-A / Besar-Kecil</option>
            </select>

            <button
              onClick={fetchData}
              className="bg-orange-500 text-white p-2 rounded hover:bg-orange-600 transition-colors"
            >
              Terapkan Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">🗺️ Peta Parkir UB</h2>
            <div className="h-96">
              <MapParkir parkirData={parkirData} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">📊 Statistik Parkir</h2>
            {isLoading ? (
              <ChartSkeleton />
            ) : statsData ? (
              <Bar
                className="mt-30"
                data={{
                  labels: statsData.map((item) => item.status.toUpperCase()),
                  datasets: [
                    {
                      label: "Jumlah Lokasi",
                      data: statsData.map((item) => item.total),
                      backgroundColor: [
                        "rgba(46, 204, 113, 0.8)",
                        "rgba(231, 76, 60, 0.8)",
                        "rgba(241, 196, 15, 0.8)",
                      ],
                      borderColor: ["#27ae60", "#c0392b", "#f39c12"],
                      borderWidth: 2,
                      borderRadius: 8,
                      barThickness: 70,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: {
                        color: darkMode ? "#fff" : "#2d3748",
                        font: { size: 14 },
                      },
                    },
                    tooltip: {
                      backgroundColor: darkMode ? "#2d3748" : "#fff",
                      titleColor: darkMode ? "#fff" : "#2d3748",
                      bodyColor: darkMode ? "#fff" : "#2d3748",
                    },
                    datalabels: {
                      color: darkMode ? "#fff" : "#2d3748",
                      anchor: "center",
                      align: "top",
                      formatter: (value) => `${value} Lokasi`,
                      offset: 10,
                    },
                  },
                  scales: {
                    y: {
                      ticks: {
                        color: darkMode ? "#fff" : "#2d3748",
                        stepSize: 1,
                      },
                      grid: { color: darkMode ? "#4a5568" : "#e2e8f0" },
                    },
                    x: {
                      ticks: {
                        color: darkMode ? "#fff" : "#2d3748",
                        font: { weight: "bold" },
                        // padding: 10,
                      },
                      grid: { display: false },
                    },
                  },
                  animation: {
                    duration: 1500,
                    easing: "easeOutQuart",
                  },
                  onClick: (_, elements) => {
                    if (elements.length > 0) {
                      const index = elements[0].index;
                      const status = statsData[index].status;
                      setFilters({ ...filters, status });
                    }
                  },
                }}
              />
            ) : (
              <p className="text-center text-gray-500">
                🔍 Data statistik tidak tersedia
              </p>
            )}
          </div>
        </div>

        <div
          className="dark:bg-gray-800"
          style={{
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "white", marginBottom: "10px" }}>
            🕵️ Cek Prediksi Kepadatan
          </h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input
              className="dark:bg-gray-700"
              type="number"
              min="0"
              max="23"
              placeholder="Jam (0-23)"
              value={jam}
              onChange={(e) => setJam(e.target.value)}
              style={{
                color: "white",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                width: "215px",
              }}
            />
            <select
              className="dark:bg-gray-700"
              value={hari}
              onChange={(e) => setHari(e.target.value)}
              style={{
                padding: "8px",
                color: "white",
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
              className="bg-orange-500"
              style={{
                padding: "8px 15px",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cek Prediksi
            </button>
          </div>

          {prediksi && (
            <div
              className="dark:bg-gray-700"
              style={{
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #fff",
              }}
            >
              <h3 style={{ color: "white", marginTop: 0 }}>
                📊 Hasil Prediksi
              </h3>
              <p style={{ color: "#fff" }}>📍 Lokasi: Parkiran Vokasi</p>
              <p style={{ color: "#fff" }}>⏰ Jam: {prediksi.jam}.00</p>
              <p style={{ color: "#fff" }}>📅 Hari: {prediksi.hari}</p>
              <p style={{ color: "#fff" }}>
                🚦 Status: <strong>{prediksi.prediksi.toUpperCase()}</strong>
              </p>
            </div>
          )}
        </div>

        <div
          className="dark:bg-gray-800"
          style={{
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "white", marginBottom: "10px" }}>
            📢 Lapor Status Parkir
          </h2>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", gap: "10px" }}
          >
            <input
              className="dark:bg-gray-700"
              type="number"
              placeholder="ID Lokasi"
              value={lokasiId}
              onChange={(e) => setLokasiId(e.target.value)}
              required
              style={{
                color: "white",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="dark:bg-gray-700"
              style={{
                color: "white",
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
              className="bg-orange-500"
              style={{
                padding: "8px 15px",
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
    </div>
  );
}
