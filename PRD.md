# PRD — Sistem Absensi QR Code RESTEX

| | |
|---|---|
| **Produk** | RESTEX Attendance |
| **Organisasi** | UKM Rekayasa Teknologi (RESTEX), Universitas Nusa Putra |
| **Versi** | 0.5 (Draft kontrol akses halaman) |
| **Tanggal** | 25 November 2026 |
| **Status** | Draft untuk dibahas; belum menjadi spesifikasi implementasi |

---

## 1. Ringkasan

RESTEX Attendance adalah website pencatatan kehadiran anggota UKM RESTEX berbasis QR Code. Setiap anggota memiliki QR Code unik yang dicetak pada lanyard card. Pada akhir pertemuan, pengurus memindai QR Code anggota menggunakan kamera HP atau laptop, lalu kehadiran tercatat otomatis beserta waktunya.

Sistem ini menggantikan absensi lewat Google Forms dan dirancang untuk mengelola **siklus keanggotaan antar-periode kepengurusan** (anggota baru, cuti, keluar/resign, serta demisioner/alumni).

Model akses perlu membedakan hak aplikasi dari jabatan struktural yang berubah setiap periode. Rencana publikasi artikel dan pengumuman juga memerlukan izin khusus untuk menulis, meninjau, dan menerbitkan konten.

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
- Pengumuman publik dasar dengan status draf dan terbit.

### Tidak termasuk (MVP)
- Pertanyaan verifikasi, quiz, atau foto bukti kehadiran.
- Absensi mandiri oleh anggota.
- Pengajuan koreksi absensi dari portal anggota.
- Status "Terlambat".
- Notifikasi (WhatsApp/email).
- Aplikasi mobile native.
- Unggah media untuk artikel dan pengumuman. Humas dapat menerbitkan langsung; hak Infokom dan alur peninjauan untuk role lain masih perlu dibahas.

---

## 5. Pengguna, Hak Akses, dan Jabatan Kepengurusan

| Role | Deskripsi | Hak akses |
|---|---|---|
| **Super Admin** | Pemilik atau pengelola teknis sistem | Akses penuh untuk pemeliharaan sistem. Role ini bukan jabatan organisasi dan tidak otomatis diberikan kepada Ketua Umum. |
| **Admin** | Pengurus yang diberi tugas administrasi aplikasi | Akses ke fungsi administrasi yang ditugaskan. Jabatan pengurus saja tidak cukup untuk memperoleh role ini. |
| **Ketua Divisi** | Pemimpin operasional satu divisi | Mengelola sesi, pemindaian, pencatatan manual, dan rekap pada divisinya. |
| **PJ Divisi** | Pendamping operasional Ketua Divisi | Menjalankan tugas absensi pada divisi yang ditugaskan dengan cakupan akses yang sama-sama dibatasi. |
| **Calon Anggota** | Pendaftar yang masih mengikuti proses seleksi | Melihat status dan informasi seleksi miliknya sendiri. |
| **Anggota** | Anggota RESTEX, termasuk pengurus yang tidak memerlukan hak administrasi aplikasi | Melihat profil dan riwayat pribadi. Jabatan struktural tidak mengubah role Anggota dengan sendirinya. |

### Jabatan struktural per periode

Jabatan dari struktur organisasi disimpan sebagai penugasan yang terikat pada periode, terpisah dari role akun. Struktur periode 2026/2027 mencakup Ketua Umum, Wakil Ketua Umum, Sekretaris, Bendahara, Humas, Infokom, Ketua Divisi, dan PJ Divisi. Humas dan Infokom dapat memiliki lebih dari satu pemegang jabatan.

Ketua Umum pada periode aktif menjadi pengelola rutin sesi absensi pengurus melalui izin khusus. Izin ini tidak memberinya akses penuh Super Admin, dan role Admin atau Super Admin sendiri tidak memberi hak tersebut. Kemungkinan akses darurat Super Admin masih perlu diputuskan. Penugasan Ketua Divisi dan PJ Divisi harus menyebutkan divisinya. Jabatan Bendahara dan Infokom tidak memberi akses administrasi aplikasi secara otomatis.

Anggota yang memiliki jabatan struktural tetap tercatat sebagai peserta absensi pengurus untuk periode penugasannya. Daftar penugasan periode menentukan keikutsertaan mereka.

