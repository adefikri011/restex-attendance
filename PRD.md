# PRD — Sistem Absensi QR Code RESTEX

| | |
|---|---|
| **Produk** | RESTEX Attendance |
| **Organisasi** | UKM Rekayasa Teknologi (RESTEX), Universitas Nusa Putra |
| **Versi** | 0.3 (Draft MVP + Portal Anggota) |
| **Tanggal** | 10 November 2026 |
| **Status** | Draft diperbarui dengan role dan portal Anggota untuk diusulkan ke pengurus |

---

## 1. Ringkasan

RESTEX Attendance adalah website pencatatan kehadiran anggota UKM RESTEX berbasis QR Code. Setiap anggota memiliki QR Code unik yang dicetak pada lanyard card. Pada akhir pertemuan, pengurus memindai QR Code anggota menggunakan kamera HP atau laptop, lalu kehadiran tercatat otomatis beserta waktunya.

Sistem ini menggantikan absensi lewat Google Forms dan dirancang untuk mengelola **siklus keanggotaan antar-periode kepengurusan** (anggota baru, cuti, keluar/resign, serta demisioner/alumni).

## 2. Latar Belakang dan Masalah

Saat ini absensi dilakukan melalui Google Forms (mengisi nama dan NIM). Kondisi ini punya beberapa kekurangan:

- Anggota harus mengetik data manual setiap pertemuan sehingga lambat dan rawan salah ketik.
- Pengurus harus merekap hasil form secara manual.
- Tidak ada riwayat kehadiran per anggota yang mudah dilihat.
- Form bisa diisi tanpa bukti kehadiran fisik.
- **Sulit mengelola transisi keanggotaan:** Ketika ada perubahan periode kepengurusan, anggota keluar, atau recruitment anggota baru, data bercampur dan tidak teratur.

Dengan adanya lanyard card anggota, QR Code dapat dimanfaatkan sebagai identitas sekaligus alat absensi yang fleksibel mengikut siklus kepengurusan.

## 3. Tujuan dan Metrik Keberhasilan

### Tujuan
1. Mempercepat proses absensi di akhir pertemuan.
2. Menghilangkan rekap manual.
3. Menyediakan riwayat dan laporan kehadiran yang akurat per periode kepengurusan.
4. Mengelola lifecycle anggota (aktif, cuti, keluar, alumni) dengan rapi tanpa merusak arsip lama.
5. Membangun fondasi sistem administrasi keanggotaan yang bisa dikembangkan.

### Metrik Keberhasilan
| Metrik | Target |
|---|---|
| Waktu absensi per anggota | ≤ 5 detik per scan |
| Absensi satu pertemuan (±40 anggota) selesai | ≤ 10 menit |
| Waktu pembuatan rekap pertemuan | Otomatis (0 menit kerja manual) |
| Kesalahan pencatatan ganda | 0 (dicegah sistem) |
| Efisiensi transisi periode kepengurusan | < 15 menit untuk migrasi status massal |

---

## 4. Ruang Lingkup

### Termasuk (MVP)
- Login pengurus dan anggota dengan hak akses berbasis role (RBAC).
- Portal anggota baca-saja untuk melihat profil, riwayat, dan ringkasan absensi pribadi.
- Akun anggota dibuat melalui undangan pengurus dan ditautkan ke data anggota yang sudah terdaftar.
- **Manajemen Periode Kepengurusan** (misal: 2026-2027) dan arsip historis.
- **Manajemen Status Anggota Detail** (Aktif, Cuti, Keluar/Resign, Alumni/Demisioner).
- Fitur **Transisi Periode / Demisioner Massal**.
- Manajemen data anggota (input manual dan import Excel).
- Pembuatan ID anggota dan QR Code unik, serta cetak/unduh QR untuk lanyard.
- Manajemen sesi absensi yang terikat pada periode aktif.
- Scanning QR oleh pengurus.
- Pencatatan status kehadiran: Hadir, Izin, Sakit, Alpha.
- Rekap per sesi, riwayat per anggota, dan export Excel.
- Pencatatan perubahan status (audit log).
- Penanganan anggota yang lupa lanyard atau QR rusak.

