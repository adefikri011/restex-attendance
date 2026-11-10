# DESIGN.md — RESTEX Attendance

Dokumen konsep UI/UX untuk RESTEX Attendance, berdasarkan PRD Sistem Absensi QR Code RESTEX v0.2.  
Seluruh warna di bawah merupakan rekomendasi awal dan dapat disesuaikan kembali dengan logo resmi RESTEX.

---

## 1. Tujuan Desain

Antarmuka RESTEX Attendance dirancang untuk membantu pengurus:
1. **Mencatat kehadiran anggota dengan cepat** melalui scanner QR.
2. **Mengelola anggota, periode, dan sesi absensi** tanpa mencampur arsip periode lama.
3. **Memahami status anggota dan status kehadiran** dengan jelas.
4. **Mengurangi kesalahan pencatatan** melalui konfirmasi dan validasi yang mudah dipahami.

### Pendekatan Perangkat
- **Desktop-first** untuk halaman administrasi seperti data anggota, periode, dan laporan.
- **Mobile-first** untuk halaman scanner karena kemungkinan digunakan saat kegiatan berlangsung.
- Satu aplikasi web responsif, bukan aplikasi mobile native.

---

## 2. Arah Visual

### Tema: Clean Tech Dashboard
Identitas visual mengambil inspirasi dari materi publikasi RESTEX: warna navy, putih, dan aksen magenta-merah. Namun, elemen poster yang ramai, tekstur, dan efek dekoratif tidak digunakan sebagai latar dashboard agar data tetap mudah dibaca.

### Karakter Tampilan
- Modern dan berhubungan dengan teknologi.
- Tegas, tetapi tetap sederhana untuk penggunaan harian.
- Mengutamakan keterbacaan tabel dan informasi.
- Menggunakan aksen warna secara terukur, bukan memenuhi seluruh halaman.

### Penggunaan Identitas RESTEX
- Gunakan logo resmi RESTEX dalam bentuk asli.
- Jangan mengubah warna atau proporsi logo.
- Hindari penggunaan foto, tekstur, atau ornamen poster sebagai latar halaman administrasi.
- Aksen magenta-merah digunakan untuk highlight kecil, bukan untuk semua tombol dan status.

---

## 3. Palet Warna

### Warna Utama
| Token | Warna | Penggunaan |
|---|---|---|
| `brand-950` | `#08263D` | Latar sidebar gelap atau area scanner |
| `brand-900` | `#0B2F4A` | Warna identitas utama, tombol utama |
| `brand-700` | `#1D5C7C` | Hover, tautan, atau elemen pendukung |
| `accent-600` | `#D83F63` | Highlight, penanda aktif, aksen kecil |
| `accent-50` | `#FCECEF` | Latar lembut untuk aksen |

### Warna Netral
| Token | Warna | Penggunaan |
|---|---|---|
| `background` | `#F5F7FA` | Latar utama halaman |
| `surface` | `#FFFFFF` | Card, tabel, modal, dan panel |
| `border` | `#E2E8F0` | Garis pemisah dan border komponen |
| `text-primary` | `#172B3A` | Judul dan isi utama |
| `text-secondary` | `#64748B` | Keterangan, label, dan teks pendukung |

### Warna Status
Warna status dipakai bersama teks atau ikon. Informasi tidak boleh disampaikan melalui warna saja.

#### Status Keanggotaan:
| Status | Warna yang Disarankan |
|---|---|
| **Aktif** | Hijau |
| **Cuti** | Amber |
| **Keluar/Resign** | Merah |
| **Alumni/Demisioner** | Abu-abu |

#### Status Kehadiran:
| Status | Warna yang Disarankan |
|---|---|
| **Hadir** | Hijau |
| **Izin** | Biru |
| **Sakit** | Amber |
| **Alpha** | Merah |

#### Status Sesi:
| Status | Warna yang Disarankan |
|---|---|
| **Draft** | Abu-abu |
| **Aktif** | Hijau |
| **Ditutup** | Abu-abu gelap |

*Catatan: Warna `accent-600` adalah aksen identitas, bukan warna untuk setiap pesan error. Error dan aksi berbahaya tetap memakai warna semantik merah.*

---

## 4. Tipografi dan Elemen Dasar

### Tipografi
- **Font utama**: Inter
- **Fallback**: system UI sans-serif
- **Isi tabel dan teks utama**: 14–16 px
- **Label dan keterangan**: 12–14 px
- **Judul halaman**: 24–28 px
- **Judul bagian atau card**: 16–20 px

### Bentuk dan Jarak
- Gunakan skala jarak berbasis kelipatan 8 px.
- Radius card dan modal: 12–16 px.
- Tinggi minimum input dan tombol utama: 44 px, khususnya untuk penggunaan mobile.
- Shadow dibuat tipis; utamakan border yang jelas daripada bayangan berat.
- Animasi transisi sederhana dan singkat. Hindari efek berlebihan pada halaman scanner.

### Ikon
Gunakan ikon garis sederhana dan konsisten, misalnya gaya Lucide. Ikon harus disertai label untuk tindakan penting seperti **Scan QR**, **Tutup Sesi**, dan **Export Excel**.