Humas dapat membuat, menyunting, mengunggah media, dan menerbitkan artikel atau pengumuman secara langsung. Izin ini terbatas pada konten. Hak Infokom untuk mengelola media atau publikasi masih perlu dibahas.

| Jabatan pada struktur | Role akses awal | Izin khusus |
|---|---|---|
| Ketua Umum | Anggota | Mengelola sesi absensi pengurus untuk periode penugasannya |
| Humas | Anggota | Membuat, menyunting, mengunggah media, dan menerbitkan konten |
| Wakil Ketua, Sekretaris, Bendahara, Infokom | Anggota | Ditambah hanya jika tugas aplikasi memerlukannya |
| Ketua Divisi | Ketua Divisi | Terbatas pada divisinya |
| PJ Divisi | PJ Divisi | Terbatas pada divisinya |

### Pengaturan akses halaman

Super Admin dapat menyalakan atau mematikan akses halaman untuk setiap role aplikasi dan jabatan struktural. Izin jabatan hanya berlaku untuk pemegang jabatan pada periode aktif. Akses role dan jabatan bersifat tambahan: izin aktif dari salah satunya memberi akses, sedangkan mematikan izin jabatan tidak membatalkan izin yang sudah diberikan kepada role akun.

Perubahan akses berlaku pada navigasi, halaman, dan API halaman terkait. Pengaturan akses tidak dapat membuka halaman pengelolaan akun atau kontrol akses kepada role lain. Super Admin selalu memiliki akses penuh. Halaman baru perlu didaftarkan pada katalog akses sebelum dapat diatur lewat toggle.

Default awal memberi Ketua Umum akses Absensi Pengurus dan Humas akses Artikel dan Pengumuman. Role Anggota tetap tidak mendapat akses tersebut kecuali Super Admin mengaktifkannya untuk role Anggota, yang akan berlaku bagi seluruh akun Anggota.

---

## 6. Alur Utama

### 6.1 Alur Absensi (Akhir Pertemuan)
1. Admin/Super Admin memastikan **Periode Aktif** sudah sesuai (misal: 2026-2027).
2. Pertemuan berlangsung seperti biasa.
3. Ketua Divisi membuat dan mengaktifkan sesi absensi untuk divisinya.
4. Di akhir pertemuan, Ketua Divisi membuka halaman scanner pada sesi aktif.
5. Anggota menunjukkan lanyard, Ketua Divisi memindai QR Code.
6. Sistem memvalidasi:
   - Token QR valid dan terdaftar.
   - Anggota berstatus **Aktif** di periode berjalan (bukan Nonaktif/Keluar/Alumni).
   - Anggota belum absen pada sesi tersebut.
7. Jika valid, kehadiran dicatat (ID anggota, nama, sesi, tanggal, waktu) dan layar menampilkan konfirmasi.
8. Setelah selesai, Ketua Divisi menutup sesi; Admin dapat memantau status sesi dan rekap semua divisi.
9. Saat sesi ditutup, seluruh anggota **Aktif** yang belum tercatat Hadir, Izin, atau Sakit ditandai **Alpha** secara otomatis. (Anggota Cuti/Keluar/Alumni diabaikan).

### 6.2 Alur Anggota Lupa Lanyard atau QR Rusak
1. Ketua Divisi mencari anggota pada divisinya lewat kolom pencarian (nama atau NIM).
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
1. Pada akhir masa jabatan, Super Admin membuat Periode Baru (misal: `2027-2028`), lalu Admin mencatat penugasan struktural periode tersebut sebelum menetapkannya sebagai periode aktif.
2. **Demisioner Massal:** Super Admin/Admin menjalankan fitur "Demisionerkan Periode Lalu". Anggota pengurus lama otomatis berganti status dari **Aktif** menjadi **Alumni/Demisioner**.
3. **Perpanjang Keanggotaan (Lanjut Pengurus):** Untuk anggota lama yang kembali menjadi pengurus di periode baru, Admin cukup memperbarui statusnya menjadi **Aktif** pada periode baru tanpa perlu cetak QR Code ulang (QR tetap berlaku).
4. **Import Anggota Baru (Oprec):** Admin mengimpor data anggota baru via file Excel. Sistem otomatis membuat ID Anggota baru dan QR Code unik.