### Tidak termasuk (MVP)
- Pertanyaan verifikasi, quiz, atau foto bukti kehadiran.
- Absensi mandiri oleh anggota.
- Pengajuan koreksi absensi dari portal anggota.
- Status "Terlambat".
- Notifikasi (WhatsApp/email).
- Aplikasi mobile native.

---

## 5. Pengguna dan Role

| Role | Deskripsi | Hak akses |
|---|---|---|
| **Super Admin** | Ketua / Pengelola Utama Sistem | Akses penuh: kelola akun pengurus dan anggota, role, periode kepengurusan, transisi periode, anggota, sesi, laporan, dan pengaturan |
| **Admin** | Pengurus Administrasi (mis. Sekretaris) | Kelola data anggota dan undangan akun anggota, status keanggotaan, lihat sesi dan rekap absensi (monitoring baca-saja), serta cetak laporan; tidak membuka/menutup sesi atau mencatat kehadiran |
| **Operator** | Pengurus bertugas scanning | Membuat, membuka, dan menutup sesi; membuka scanner, memindai QR, melakukan pencatatan manual yang beralasan, dan melihat rekap sesi berjalan |
| **Anggota** | Anggota RESTEX | Melihat profil sendiri dan riwayat/ringkasan absensi pribadi; tidak dapat mengubah data anggota atau catatan absensi |

---

## 6. Alur Utama

### 6.1 Alur Absensi (Akhir Pertemuan)
1. Admin/Super Admin memastikan **Periode Aktif** sudah sesuai (misal: 2026-2027).
2. Pertemuan berlangsung seperti biasa.
3. Operator membuat dan mengaktifkan sesi absensi.
4. Di akhir pertemuan, Operator membuka halaman scanner pada sesi aktif.
5. Anggota menunjukkan lanyard, Operator memindai QR Code.
6. Sistem memvalidasi:
   - Token QR valid dan terdaftar.
   - Anggota berstatus **Aktif** di periode berjalan (bukan Nonaktif/Keluar/Alumni).
   - Anggota belum absen pada sesi tersebut.
7. Jika valid, kehadiran dicatat (ID anggota, nama, sesi, tanggal, waktu) dan layar menampilkan konfirmasi.
8. Setelah selesai, Operator menutup sesi; Admin dapat memantau status sesi dan rekapnya.
9. Saat sesi ditutup, seluruh anggota **Aktif** yang belum tercatat Hadir, Izin, atau Sakit ditandai **Alpha** secara otomatis. (Anggota Cuti/Keluar/Alumni diabaikan).

### 6.2 Alur Anggota Lupa Lanyard atau QR Rusak
1. Operator/Admin mencari anggota lewat kolom pencarian (nama atau NIM).
2. Pengurus memverifikasi identitas anggota secara langsung.
3. Pengurus menekan "Catat Hadir Manual" dan wajib memilih alasan (lupa lanyard / QR rusak / lainnya).
4. Kehadiran tersimpan dengan penanda **metode: manual** dan tercatat di audit log.

### 6.3 Alur Anggota Resign / Cuti Tengah Jalan
1. Anggota mengajukan pengunduran diri atau cuti.
2. Admin mengubah status keanggotaan dari **Aktif** menjadi **Keluar** atau **Cuti**.
3. QR Code anggota otomatis di-nonaktifkan. Jika di-scan pada pertemuan berikutnya, sistem akan menampilkan peringatan: *"Anggota tidak aktif / Keluar"*.
4. Anggota yang keluar/cuti **tidak dihitung** lagi dalam kuota absensi sesi berikutnya dan tidak akan kena *Alpha* otomatis.
5. Riwayat absensi sebelum keluar tetap aman dalam database untuk bahan audit.