---

## 5. Struktur Navigasi

Navigasi utama berada di sidebar pada desktop. Pada layar kecil, sidebar berubah menjadi menu drawer.

| Menu | Isi |
|---|---|
| **Dashboard** | Ringkasan dan informasi periode aktif |
| **Sesi Absensi** | Daftar sesi, detail sesi, dan scanner |
| **Anggota** | Daftar, detail, tambah, dan import anggota |
| **Periode** | Daftar periode, pengaturan periode aktif, transisi anggota |
| **Laporan** | Rekap sesi dan riwayat kehadiran anggota |
| **Audit Log** | Riwayat tindakan penting |
| **Akun Pengurus** | Pengelolaan akun dan role (khusus Super Admin) |

Di bagian header, tampilkan periode yang sedang aktif dengan jelas, misalnya:  
**Periode Aktif: 2026–2027**

Periode aktif sebaiknya tetap terlihat agar pengurus tidak salah membuat sesi atau mengelola data pada periode yang keliru.

---

## 6. Akses Berdasarkan Role

| Role | Akses Utama pada Antarmuka |
|---|---|
| **Super Admin** | Seluruh fitur, termasuk pengelolaan akun pengurus, periode, dan role |
| **Admin** | Kelola anggota, periode, sesi, perubahan status kehadiran, laporan, dan audit log |
| **Operator** | Sesi aktif, scanner, pencatatan manual darurat pada sesi aktif, dan rekap sesi berjalan |
| **Anggota** | Tidak memiliki akun pada MVP |

Menu yang tidak boleh diakses oleh suatu role tidak ditampilkan. Pemeriksaan hak akses tetap harus dilakukan oleh sistem backend, bukan hanya dengan menyembunyikan menu di frontend.

---

## 7. Tata Letak Aplikasi

### Desktop
- Sidebar berisi logo/nama RESTEX Attendance dan menu utama.
- Header menampilkan judul halaman, periode aktif, dan akun pengguna.
- Konten menggunakan latar abu-abu muda (`#F5F7FA`) dengan card putih (`#FFFFFF`).
- Tabel digunakan untuk data yang perlu dibandingkan atau dikelola.

### Mobile
- Sidebar berubah menjadi drawer yang dibuka melalui tombol menu.
- Scanner menggunakan halaman penuh agar kamera dan hasil scan mudah terlihat.
- Tabel panjang dapat berubah menjadi daftar card atau menggunakan scroll horizontal yang jelas.
- Tombol utama ditempatkan pada posisi yang mudah dijangkau dengan jempol.

---

## 8. Rekomendasi Halaman

### 8.1 Login
Halaman login dibuat sederhana dan tidak ramai.
- **Komponen**: Logo RESTEX, Nama aplikasi (*RESTEX Attendance*), Input email/username dan password, Tombol masuk, Pesan error jika kredensial tidak sesuai.
- Tidak perlu menampilkan form pendaftaran anggota karena akun anggota tidak termasuk MVP.

### 8.2 Dashboard
Dashboard menampilkan ringkasan sesuai hak akses pengguna.
- **Untuk Admin dan Super Admin**: Periode aktif, jumlah anggota aktif, ringkasan sesi periode berjalan, sesi yang sedang aktif, dan akses cepat (buat sesi, daftar anggota, laporan).
- **Untuk Operator**: Informasi sesi aktif, tombol utama *Buka Scanner*, jumlah kehadiran pada sesi tersebut, dan ringkasan Hadir/Izin/Sakit/Alpha.

### 8.3 Anggota
- **Daftar Anggota**: Pencarian nama/NIM, filter divisi/angkatan/status keanggotaan, penanda periode aktif, tombol tambah & import Excel, serta tabel anggota.
- **Detail Anggota**: Identitas anggota, status keanggotaan periode berjalan, QR Code (dilihat/diunduh), riwayat kehadiran, dan riwayat perubahan status. Token QR tidak ditampilkan sebagai teks biasa.

### 8.4 Import Anggota
Alur import terdiri dari:
1. Unduh template Excel.
2. Pilih file `.xlsx`.
3. Tampilkan pratinjau isi file.
4. Tandai baris valid dan baris error beserta alasannya.
5. Konfirmasi sebelum simpan.
6. Hasil import setelah selesai. Data tidak disimpan sebelum pengurus mengonfirmasi.

### 8.5 Periode
Halaman periode menampilkan daftar periode kepengurusan, rentang tanggal, dan penanda periode aktif.
- **Ubah Periode Aktif**: Tampilkan modal konfirmasi beserta dampak perubahan terhadap sesi berikutnya.
- **Demisioner Massal**: Dialog khusus langkah-demi-langkah (tinjau periode lalu, daftar anggota terdampak, perpanjangan keanggotaan, konfirmasi akhir, dan pencatatan audit log).

### 8.6 Sesi Absensi
- **Daftar Sesi**: Nama, jenis kegiatan, tanggal/waktu, periode, status (Draft, Aktif, Ditutup), dan statistik kehadiran.
- **Detail Sesi**: Daftar anggota & status kehadiran. Konfirmasi penutupan sesi menjelaskan bahwa anggota aktif tanpa status otomatis menjadi **Alpha**.