### 6.5 Alur Absensi Pengurus
1. Pada awal periode, Admin mencatat penugasan struktural berdasarkan susunan pengurus periode tersebut.
2. Ketua Umum pada periode aktif membuka sesi absensi pengurus.
3. Sistem menyusun daftar peserta dari penugasan struktural periode aktif, termasuk pengurus yang role akunnya tetap Anggota.
4. Ketua Umum mengelola sesi. Pengurus lain hadir dan dicatat dengan alur absensi yang sama seperti anggota.
5. Rekap dan perubahan sesi disimpan pada periode terkait dan tercatat di Audit Log.

---

## 7. Kebutuhan Fungsional

Prioritas: **P0** wajib MVP, **P1** penting, **P2** nanti.

### 7.1 Autentikasi dan Manajemen Role
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-01 | Pengguna login dengan email dan password; role ditentukan otomatis dari akun yang terautentikasi, bukan dipilih pada halaman login | P0 |
| FR-02 | Sistem memisahkan role akses aplikasi dari jabatan struktural. Role yang didukung: Super Admin, Admin, Ketua Divisi, PJ Divisi, Calon Anggota, dan Anggota; akses mengikuti prinsip hak minimum | P0 |
| FR-03 | Super Admin dapat mengelola akun dan role. Admin hanya memperoleh fungsi administrasi yang ditugaskan; jabatan organisasi tidak otomatis memberi akses Admin atau Super Admin | P0 |
| FR-04 | Sesi login berakhir otomatis setelah tidak aktif dalam waktu tertentu | P1 |
| FR-05 | Pengguna dapat mengubah password sendiri; kredensial awal harus unik per akun dan wajib diganti pada login pertama, bukan menggunakan satu password bersama | P1 |

| FR-ACCESS-01 | Super Admin dapat mengatur akses halaman untuk role aplikasi dan jabatan struktural; izin jabatan mengikuti penugasan pada periode aktif, dan perubahan ditegakkan pada navigasi, halaman, serta API | P0 |

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
| FR-10 | Admin dapat menambah, mengubah, dan mengelola anggota secara manual; akun anggota mendapat email otomatis dari nama dan kode singkatan divisi dengan domain `@restex.id`, sedangkan keanggotaannya tetap terikat pada periode aktif | P0 |
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
| FR-30 | Ketua Divisi dapat membuat sesi: nama, jenis kegiatan, tanggal, waktu untuk divisinya; Admin dapat melihat detail dan rekap seluruh divisi | P0 |
| FR-31 | Jenis kegiatan fleksibel (Rutin, Workshop, Seminar, Internal, Lainnya) | P0 |
| FR-32 | Sesi memiliki status: Draft, Aktif, Ditutup | P0 |
| FR-33 | Scanning hanya dapat dilakukan pada sesi berstatus Aktif | P0 |
| FR-34 | Saat sesi ditutup, anggota **Aktif** tanpa catatan kehadiran otomatis berstatus **Alpha** | P0 |
| FR-35 | Ketua Divisi dapat membuka kembali sesi divisinya yang sudah ditutup (tercatat di audit log) | P1 |
| FR-36 | Hanya satu sesi yang dapat aktif pada satu waktu | P1 |
| FR-37 | Sistem menyimpan penugasan struktural per periode, termasuk pemegang jabatan, jabatan, dan divisi bila berlaku; riwayat periode sebelumnya tetap tersedia | P0 |
| FR-38 | Sistem memilih peserta sesi pengurus dari penugasan struktural pada periode sesi. Status dan rekap mengikuti aturan absensi yang sama | P0 |
| FR-39 | Hanya Ketua Umum yang ditugaskan pada periode aktif yang dapat membuat, membuka, dan menutup sesi absensi pengurus melalui izin khusus; role Admin atau Super Admin tidak memberi hak tersebut dengan sendirinya | P0 |

### 7.6 Scanning & Validasi Status
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-40 | Halaman scanner menggunakan kamera HP/laptop langsung dari browser | P0 |
| FR-41 | Konfirmasi visual cepat setelah scan valid: Nama, ID, Divisi, Waktu, Status Hadir | P0 |
| FR-42 | Ditolak jika scan ganda: menampilkan pesan "Sudah Absen" beserta waktu scan pertama | P0 |
| FR-43 | Ditolak jika QR tidak dikenal atau anggota berstatus **Nonaktif/Keluar/Alumni** | P0 |
| FR-44 | Umpan balik audio & visual saat scanning | P1 |
| FR-45 | Penghitung real-time (Hadir / Total Anggota Aktif) pada sesi berjalan | P1 |
| FR-46 | Ketua Divisi dapat mencatat kehadiran anggota divisinya secara manual sebagai cadangan dengan kewajiban mengisi alasan | P0 |

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

