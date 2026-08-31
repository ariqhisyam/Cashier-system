# 🍵 Matcha Kyoto - Mobile POS System & PWA

A modern, responsive Point-of-Sale (POS) and cashier management web application for **Matcha Kyoto**, built with **Next.js 16 (Turbopack)**, **Tailwind CSS v4**, and **PWA (Progressive Web App)** capabilities.

---

## ✨ Fitur Utama

### 👨‍💼 Role Karyawan (Kasir)
- **Katalog Menu Interaktif:** Grid produk dengan gambar, stok real-time, dan kontrol kuantitas (+/-).
- **Floating Checkout Bar:** Ringkasan pesanan sticky di bagian bawah layar.
- **Pembayaran QRIS:** Menampilkan QRIS dinamis untuk scan pembayaran instan.
- **Struk Digital (Receipt):** Cetak & tampilkan struk pembayaran dengan ID transaksi dan nama kasir aktif.
- **Riwayat Penjualan:** Filter penjualan berdasarkan harian & bulanan beserta detail struk.

### 👑 Role Administrator
- **Dashboard & Analitik:** Ringkasan transaksi harian, pendapatan kotor, dan laba bersih (setelah HPP).
- **Grafik Penjualan:** Visualisasi grafik penjualan dengan filter Harian, Bulanan, dan Tahunan.
- **Kelola Produk (CRUD):** Tambah, edit harga jual, stok, HPP (bahan baku), dan URL gambar.
- **Pengaturan QRIS:** Konfigurasi gambar QRIS toko.
- **Kelola & Generate Karyawan:** Buat akun staf kasir baru dengan sistem *Random Key Generator* (`MK-XXXX`), salin kunci 1-klik, dan toggle status aktif/nonaktif.
- **Semua Riwayat Transaksi:** Pencarian transaksi berdasarkan ID struk.

### 📱 Progressive Web App (PWA)
- **Installable:** Dapat di-install langsung ke homescreen HP (Android & iOS).
- **Offline Support:** Service Worker caching untuk kecepatan loading optimal.
- **Mobile-first Design:** Antarmuka responsif dengan mockup frame di layar desktop.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS Tokens
- **Icons:** [@phosphor-icons/react](https://phosphoricons.com/)
- **State Management:** React Context + LocalStorage Persistence
- **PWA:** Web App Manifest + Custom Service Worker (`sw.js`)

---

## 🚀 Memulai (Getting Started)

1. **Install dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan development server:**
   ```bash
   npm run dev
   ```

3. **Buka di browser:**
   Buka [http://localhost:3000](http://localhost:3000)

---

## 🔑 Kredensial Default

- **Administrator:** `admin123`
- **Karyawan Default:** `kyoto123` *(atau kunci acak yang digenerate oleh Admin)*
