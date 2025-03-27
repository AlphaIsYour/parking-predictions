# 🅿️ Sistem Prediksi & Manajemen Parkir UB

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

Sistem cerdas untuk memprediksi kepadatan parkir dan manajemen real-time di Universitas Brawijaya. Dilengkapi dengan integrasi AI, peta interaktif, dan laporan langsung dari pengguna.

## 🌟 Fitur Utama
- **Prediksi AI**: Ramal kepadatan parkir berdasarkan jam & hari
- **Real-time Tracking**: Update status parkir secara langsung
- **Laporan Pengguna**: Kirim status parkir terbaru
- **Filter & Sorting**: Cari parkir berdasarkan status, kapasitas, dll
- **Statistik Visual**: Grafik distribusi status parkir
- **Navigasi**: Integrasi Google Maps ke lokasi parkir
- **Responsive Design**: Akses dari mobile & desktop

## 🛠️ Teknologi
| Kategori         | Teknologi                                                                 |
|------------------|---------------------------------------------------------------------------|
| **Frontend**     | React.js, Next.js, Leaflet, Chart.js, Socket.io-client                    |
| **Backend**      | Express.js, PostgreSQL, Socket.io, Python (ML Model)                     |
| **Lainnya**      | Docker (Opsional), Nginx (Opsional), Redis (Rate Limiting)               |

## 📥 Instalasi
### Prasyarat
- Node.js 18.x
- PostgreSQL 15+
- Python 3.10+ (untuk model ML)

### Langkah-langkah
1. **Clone Repositori**
   ```bash
   git clone https://github.com/username/parking-ub.git
   cd parking-ub
2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Isi variabel environment di .env
3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local
4. **Setup Python Environment (Model ML)**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   pip install -r requirements.txt

---

### ⚙️ Konfigurasi
**Environtment Variables**
**Backend (.env)**
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/parkir_ub
   PORT=5001
   PYTHON_PATH=C:/path/to/python.exe  # Path ke Python environment
   ```
**Frontend(.env.local)**
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:5001
  ```
**Database Setup**
Jalankan query SQL berikut di PostgreSQL:
  ```env
  CREATE TABLE lokasi_parkir (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  status VARCHAR(20) CHECK (status IN ('kosong', 'ramai', 'penuh')),
  kapasitas INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE laporan_parkir (
    id SERIAL PRIMARY KEY,
    lokasi_id INT REFERENCES lokasi_parkir(id),
    kepadatan VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
---


### 🚀 Menjalankan Aplikasi
**Backend**
  ```bash
  cd backend
  npm start
  ```
**Frontend**
  ```bash
  cd frontend
  npm run dev
  ```
Buka http://localhost:3000 di browser.

### 🤝 Berkontribusi
1. Fork repositori
2. Buat branch fitur baru
   ```bash
   git checkout -b fitur-baru
4. Commit perubahan
   ```bash
   git commit -m 'Menambahkan fitur ... '
6. Push ke branch
   ```bash
   git push origin fitur-baru
8. Buat Pull Request

---

### 📜 Lisensi
*Proyek ini dilisensikan di bawah MIT License.*

**Dikembangkan oleh Youralpha**
- 📧 Email: alphrenoorz@gmail.com
- 💼 LinkedIn: [Alphareno Ys.](https://linkedin.com/in/alphareno-yanuar-syaputra-76210328a)

---

Thank you! 