### 7.9 Artikel dan Pengumuman
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-80 | Pengunjung dapat melihat artikel dan pengumuman yang berstatus terbit; draf tidak boleh tampil pada halaman publik | P0 |
| FR-81 | Humas dapat membuat, menyunting, dan menerbitkan artikel atau pengumuman tanpa persetujuan Ketua Umum; izin ini tidak memberi akses administrasi anggota atau periode | P1 |
| FR-82 | Sistem mencatat penulis dan waktu publikasi. Hak konten untuk Infokom dan role lain ditentukan terpisah | P1 |
| FR-83 | Humas dapat mengunggah media pendukung sesuai tipe dan batas ukuran yang ditetapkan sistem | P1 |
| FR-84 | Perubahan draf, publikasi, penyembunyian, dan pengarsipan konten tercatat di Audit Log | P1 |

---

## 8. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Kemudahan** | Pengurus baru dapat menggunakan scanner tanpa pelatihan panjang. Mobile-first UI untuk scanner |
| **Performa** | Hasil scan tampil ≤ 2 detik pada koneksi normal |
| **Keamanan** | Password di-hash (Argon2), wajib HTTPS, hak akses berbasis prinsip hak minimum, dan pemeriksaan izin dilakukan di server |
| **Privasi** | QR hanya berisi token acak. Data sensitif tersimpan di server. Akses portal anggota dibatasi server-side ke identitas anggota yang terhubung ke akun tersebut |
| **Integritas Data** | Perubahan status keanggotaan tidak menghapus riwayat absensi terdahulu |
| **Kompatibilitas** | Browser modern di Android/iOS (Chrome, Safari) dan Desktop |
| **Skalabilitas** | Mendukung ratusan anggota dan multi-periode kepengurusan tanpa penumpukan data yang memperlambat sistem |

---

## 9. Model Data (Skema Relasional Disesuaikan)

- **periods**: `id`, `name` (e.g., "2026-2027"), `is_active` (boolean), `start_date`, `end_date`, `created_at`
- **users**: `id`, `name`, `email`, `password_hash`, `role` (super_admin/admin/division_lead/division_pj/candidate/member), `managed_division` (nullable; wajib untuk role yang dibatasi ke divisi), `is_active`
- **members**: `id`, `member_code` (RTX-YYYY-NNN), `full_name`, `nim`, `cohort`, `photo_url`, `qr_token_hash`, `user_id` (nullable, unique FK ke users)
- **memberships**: `id`, `member_id`, `period_id`, `division`, `status` (active/on_leave/exited/alumni), `joined_at`, `ended_at`. Data keanggotaan disimpan per periode agar riwayat tidak tertimpa.
- **officer_assignments** (rancangan): `id`, `member_id`, `period_id`, `position`, `division` (nullable), `created_at`. Menyimpan jabatan seperti Ketua Umum, Sekretaris, Humas, Ketua Divisi, dan PJ Divisi tanpa menjadikannya role akses.
- **sessions**: `id`, `period_id` (FK ke periods), `nama`, `jenis`, `tanggal`, `waktu_mulai`, `status` (draft/aktif/ditutup), `dibuat_oleh`
- **attendances**: `id`, `session_id`, `member_id`, `status` (hadir/izin/sakit/alpha), `metode` (scan/manual), `keterangan`, `waktu_tercatat`, `dicatat_oleh`. Constraint unik: `(session_id, member_id)`
- **announcements** (model saat ini): `title`, `slug`, `excerpt`, `content`, `type`, `is_published`, `published_at`, `created_at`, `updated_at`
- **Dukungan artikel dan media** (rancangan): metadata penulis, status tinjauan, dan referensi media. Perlu diputuskan apakah artikel memakai model `announcements` atau model terpisah.
- **audit_logs**: `id`, `user_id`, `aksi`, `entitas`, `nilai_lama`, `nilai_baru`, `waktu`