### 8.7 Scanner QR (Mobile-First)
- **Komponen Utama**: Nama & status sesi aktif, area kamera responsif, penghitung kehadiran real-time, pemilih kamera, tombol pencatatan manual cadangan, dan tombol kembali.
- **Umpan Balik Scanner**:
  - *QR Valid*: Tampilkan nama, ID anggota, divisi, waktu scan, dan status Hadir.
  - *Scan Ganda*: Tampilkan pesan *"Anggota sudah absen pukul [HH:mm]"*.
  - *QR Tidak Dikenal*: Tampilkan pesan *"QR tidak dikenali. Periksa kartu atau cari manual"*.
  - *Anggota Nonaktif*: Tampilkan status keanggotaan (Cuti/Keluar/Alumni) dan jelaskan bahwa kehadiran tidak dicatat.
  - *Kamera/Jaringan Bermasalah*: Tampilkan pesan error dan instruksi fallback manual.

### 8.8 Pencatatan Manual (Cadangan Lupa Lanyard / QR Rusak)
1. Cari anggota via nama/NIM di modal scanner.
2. Verifikasi identitas anggota secara langsung.
3. Tekan *Catat Hadir Manual*.
4. Wajib mengisi alasan (lupa lanyard / QR rusak / lainnya).
5. Konfirmasi simpan $\rightarrow$ Tersimpan sebagai metode **Manual** dan tercatat di Audit Log.

### 8.9 Laporan dan Rekap
- Filter berdasarkan periode, sesi, rentang waktu, dan status kehadiran.
- Tampilan rekap per sesi & riwayat per anggota.
- Tombol export Excel (`.xlsx`).
- Label status keanggotaan dan status kehadiran dibedakan secara visual.

### 8.10 Audit Log dan Akun Pengurus
- Timeline/Daftar riwayat aksi sensitif (ubah status anggota, absen manual, demisioner massal, ubah status kehadiran, ubah role pengurus, regenerate QR).
- Halaman pengelolaan akun pengurus (Super Admin saja).

---

## 9. Komponen UI yang Disarankan

| Komponen | Kegunaan |
|---|---|
| **Sidebar / Mobile Drawer** | Navigasi utama berdasarkan role |
| **Header Halaman** | Judul, periode aktif, dan aksi utama |
| **Badge Status** | Menampilkan status anggota, sesi, atau kehadiran |
| **Kartu Statistik** | Menampilkan jumlah anggota atau ringkasan sesi |
| **Tabel Data** | Mengelola anggota, sesi, dan laporan |
| **Search & Filter** | Memudahkan pencarian data |
| **Modal Konfirmasi** | Mencegah kesalahan pada aksi penting |
| **Toast / Alert** | Memberi konfirmasi singkat setelah aksi |
| **Scanner Panel** | Area kamera dan feedback hasil scan |
| **Empty State** | Menjelaskan kondisi ketika belum ada data |
| **Loading State** | Menandai data atau proses yang sedang dimuat |
| **Error State** | Menjelaskan masalah dan tindakan yang dapat dilakukan |

---

## 10. Status dan Umpan Balik

Setiap aksi penting harus memberikan feedback yang jelas:
- *Berhasil simpan*: "Anggota berhasil ditambahkan."
- *Import selesai*: "Import selesai. 38 anggota berhasil ditambahkan, 2 baris perlu diperbaiki."
- *Sesi ditutup*: "Sesi berhasil ditutup. Kehadiran anggota aktif yang belum tercatat diperbarui menjadi Alpha."
- *Gagal*: "Perubahan belum tersimpan. Periksa koneksi lalu coba kembali."

---

## 11. Responsivitas dan Aksesibilitas

- Area sentuh tombol minimal **44 × 44 px** pada versi mobile.
- Badge status selalu menyertakan **teks + warna** (bukan warna saja).
- Form input memiliki label jelas (bukan hanya placeholder).
- Layout kompatibel pada browser modern iOS, Android, dan Desktop.

---

## 12. Batasan MVP

Desain MVP **tidak mencakup**:
- Login / Dashboard khusus Anggota.
- Absensi mandiri oleh Anggota.
- Aplikasi mobile native (iOS/Android).
- Status "Terlambat".
- Notifikasi WhatsApp / Email.
- Generator desain kartu lanyard siap cetak.

---

## 13. Keputusan Alur & Asumsi Terkonfirmasi

1. **Keanggotaan & Data Histori**: `member_code` & `qr_token` bersifat permanen. Namun, status aktif diikat pada `period_id`. Saat periode berganti, data kehadiran masa lalu tetap aman di arsip periode tersebut.
2. **Akses Manual Operator**: Operator diizinkan melakukan pencatatan manual **hanya pada Sesi Aktif** melalui tombol cadangan di scanner jika anggota lupa lanyard.
3. **Fleksibilitas Status Izin/Sakit**: Admin dapat mencatat status Izin/Sakit sebelum, saat, maupun setelah sesi ditutup. Seluruh perubahan tercatat di Audit Log.