### 6.4 Alur Transisi Kepengurusan & Pergantian Periode (Siklus Tahunan)
1. Pada akhir masa jabatan, Super Admin menambahkan Periode Baru (misal: `2027-2028`) dan menyetnya menjadi Periode Aktif.
2. **Demisioner Massal:** Super Admin/Admin menjalankan fitur "Demisionerkan Periode Lalu". Anggota pengurus lama otomatis berganti status dari **Aktif** menjadi **Alumni/Demisioner**.
3. **Perpanjang Keanggotaan (Lanjut Pengurus):** Untuk anggota lama yang kembali menjadi pengurus di periode baru, Admin cukup memperbarui statusnya menjadi **Aktif** pada periode baru tanpa perlu cetak QR Code ulang (QR tetap berlaku).
4. **Import Anggota Baru (Oprec):** Admin mengimpor data anggota baru via file Excel. Sistem otomatis membuat ID Anggota baru dan QR Code unik.

---

## 7. Kebutuhan Fungsional

Prioritas: **P0** wajib MVP, **P1** penting, **P2** nanti.

### 7.1 Autentikasi dan Manajemen Role
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-01 | Pengguna yang memiliki akun dapat login dengan email dan password | P0 |
| FR-02 | Sistem menerapkan RBAC dengan empat role (Super Admin, Admin, Operator, Anggota) | P0 |
| FR-03 | Super Admin dapat membuat, menonaktifkan, dan mengubah role akun pengurus; Super Admin/Admin dapat mengundang dan menonaktifkan akun anggota | P0 |
| FR-04 | Sesi login berakhir otomatis setelah tidak aktif dalam waktu tertentu | P1 |
| FR-05 | Pengguna dapat mengubah password sendiri | P1 |

### 7.2 Manajemen Periode & Transisi Keanggotaan
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-06 | Super Admin/Admin dapat membuat dan mengelola Periode Kepengurusan (contoh: 2026-2027) | P0 |
| FR-07 | Hanya ada 1 (satu) Periode Aktif pada satu waktu. Sesi baru otomatis terikat pada periode ini | P0 |
| FR-08 | Sistem mendukung transisi status keanggotaan massal (Ubah status periode lalu menjadi Alumni) | P0 |
| FR-09 | Admin dapat melihat arsip absensi dan riwayat keanggotaan periode-periode sebelumnya | P1 |

### 7.3 Manajemen Anggota & Status Keanggotaan
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-10 | Admin dapat menambah, mengubah, dan mengelola anggota secara manual | P0 |
| FR-11 | Admin dapat mengimpor anggota dari file Excel (.xlsx) dengan template yang disediakan | P0 |
| FR-12 | Import menampilkan pratinjau dan daftar error sebelum data disimpan | P0 |
| FR-13 | Setiap anggota memiliki ID unik (format contoh: `RTX-2026-001`) | P0 |
| FR-14 | Data anggota memuat: nama lengkap, NIM, divisi, angkatan, periode, foto (opsional), dan status keanggotaan | P0 |
| FR-15 | Status keanggotaan meliputi: **Aktif**, **Cuti**, **Keluar/Resign**, dan **Alumni/Demisioner** | P0 |
| FR-16 | Pencarian dan filter anggota berbasis nama, NIM, divisi, angkatan, dan status keanggotaan | P0 |
| FR-17 | Anggota berstatus selain **Aktif** tidak dapat di-scan dan tidak dihitung pada penutupan sesi (tidak kena Alpha) | P0 |

### 7.4 QR Code dan Kartu Identitas
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-20 | Sistem membuat QR Code unik per anggota yang berisi token acak, bukan NIM atau data pribadi | P0 |
| FR-21 | QR bersifat permanen selama anggota berstatus Aktif (meskipun berganti periode) | P0 |
| FR-22 | Admin dapat mengunduh QR per anggota (PNG/SVG) dan massal (ZIP) | P0 |
| FR-23 | Admin dapat membuat ulang (regenerate) QR jika kartu hilang. QR lama otomatis tidak berlaku | P1 |
| FR-24 | Halaman pratinjau kartu anggota (foto, nama, ID, divisi, QR) siap cetak | P2 |

