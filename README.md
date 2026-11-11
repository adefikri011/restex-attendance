This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database (Neon PostgreSQL)

The Prisma schema is in `prisma/schema.prisma`. Runtime queries use Neon's pooled
connection, while Prisma migrations should use the direct, non-pooled connection.

1. Rotate any database password that has been shared outside a secret manager.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to Neon's pooled connection
   string and `DIRECT_URL` to its direct connection string. Never commit `.env`.
3. Generate the Prisma client and validate the schema:

   ```bash
   npm run db:generate
   npm run db:validate
   ```

4. Apply migrations to a development database:

   ```bash
   npm run db:migrate
   ```

   Use `npm run db:deploy` to apply committed migrations in a deployment environment.

Do not run migrations against production until the schema and migration have been
reviewed and the database has a backup.

## Autentikasi dan akses

Login menggunakan Better Auth dengan sesi yang disimpan di PostgreSQL. Atur
`BETTER_AUTH_URL` ke origin aplikasi dan isi `BETTER_AUTH_SECRET` dengan nilai
acak minimal 32 karakter. Pendaftaran publik dinonaktifkan; role hanya dibaca
dari akun di database dan diverifikasi lagi pada halaman server.

Login dilindungi Cloudflare Turnstile. Isi `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
dengan site key publik dan `CLOUDFLARE_TURNSTILE_SECRET_KEY` dengan secret key
server dari widget Turnstile. Verifikasi token dilakukan pada endpoint login
Better Auth; login akan ditolak sampai kedua key dikonfigurasi. Batasi hostname
widget di Cloudflare sesuai domain aplikasi dan `BETTER_AUTH_URL`.

Sebelum login pertama, siapkan backup database lalu terapkan migrasi autentikasi
ke database yang benar:

```bash
npm run db:deploy
```

Untuk membuat Super Admin pertama:

1. Isi `INITIAL_ADMIN_TOKEN` dengan token acak kuat dan `BETTER_AUTH_SECRET`
   dengan secret autentikasi.
2. Kirim satu kali permintaan `POST /api/auth/bootstrap` melalui HTTPS dengan
   header `Authorization: Bearer <INITIAL_ADMIN_TOKEN>` dan JSON berisi `name`,
   `email`, serta `password` unik minimal 12 karakter.
3. Hapus `INITIAL_ADMIN_TOKEN` dari environment setelah akun berhasil dibuat.

Endpoint bootstrap hanya aktif dengan token tersebut dan hanya selama belum ada
Super Admin. Jangan mengirim token atau password lewat chat, commit, atau log.
Akun Admin, Ketua Divisi, dan PJ Divisi dibuat oleh Super Admin melalui halaman
Akun Pengurus. Setiap divisi dapat memiliki satu Ketua dan satu PJ aktif; PJ
dapat langsung membuka sesi absensi divisinya ketika Ketua berhalangan.

## Sesi dan QR absensi

Ketua Divisi dan PJ dapat membuka, memindai QR, serta menutup sesi untuk divisi
yang ditugaskan. Admin dan Super Admin hanya memantau sesi. Hak akses sesi
diperiksa kembali di server, dan setiap scan menyimpan operator, waktu, serta
metode pencatatannya. QR anggota berisi token bertanda tangan yang disimpan
dalam bentuk hash; QR dapat disiapkan dari halaman Kartu Lanyard. Token
`QR_TOKEN_SECRET` harus stabil dan minimal 32 karakter di production. Jika tidak
diisi, aplikasi memakai `BETTER_AUTH_SECRET`.

Terapkan migrasi sebelum memakai fitur sesi/PJ, lalu generate Prisma Client:

```bash
npm run db:deploy
npm run db:generate
```

QR kehadiran tidak digunakan sebagai metode login. Login tetap memakai email
dan password.

## Tema tampilan

Tema Terang/Gelap diatur secara global lewat `ThemeProvider` dan pilihan di
`src/components/theme/theme-config.ts`. Warna antarmuka menggunakan token `--ui-*`
di `src/app/globals.css`, sehingga komponen tidak perlu memiliki palet mode-gelap
masing-masing. Untuk menambahkan tema seperti Halloween atau Kemerdekaan, tambahkan
pilihannya ke registry dan definisikan nilai tokennya menggunakan atribut
`[data-theme="nama-tema"]`. Artwork kartu lanyard tetap mempertahankan warna cetaknya.

## Struktur halaman

- `/` disiapkan untuk landing page publik; sementara ini mengarahkan ke `/dashboard`.
- `/dashboard` adalah halaman utama ruang kerja pengurus.
- `/login` menyediakan login email/password; role diarahkan otomatis berdasarkan
  akun database, tanpa pemilih role. Login QR belum tersedia.
- Halaman administrasi lain berada di `/attendance`, `/members`, `/periods`,
  `/reports`, `/audit-log`, dan `/administrator-accounts`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
