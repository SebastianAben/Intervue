import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const helpTopics = [
  {
    title: 'Mulai latihan interview',
    description:
      'Pilih target lamaran aktif, tentukan mode latihan, lalu jawab pertanyaan dengan suara agar evaluasi lebih dekat dengan sesi interview nyata.',
    action: 'Buka latihan',
    href: '/interview',
    points: ['Gunakan Latihan Cepat untuk pemanasan.', 'Pilih Simulasi Penuh untuk alur yang lebih terstruktur.'],
  },
  {
    title: 'Upload CV dan target lamaran',
    description:
      'Unggah CV PDF saat membuat target lamaran agar ringkasan pengalaman otomatis masuk ke konteks pertanyaan.',
    action: 'Kelola target',
    href: '/targets',
    points: ['Format file harus PDF.', 'Ukuran CV maksimal 5 MB.', 'Ringkasan tetap bisa diedit manual.'],
  },
  {
    title: 'Izin mikrofon dan kamera',
    description:
      'Browser perlu akses mikrofon untuk jawaban suara dan kamera untuk analisis nonverbal saat simulasi penuh.',
    action: 'Cek pengaturan',
    href: '/settings',
    points: ['Izinkan akses dari prompt browser.', 'Refresh halaman setelah mengubah izin.', 'Gunakan Chrome terbaru jika fitur suara tidak muncul.'],
  },
  {
    title: 'Riwayat dan report',
    description:
      'Sesi yang selesai akan masuk ke riwayat. Report membantu melihat kekuatan jawaban, area perbaikan, dan kualitas penyampaian.',
    action: 'Lihat report',
    href: '/reports',
    points: ['Selesaikan sesi agar report tersedia.', 'Gunakan riwayat untuk membandingkan latihan.'],
  },
];

const faqs = [
  {
    question: 'Kenapa tombol upload CV hanya menerima PDF?',
    answer:
      'Parser CV saat ini dirancang untuk PDF agar format dokumen lebih stabil dan hasil ekstraksi teks lebih konsisten.',
  },
  {
    question: 'Apa yang harus dilakukan kalau mikrofon tidak terdeteksi?',
    answer:
      'Periksa izin browser untuk situs ini, pastikan perangkat input aktif di sistem operasi, lalu refresh halaman interview.',
  },
  {
    question: 'Apakah ringkasan CV bisa diedit setelah upload?',
    answer:
      'Bisa. Teks hasil upload masuk ke field ringkasan pengalaman dan tetap bisa kamu ubah sebelum target disimpan.',
  },
  {
    question: 'Kapan report interview muncul?',
    answer:
      'Report dibuat setelah sesi selesai dan jawaban sudah dikirim untuk evaluasi. Jika sesi dihentikan terlalu cepat, report mungkin belum tersedia.',
  },
];

export default function HelpPage() {
  return (
    <AppShell
      activeHref="/help"
      mainClassName="max-w-7xl overflow-x-hidden"
      showPageHeader={false}
      title="Bantuan"
    >
      <div className="space-y-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_360px] lg:items-stretch">
          <Card className="relative overflow-hidden rounded-[var(--radius-lg)] p-7 sm:p-8">
            <div className="absolute right-[-5rem] top-[-5rem] h-56 w-56 rounded-full bg-[var(--accent)]/35 blur-3xl" />
            <div className="absolute bottom-[-6rem] left-[28%] h-64 w-64 rounded-full bg-[var(--primary-muted)]/35 blur-3xl" />
            <div className="relative max-w-4xl">
              <p className="text-sm font-bold uppercase leading-5 tracking-[0.12em] text-[var(--primary-600)]">
                Pusat bantuan Intervue
              </p>
              <h1 className="mt-4 font-[var(--font-jakarta)] text-4xl font-black leading-none tracking-[-0.035em] text-[var(--foreground)] sm:text-5xl">
                Bantuan
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)]">
                Temukan langkah cepat untuk menyiapkan target lamaran, membaca CV, memulai latihan, dan
                mengatasi kendala perangkat sebelum sesi interview dimulai.
              </p>
            </div>
          </Card>

          <Card className="flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] border-[var(--primary)] bg-[var(--primary)] p-6 text-white shadow-[0_22px_48px_rgb(18_60_55_/_0.2)]">
            <div>
              <p className="text-sm font-semibold text-white/70">Butuh mulai dari mana?</p>
              <h2 className="mt-3 font-[var(--font-jakarta)] text-2xl font-black leading-tight tracking-[-0.025em]">
                Buat target lamaran dulu agar latihan lebih relevan.
              </h2>
            </div>
            <div className="mt-7 flex flex-col gap-3">
              <Button
                className="w-full !bg-white !text-[var(--primary)] hover:!bg-[var(--surface-muted)]"
                href="/targets"
              >
                Buat Target Lamaran
              </Button>
              <Button
                className="w-full !border-white/35 !bg-white/10 !text-white hover:!bg-white/16"
                href="/interview"
                variant="outline"
              >
                Mulai Latihan
              </Button>
            </div>
          </Card>
        </section>

        <section className="grid grid-flow-dense gap-5 md:grid-cols-2">
          {helpTopics.map((topic, index) => (
            <Card
              className="group landing-rise flex min-h-[284px] flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[var(--primary-muted)] active:translate-y-px"
              key={topic.title}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div>
                <div className="mb-5 h-1.5 w-16 rounded-full bg-[var(--accent)] transition-transform duration-300 group-hover:scale-x-125" />
                <h2 className="font-[var(--font-jakarta)] text-2xl font-black leading-tight tracking-[-0.025em] text-[var(--foreground)]">
                  {topic.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{topic.description}</p>
                <ul className="mt-5 space-y-3">
                  {topic.points.map((point) => (
                    <li className="flex gap-3 text-sm leading-6 text-[var(--foreground)]" key={point}>
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="mt-6 w-fit" href={topic.href} variant={index === 0 ? 'primary' : 'outline'}>
                {topic.action}
              </Button>
            </Card>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[rgb(255_255_255_/_0.58)] p-6">
            <h2 className="font-[var(--font-jakarta)] text-2xl font-black leading-tight tracking-[-0.025em] text-[var(--foreground)]">
              Pertanyaan yang sering muncul
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Jawaban singkat untuk kendala yang paling sering terjadi saat menyiapkan sesi latihan.
            </p>
          </div>

          <Card className="overflow-hidden rounded-[var(--radius-lg)]">
            {faqs.map((faq) => (
              <details
                className="group border-b border-[var(--border)] p-5 transition-colors last:border-b-0 open:bg-white/68"
                key={faq.question}
              >
                <summary className="cursor-pointer list-none font-[var(--font-jakarta)] text-base font-extrabold leading-6 text-[var(--foreground)] transition-colors group-hover:text-[var(--primary-600)]">
                  {faq.question}
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">{faq.answer}</p>
              </details>
            ))}
          </Card>
        </section>

        <Card className="grid gap-5 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-strong)] p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="font-[var(--font-jakarta)] text-2xl font-black leading-tight tracking-[-0.025em] text-[var(--foreground)]">
              Siapkan konteks, lalu mulai latihan.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Target lamaran dan ringkasan pengalaman membantu Intervue menyusun pertanyaan yang lebih tepat untuk posisi yang kamu incar.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/targets">Kelola Target</Button>
            <Button href="/settings" variant="outline">
              Pengaturan
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