### 7.5 Sesi Absensi
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-30 | Operator dapat membuat sesi: nama, jenis kegiatan, tanggal, waktu; Admin dapat melihat detail dan rekap sesi | P0 |
| FR-31 | Jenis kegiatan fleksibel (Rutin, Workshop, Seminar, Internal, Lainnya) | P0 |
| FR-32 | Sesi memiliki status: Draft, Aktif, Ditutup | P0 |
| FR-33 | Scanning hanya dapat dilakukan pada sesi berstatus Aktif | P0 |
| FR-34 | Saat sesi ditutup, anggota **Aktif** tanpa catatan kehadiran otomatis berstatus **Alpha** | P0 |
| FR-35 | Operator dapat membuka kembali sesi yang sudah ditutup (tercatat di audit log) | P1 |
| FR-36 | Hanya satu sesi yang dapat aktif pada satu waktu | P1 |

### 7.6 Scanning & Validasi Status
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-40 | Halaman scanner menggunakan kamera HP/laptop langsung dari browser | P0 |
| FR-41 | Konfirmasi visual cepat setelah scan valid: Nama, ID, Divisi, Waktu, Status Hadir | P0 |
| FR-42 | Ditolak jika scan ganda: menampilkan pesan "Sudah Absen" beserta waktu scan pertama | P0 |
| FR-43 | Ditolak jika QR tidak dikenal atau anggota berstatus **Nonaktif/Keluar/Alumni** | P0 |
| FR-44 | Umpan balik audio & visual saat scanning | P1 |
| FR-45 | Penghitung real-time (Hadir / Total Anggota Aktif) pada sesi berjalan | P1 |
| FR-46 | Operator dapat mencatat kehadiran secara manual sebagai cadangan dengan kewajiban mengisi alasan | P0 |

### 7.7 Rekap, Laporan & Audit Log
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-60 | Rekap per sesi: statistik Hadir/Izin/Sakit/Alpha dan daftar detail anggota | P0 |
| FR-61 | Riwayat dan persentase kehadiran per anggota per periode | P0 |
| FR-62 | Rekap per bulan, semester, atau total satu periode kepengurusan | P1 |
| FR-63 | Export rekap ke format Excel (.xlsx) | P0 |
| FR-64 | Audit log mencatat seluruh aksi krusial (ubah status keanggotaan, absensi manual, demisioner massal, regenerate QR, ubah role) | P0 |

### 7.8 Portal Anggota
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-70 | Super Admin/Admin dapat mengirim undangan akun kepada anggota yang sudah terdaftar; undangan ditautkan ke satu data anggota dan dapat digunakan satu kali dalam batas waktu tertentu | P0 |
| FR-71 | Anggota dapat melihat profil dan status keanggotaannya sendiri, termasuk riwayat lintas periode | P0 |
| FR-72 | Anggota dapat melihat riwayat absensinya sendiri dengan periode, sesi, tanggal, status, dan metode pencatatan | P0 |
| FR-73 | Anggota dapat melihat ringkasan jumlah Hadir/Izin/Sakit/Alpha dan persentase Hadir per periode; persentase dihitung dari sesi yang ditutup saat anggota berstatus Aktif | P0 |
| FR-74 | Anggota tidak dapat melihat data pribadi atau riwayat absensi anggota lain, serta tidak dapat mengubah data anggota maupun catatan absensi | P0 |

---

## 8. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Kemudahan** | Pengurus baru dapat menggunakan scanner tanpa pelatihan panjang. Mobile-first UI untuk scanner |
| **Performa** | Hasil scan tampil ≤ 2 detik pada koneksi normal |
| **Keamanan** | Password di-hash (Bcrypt/Argon2), wajib HTTPS (kamera browser mensyaratkan HTTPS), RBAC ketat |
| **Privasi** | QR hanya berisi token acak. Data sensitif tersimpan di server. Akses portal anggota dibatasi server-side ke identitas anggota yang terhubung ke akun tersebut |
| **Integritas Data** | Perubahan status keanggotaan tidak menghapus riwayat absensi terdahulu |
| **Kompatibilitas** | Browser modern di Android/iOS (Chrome, Safari) dan Desktop |
| **Skalabilitas** | Mendukung ratusan anggota dan multi-periode kepengurusan tanpa penumpukan data yang memperlambat sistem |

---

## 9. Model Data (Skema Relasional Disesuaikan)

