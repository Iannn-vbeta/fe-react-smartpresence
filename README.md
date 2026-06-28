# SmartPresence Frontend

Proyek ini adalah antarmuka web (frontend) untuk aplikasi SmartPresence. Dibangun menggunakan **React** + **TypeScript** + **Vite**, memberikan performa *development* yang sangat cepat dan build yang ringan.

## 🚀 Prasyarat

Pastikan kamu sudah menginstal salah satu dari *package manager* berikut:
- [Bun](https://bun.sh/), [NPM], dst yg enaknya kalian saja (Sangat direkomendasikan karena proyek ini menggunakan `bun.lock`)
- Node.js (v18+) & NPM / Yarn / PNPM

## ⚙️ Pengaturan Lingkungan (.env)

Proyek ini menggunakan file `.env` untuk mengatur konfigurasi server Vite, port, dan proxy API tanpa perlu mengubah kode sumber.

1. Jika belum ada, buat file `.env` di *root* direktori proyek.
2. Tambahkan konfigurasi berikut ke dalam file `.env`:

```env
VITE_PORT=3000
VITE_API_URL=http://127.0.0.1:8000
VITE_MINIO_URL=http://minio:9090
```

Penjelasan variabel:
- `VITE_PORT`: Port yang akan digunakan oleh *development server* Vite (default: 3000).
- `VITE_API_URL`: URL utama (target) untuk API backend yang digunakan untuk konfigurasi *proxy* `/api` dan `/storage`.
- `VITE_MINIO_URL`: URL utama (target) untuk server penyimpanan lokal MinIO yang digunakan untuk *proxy* `/smartpresence`.

## 📦 Instalasi Dependensi

Jalankan perintah berikut di terminal (pastikan berada di *root* direktori proyek):

```bash
# Jika menggunakan Bun (Direkomendasikan)
bun install

# Jika menggunakan NPM
npm install
```

## 💻 Menjalankan Server Pengembangan

Setelah dependensi terinstal, kamu bisa menjalankan *development server*:

```bash
# Menggunakan Bun
bun run dev

# Menggunakan NPM
npm run dev
```

Aplikasi akan berjalan pada port yang telah kamu atur di file `.env` (misalnya `http://localhost:3000`). Fitur HMR (*Hot Module Replacement*) sudah aktif, sehingga setiap perubahan pada kode sumber akan langsung terlihat di *browser*.

## 🛠️ Perintah Lainnya

Beberapa perintah (scripts) yang bisa kamu gunakan selama pengembangan:

- `bun run build`: Melakukan *build* aplikasi untuk produksi (termasuk pengecekan tipe statis menggunakan TypeScript). Hasil *build* akan ada di dalam folder `dist`.
- `bun run lint`: Menjalankan ESLint untuk memeriksa masalah atau gaya penulisan kode pada proyek.
- `bun run preview`: Menjalankan *local web server* untuk mencoba (*preview*) hasil `build` produksi di mesin lokal.

## 📚 Teknologi Utama
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [React Router DOM](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- *Rich Text Editor*: TinyMCE & React Quill New