`officer_assignments` adalah rancangan kebutuhan, bukan perubahan skema yang sudah disetujui. Penugasan harus terhubung ke periode agar riwayat jabatan tidak berubah saat periode baru dimulai.

---

## 10. Aturan Bisnis (Business Rules)

1. Hanya ada **1 Periode Kepengurusan yang Aktif** dalam satu waktu.
2. Pembukaan sesi absensi otomatis terikat dengan Periode Kepengurusan yang Aktif.
3. Hanya anggota dengan status **Aktif** yang bisa di-scan QR-nya dan dihitung pada penutupan sesi.
4. Anggota dengan status **Cuti**, **Keluar**, atau **Alumni** diabaikan dari perhitungan Alpha otomatis saat sesi ditutup.
5. Perubahan status keanggotaan (misal dari Aktif menjadi Keluar) tidak menghapus catatan absensi yang sudah terjadi di masa lalu.
6. Regenerate QR membuat token QR lama hangus secara otomatis.
7. Semua tindakan manual (absen manual, ubah status, demisioner massal) tercatat di Audit Log.
8. Role akun menentukan hak akses aplikasi. Jabatan struktural dan status keanggotaan disimpan per periode; jabatan tidak otomatis memberi akses Admin atau Super Admin.
9. Akun Anggota hanya ditautkan ke satu data anggota. Anggota yang menjadi Alumni tetap dapat mengakses riwayat pribadinya selama akun belum dinonaktifkan.
10. Setiap permintaan portal anggota hanya boleh membaca data anggota yang terhubung ke sesi login; pemeriksaan akses wajib dilakukan di server.
11. Ketua Umum yang tercatat untuk periode aktif menjadi pengelola rutin sesi absensi pengurus melalui izin khusus. Akses darurat Super Admin harus diputuskan terpisah.
12. Sistem menyusun daftar peserta absensi pengurus dari penugasan struktural pada periode sesi.
13. Humas dapat membuat, menyunting, mengunggah, dan menerbitkan artikel atau pengumuman. Izin konten ini tidak memberi akses administrasi anggota atau periode.
14. Perubahan penugasan struktural dan status publikasi tercatat di Audit Log. Peralihan periode tidak menghapus riwayat penugasan.
15. Setiap periode hanya memiliki satu Ketua Umum aktif. Setiap divisi memiliki maksimal satu Ketua Divisi dan satu PJ aktif; Humas dan Infokom dapat memiliki beberapa anggota.

### Keputusan yang perlu dikonfirmasi

- Apakah Super Admin memerlukan izin darurat untuk membuka atau mengelola sesi pengurus ketika Ketua Umum tidak tersedia?
- Apakah Infokom juga perlu izin membuat, menyunting, atau mengunggah media untuk konten?
- Apakah artikel memakai jenis konten baru pada pengumuman yang ada atau disimpan sebagai entitas terpisah?
- Apakah satu orang boleh memegang lebih dari satu jabatan dalam satu periode?
- Siapa yang berwenang mengubah penugasan pengurus untuk periode aktif?

---

## 11. Rekomendasi Teknis

- **Frontend & Backend**: Next.js dan React.
- **Database**: PostgreSQL dengan Prisma; indeks pada identitas anggota, periode, sesi, dan status publikasi.
- **Penyimpanan media**: layanan penyimpanan objek terkontrol; file harus divalidasi tipe dan ukurannya sebelum dapat ditampilkan.
- **Keamanan**: semua aturan role dan izin konten dijalankan di server. Menyembunyikan tombol di UI saja tidak cukup.
- **Pemindaian**: kamera browser pada perangkat yang mendukung HTTPS.

---

## 12. Rencana Rilis

| Fase | Isi |
|---|---|
| **Baseline** | Absensi QR anggota dan pengurus, periode, status keanggotaan, rekap, portal Anggota, rekrutmen, serta pengumuman publik dasar |
| **Rilis berikutnya** | Penugasan jabatan per periode, izin khusus Ketua Umum untuk absensi pengurus, serta pengaturan hak tulis, tinjau, dan terbit untuk konten |
| **Pengembangan lanjutan** | Unggah media untuk artikel/pengumuman, alur editorial, arsip multi-periode, notifikasi, koreksi absensi, dan analitik |

---

*Dokumen berikutnya: `DESIGN.md` (konsep UI/UX, alur halaman, komponen UI, identitas visual).*