- **periods**: `id`, `name` (e.g., "2026-2027"), `is_active` (boolean), `start_date`, `end_date`, `created_at`
- **users**: `id`, `name`, `email`, `password_hash`, `role` (super_admin/admin/operator/member), `is_active`
- **members**: `id`, `member_code` (RTX-YYYY-NNN), `full_name`, `nim`, `cohort`, `photo_url`, `qr_token_hash`, `user_id` (nullable, unique FK ke users)
- **memberships**: `id`, `member_id`, `period_id`, `division`, `status` (active/on_leave/exited/alumni), `joined_at`, `ended_at`. Data keanggotaan disimpan per periode agar riwayat tidak tertimpa.
- **sessions**: `id`, `period_id` (FK ke periods), `nama`, `jenis`, `tanggal`, `waktu_mulai`, `status` (draft/aktif/ditutup), `dibuat_oleh`
- **attendances**: `id`, `session_id`, `member_id`, `status` (hadir/izin/sakit/alpha), `metode` (scan/manual), `keterangan`, `waktu_tercatat`, `dicatat_oleh`. Constraint unik: `(session_id, member_id)`
- **audit_logs**: `id`, `user_id`, `aksi`, `entitas`, `nilai_lama`, `nilai_baru`, `waktu`

---

## 10. Aturan Bisnis (Business Rules)

1. Hanya ada **1 Periode Kepengurusan yang Aktif** dalam satu waktu.
2. Pembukaan sesi absensi otomatis terikat dengan Periode Kepengurusan yang Aktif.
3. Hanya anggota dengan status **Aktif** yang bisa di-scan QR-nya dan dihitung pada penutupan sesi.
4. Anggota dengan status **Cuti**, **Keluar**, atau **Alumni** diabaikan dari perhitungan Alpha otomatis saat sesi ditutup.
5. Perubahan status keanggotaan (misal dari Aktif menjadi Keluar) tidak menghapus catatan absensi yang sudah terjadi di masa lalu.
6. Regenerate QR membuat token QR lama hangus secara otomatis.
7. Semua tindakan manual (absen manual, ubah status, demisioner massal) tercatat di Audit Log.
8. Role akun menentukan hak akses aplikasi, sedangkan status keanggotaan berlaku per periode; keduanya tidak saling menggantikan.
9. Akun Anggota hanya ditautkan ke satu data anggota. Anggota yang menjadi Alumni tetap dapat mengakses riwayat pribadinya selama akun belum dinonaktifkan.
10. Setiap permintaan portal anggota hanya boleh membaca data anggota yang terhubung ke sesi login; pemeriksaan akses wajib dilakukan di server.

---

## 11. Rekomendasi Teknis

- **Frontend & Backend**: Next.js (React) / Laravel (PHP) sesuai keahlian tim maintenance RESTEX.
- **Database**: PostgreSQL / MySQL dengan indexing pada `qr_token`, `member_code`, dan `period_id`.
- **Deployment**: VPS / Cloud Hosting dengan HTTPS terkonfigurasi (Cloudflare/Let's Encrypt).
- **Library Scan**: HTML5-QRCode / ZXing JS untuk pemindaian via browser.

---

## 12. Rencana Rilis

| Fase | Isi |
|---|---|
| **MVP (V0.2)** | Fitur P0 lengkap: RBAC empat role, undangan akun Anggota, portal Anggota baca-saja (profil, riwayat, ringkasan absensi pribadi), Manajemen Periode Aktif, Transisi Status Anggota (Aktif/Cuti/Keluar/Alumni), QR, Scanner Kamera Browser, Auto-Alpha, Absen Manual, Audit Log, Rekap & Export Excel |
| **Rilis 2** | Fitur P1: Regenerate QR, Arsip Laporan Multi-Periode, Persentase Kehadiran Tahunan, Custom Alerting |
| **Pengembangan Lanjutan** | Pengajuan koreksi absensi oleh Anggota, notifikasi, Cetak Kartu Lanyard Otomatis, Dashboard Analytics Keaktifan Anggota |

---

*Dokumen berikutnya: `DESIGN.md` (konsep UI/UX, alur halaman, komponen UI, identitas visual).*