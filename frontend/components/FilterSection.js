export default function FilterSection({ filters, setFilters, fetchData }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-xl font-semibold mb-4">🔍 Filter & Sorting</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Input Filter (Status, Kapasitas) */}
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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

        {/* Sorting */}
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="p-2 rounded border dark:bg-gray-700"
        >
          <option value="nama">Urutkan Nama</option>
          <option value="kapasitas">Urutkan Kapasitas</option>
        </select>

        <select
          value={filters.order}
          onChange={(e) => setFilters({ ...filters, order: e.target.value })}
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
  );
}
