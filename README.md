# Intervue

Intervue adalah web app latihan interview kerja berbasis suara. Aplikasi ini membantu kandidat menyiapkan interview berdasarkan target lamaran spesifik, menjawab pertanyaan seperti sesi mock interview, lalu membaca feedback dan report yang bisa dipakai untuk memperbaiki jawaban berikutnya.

Project ini dibuat sebagai monorepo berisi frontend, backend API, package shared types, schema database, dan eksperimen model pendukung untuk analisis nonverbal.

## Fitur Utama

- Autentikasi user dengan register dan login.
- Target lamaran berisi role, perusahaan, industri, level, job description, skill requirement, bahasa, dan tipe interview.
- Sesi interview dengan mode practice dan full simulation.
- Pertanyaan interview yang disesuaikan dengan konteks target lamaran.
- Input jawaban lewat suara dengan transcript browser dan fallback manual.
- Evaluasi jawaban, skor, strengths, improvement area, contoh jawaban lebih baik, dan follow-up question.
- Report akhir sesi berisi ringkasan performa, rekomendasi, dan prioritas latihan.
- History sesi untuk membuka kembali hasil latihan sebelumnya.
- Analisis speech dan nonverbal sebagai sinyal pendukung evaluasi.

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- TypeScript
- MediaPipe Tasks Vision untuk capture fitur nonverbal di browser

### Backend

- Node.js
- Express 5
- TypeScript
- Zod untuk validasi request
- JWT dan cookie session untuk autentikasi
- Gemini API untuk pembuatan pertanyaan, evaluasi jawaban, dan report

### Database dan Tooling

- PostgreSQL 16
- Prisma 7
- pnpm workspace
- Docker Compose untuk database lokal
- ESLint, TypeScript, dan Prettier

### Machine Learning Pendukung

- Service Python opsional di `ml/nonverbal` untuk inferensi sinyal nonverbal.
- Model nonverbal tersimpan di `ml/nonverbal/models`.
- Backend membaca service ini melalui `NONVERBAL_INFERENCE_URL`.

## Struktur Repository

```text
apps/web          Next.js frontend
apps/api          Express API, Prisma schema, dan API routes
packages/shared   Shared TypeScript types dan response helpers
ml/nonverbal      Eksperimen dan inference service nonverbal
deploy            Konfigurasi deployment mandiri/home server
scripts           Script deployment dan setup runner
```

## Menjalankan Secara Online

Aplikasi dapat diakses melalui:

[https://intervue-web-lime.vercel.app/](https://intervue-web-lime.vercel.app/)

Alur penggunaan:

1. Buka link Vercel di atas.
2. Register akun baru atau login dengan akun yang sudah ada.
3. Buat target lamaran sesuai posisi yang ingin dilatih.
4. Mulai sesi interview dari target tersebut.
5. Jawab pertanyaan menggunakan suara atau transcript manual.
6. Buka report dan history untuk melihat hasil evaluasi.

## Menjalankan Secara Offline atau Local

### Prasyarat

- Node.js
- pnpm
- Docker atau OrbStack untuk PostgreSQL lokal
- Gemini API key untuk fitur pertanyaan, evaluasi, dan report

### 1. Install dependency

```bash
pnpm install
```

### 2. Buat file environment

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Minimal konfigurasi local yang dibutuhkan:

```text
DATABASE_URL="postgresql://intervue:intervue@localhost:5433/intervue"
JWT_SECRET="replace-with-a-long-random-secret"
GEMINI_API_KEY="isi-dengan-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash"
CORS_ORIGIN="http://localhost:3000"
SESSION_COOKIE_DOMAIN=""
NONVERBAL_INFERENCE_URL="http://127.0.0.1:8765/predict"
NEXT_PUBLIC_API_BASE_URL="/api/backend"
API_INTERNAL_BASE_URL="http://localhost:4000/api"
```

Catatan:

- `apps/api/.env` dipakai oleh backend.
- `apps/web/.env` dipakai oleh frontend.
- `.env` di root berguna sebagai referensi konfigurasi gabungan.
- Jangan menyimpan `GEMINI_API_KEY`, `JWT_SECRET`, atau credential database di environment frontend publik.

### 3. Jalankan PostgreSQL lokal

```bash
docker compose up -d postgres
```

Database development berjalan di host port `5433` agar tidak bentrok dengan PostgreSQL lokal lain.

### 4. Generate Prisma client dan jalankan migration

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Jalankan frontend dan backend

```bash
pnpm dev
```

Setelah server berjalan:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

Response health check yang benar:

```json
{
  "data": {
    "status": "ok"
  },
  "error": null
}
```

## Service Nonverbal Opsional

Fitur utama aplikasi tetap bisa dijalankan tanpa service nonverbal lokal. Jika service ini tidak aktif, backend akan tetap memproses sesi interview dengan data nonverbal yang tersedia atau mencatat error inferensi.

Untuk menjalankan service nonverbal, lihat dokumentasi di:

```text
ml/nonverbal/README.md
```

Pastikan `NONVERBAL_INFERENCE_URL` mengarah ke endpoint service tersebut, default:

```text
http://127.0.0.1:8765/predict
```

## Commands

```bash
pnpm dev          # menjalankan web dan api
pnpm dev:web      # menjalankan frontend saja
pnpm dev:api      # menjalankan backend saja
pnpm build        # build/typecheck semua package
pnpm lint         # lint semua package
pnpm typecheck    # typecheck semua package
pnpm format       # cek format dengan Prettier
pnpm db:generate  # generate Prisma client
pnpm db:migrate   # menjalankan Prisma migration
pnpm db:studio    # membuka Prisma Studio
```

Test backend dapat dijalankan dari package API:

```bash
pnpm --filter @intervue/api test
```

## Database Lokal

Project ini memakai PostgreSQL container dengan named volume `intervue_postgres_data`. Data tetap tersimpan saat container dihentikan biasa:

```bash
docker compose down
```

Untuk reset database development dan menghapus seluruh data:

```bash
docker compose down -v
docker compose up -d postgres
pnpm db:migrate
```

## Environment Variables

### Backend

```text
DATABASE_URL
JWT_SECRET
GEMINI_API_KEY
GEMINI_MODEL
CORS_ORIGIN
SESSION_COOKIE_DOMAIN
NONVERBAL_INFERENCE_URL
PORT
```

### Frontend

```text
NEXT_PUBLIC_API_BASE_URL
API_INTERNAL_BASE_URL
```

Default local frontend menggunakan rewrite Next.js dari `/api/backend` ke backend internal `http://localhost:4000/api`.

## Catatan Privasi

Intervue dirancang untuk mengevaluasi transcript jawaban dan metadata pendukung. Berdasarkan alur aplikasi saat ini, audio mentah tidak disimpan sebagai file permanen di database. Data yang tersimpan mencakup target lamaran, transcript, metadata sesi, skor, evaluasi, dan report.

## Troubleshooting

### Port PostgreSQL sudah digunakan

Project memakai port host `5433`. Jika port tersebut sudah dipakai, ubah mapping port di `docker-compose.yml` dan sesuaikan `DATABASE_URL`.

### API tidak bisa diakses dari frontend

Pastikan:

```text
NEXT_PUBLIC_API_BASE_URL="/api/backend"
API_INTERNAL_BASE_URL="http://localhost:4000/api"
CORS_ORIGIN="http://localhost:3000"
```

### Pertanyaan atau report tidak muncul

Pastikan `GEMINI_API_KEY` sudah diisi di `apps/api/.env`, lalu restart backend.

### Browser tidak merekam suara

Pastikan browser memberi permission microphone untuk `http://localhost:3000`. Jika speech recognition browser tidak tersedia, gunakan input transcript manual.

## Status Project

Intervue adalah MVP akademik untuk latihan interview kerja. Fokus utama project ini adalah alur end-to-end dari pembuatan target lamaran, sesi interview, evaluasi jawaban, sampai report latihan.
