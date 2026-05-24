import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { RecordingButton } from '@/components/voice/recording-button';
import { ScoreMeter } from '@/components/voice/score-meter';
import { StatusChip } from '@/components/voice/status-chip';
import { WaveformIndicator } from '@/components/voice/waveform-indicator';

const bentoItems = [
  {
    title: 'Target lamaran menjadi konteks utama',
    body: 'Role, industri, skill, level, dan ringkasan pengalaman dipakai untuk membuat sesi latihan terasa seperti interview yang benar-benar akan dihadapi.',
    className: 'md:col-span-4',
    image:
      'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Voice state terlihat jelas',
    body: 'User tahu kapan AI berbicara, kapan rekaman aktif, dan kapan transcript sedang diproses.',
    className: 'md:col-span-2',
    image:
      'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Feedback yang bisa langsung dipakai',
    body: 'Report menyorot struktur, relevansi, dampak, dan contoh perbaikan tanpa memaksa user membaca transcript panjang.',
    className: 'md:col-span-2',
    image:
      'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Latihan bertahap atau simulasi penuh',
    body: 'Mode practice membantu perbaikan per jawaban. Full simulation menjaga ritme interview sampai report akhir.',
    className: 'md:col-span-2',
    image:
      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Audio mentah tidak disimpan',
    body: 'MVP mengirim transcript dan metadata ringan untuk evaluasi, bukan menyimpan rekaman suara mentah.',
    className: 'md:col-span-2',
    image:
      'https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'History membuat perkembangan terbaca',
    body: 'Setiap report bisa dibuka ulang sehingga kandidat tahu pola jawaban mana yang sudah membaik.',
    className: 'md:col-span-3',
    image:
      'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Dirancang untuk persiapan kerja nyata',
    body: 'Bahasa, level, dan tipe interview dapat disesuaikan dengan target yang sedang diprioritaskan.',
    className: 'md:col-span-3',
    image:
      'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
];

const accordionItems = [
  ['Buat target', 'Masukkan posisi, perusahaan, skill, job description, dan ringkasan pengalaman.'],
  [
    'Latih suara',
    'Jawab pertanyaan AI interviewer dengan waveform, progress, dan fallback transcript.',
  ],
  ['Baca report', 'Lihat skor, strengths, improvement area, dan rekomendasi latihan berikutnya.'],
];

const marqueeItems = [
  'Target lamaran',
  'Voice practice',
  'Transcript review',
  'STAR answers',
  'Readiness score',
  'Session report',
  'Mock interview',
  'Feedback terarah',
  'Progress history',
  'Job-ready answers',
];

const marqueeLoop = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

export default function HomePage() {
  return (
    <PublicLayout>
      <section className="relative mx-auto grid min-h-[calc(100dvh-8rem)] max-w-7xl gap-7 px-5 pb-8 pt-7 sm:px-8 lg:min-h-[calc(100dvh-10.5rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.72fr)] lg:items-center lg:pb-10 lg:pt-1">
        <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-[380px] max-w-5xl rounded-full bg-[radial-gradient(circle,rgb(201_214_107_/_0.24),transparent_62%)] blur-3xl" />

        <div className="min-w-0 landing-rise">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold text-[var(--primary-600)]">
              Latihan interview berbasis suara untuk target lamaran spesifik
            </p>
            <h1 className="mt-5 max-w-4xl text-balance font-[var(--font-jakarta)] text-[clamp(2.65rem,5.8vw,5.2rem)] font-black leading-[0.92] tracking-[-0.04em] text-[var(--foreground)]">
              Latih jawaban interview lewat suara.
            </h1>
          </div>
          <p className="mt-5 max-w-[56ch] text-base leading-7 text-[var(--muted)] sm:text-lg">
            Buat target lamaran, jawab pertanyaan AI, lalu baca feedback yang bisa langsung dilatih.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button className="w-full sm:w-auto" href="/register" size="lg">
              Mulai latihan
            </Button>
            <Button className="w-full sm:w-auto" href="#how-it-works" size="lg" variant="outline">
              Lihat alur
            </Button>
          </div>

          <dl className="mt-7 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              ['3', 'tahap dari target ke report'],
              ['5', 'pertanyaan default per sesi'],
              ['0', 'audio mentah disimpan'],
            ].map(([value, label]) => (
              <div className="border-t border-[var(--border)] pt-4" key={label}>
                <dt className="font-[var(--font-geist-mono)] text-3xl font-semibold tabular-nums text-[var(--primary)]">
                  {value}
                </dt>
                <dd className="mt-2 text-sm leading-5 text-[var(--muted)]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-h-[480px] min-w-0 lg:min-h-[500px] lg:translate-y-3">
          <div
            className="absolute inset-x-8 top-0 h-52 overflow-hidden rounded-[var(--radius-lg)] bg-cover bg-center opacity-95 shadow-[var(--shadow-shell)] grayscale contrast-125"
            style={{
              backgroundImage:
                'url(https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200)',
            }}
          />
          <Card className="absolute left-0 right-3 top-28 overflow-hidden rounded-[var(--radius-lg)] border-white/80 p-4 landing-stack sm:left-8">
            <div className="rounded-[18px] bg-[var(--primary)] p-5 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--primary-muted)]">
                    Pertanyaan 2 dari 5
                  </p>
                  <h2 className="mt-3 text-2xl font-black leading-tight tracking-[-0.02em] sm:text-3xl">
                    Ceritakan pengalaman Anda menyelesaikan masalah di tim.
                  </h2>
                </div>
                <StatusChip status="recording" />
              </div>

              <div className="mt-8 rounded-[16px] border border-white/10 bg-white/10 p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)]">
                <div className="mb-4 flex items-center justify-between text-sm font-semibold text-white/78">
                  <span>Jawaban sedang direkam</span>
                  <span className="font-[var(--font-geist-mono)] tabular-nums">01:18</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <WaveformIndicator
                    active
                    bars={16}
                    className="text-white sm:[&>span]:w-1.5"
                    label="Waveform rekaman aktif"
                  />
                  <RecordingButton isRecording />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-5 gap-2" aria-label="Progress interview">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    aria-hidden="true"
                    className={`h-2 rounded-full ${
                      index < 2 ? 'bg-[var(--accent)]' : 'bg-white/22'
                    }`}
                    key={index}
                  />
                ))}
              </div>
            </div>
          </Card>

          <Card className="absolute bottom-4 left-3 right-0 rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-shell)] sm:left-auto sm:w-[330px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">Report preview</p>
                <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-[var(--foreground)]">
                  Struktur jawaban membaik
                </h3>
              </div>
              <Badge tone="success">82/100</Badge>
            </div>
            <div className="mt-5 space-y-4">
              <ScoreMeter label="Relevansi" value={86} />
              <ScoreMeter label="Dampak" value={72} />
            </div>
          </Card>
        </div>
      </section>

      <section className="overflow-hidden border-y border-[var(--border)] bg-[var(--primary)] py-4 text-white">
        <div className="landing-marquee flex w-max gap-10 whitespace-nowrap will-change-transform">
          {marqueeLoop.map((item, index) => (
            <span
              className="text-sm font-semibold uppercase tracking-[0.22em] text-white/68"
              key={`${item}-${index}`}
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-28 sm:px-8 md:py-40">
        <div className="grid gap-8 lg:grid-cols-[0.68fr_1fr] lg:items-start">
          <div className="sticky top-28">
            <Badge tone="primary">Konteks utuh</Badge>
            <h2 className="mt-5 max-w-xl text-balance font-[var(--font-jakarta)] text-4xl font-black leading-[0.98] tracking-[-0.035em] text-[var(--foreground)] sm:text-5xl">
              Semua bagian latihan terhubung ke target yang sama.
            </h2>
            <p className="mt-6 max-w-[58ch] leading-8 text-[var(--muted)]">
              Bukan sekadar daftar pertanyaan. Intervue menyiapkan alur dari konteks lamaran,
              jawaban suara, sampai rekomendasi latihan berikutnya.
            </p>
          </div>

          <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-flow-dense md:grid-cols-6">
            {bentoItems.map((item, index) => (
              <article
                className={`group overflow-hidden rounded-[var(--radius-lg)] border border-white/80 bg-white/78 p-5 shadow-[var(--shadow-card)] transition-all duration-500 hover:-translate-y-1 hover:bg-white ${item.className}`}
                key={item.title}
              >
                <div className="mb-7 h-36 overflow-hidden rounded-[16px] bg-[var(--surface-muted)]">
                  <div
                    className="h-full bg-cover bg-center grayscale transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${item.image})`,
                    }}
                  />
                </div>
                <p className="font-[var(--font-geist-mono)] text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary-600)]">
                  {(index + 1).toString().padStart(2, '0')}
                </p>
                <h3 className="mt-3 text-xl font-black tracking-[-0.02em] text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 pb-28 sm:px-8 md:pb-40"
        id="how-it-works"
        aria-labelledby="how-it-works-title"
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <Badge tone="warning">Alur latihan</Badge>
            <h2
              className="mt-5 max-w-4xl text-balance font-[var(--font-jakarta)] text-4xl font-black leading-[0.98] tracking-[-0.035em] text-[var(--foreground)] sm:text-6xl"
              id="how-it-works-title"
            >
              Latihan terasa seperti sesi sungguhan, tapi tetap punya ruang koreksi.
            </h2>
          </div>
          <div className="grid gap-3">
            {accordionItems.map(([title, body], index) => (
              <article
                className="group grid min-h-28 overflow-hidden rounded-[var(--radius-lg)] border border-white/80 bg-white/76 p-5 shadow-[var(--shadow-card)] transition-all duration-500 hover:min-h-44 hover:bg-white"
                key={title}
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-[var(--font-geist-mono)] text-sm font-semibold tabular-nums text-[var(--primary-600)]">
                      0{index + 1}
                    </p>
                    <h3 className="mt-3 text-2xl font-black tracking-[-0.03em]">{title}</h3>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-1 grid h-9 w-9 place-items-center rounded-full bg-[var(--surface-muted)] text-[var(--primary)] transition-transform duration-500 group-hover:rotate-45"
                  >
                    +
                  </span>
                </div>
                <p className="mt-4 max-w-[52ch] translate-y-2 text-sm leading-6 text-[var(--muted)] opacity-80 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[var(--radius-lg)] bg-[var(--primary)] text-white shadow-[var(--shadow-shell)] lg:grid-cols-[1fr_0.72fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <Badge className="bg-white/12 text-white" tone="neutral">
              Mulai
            </Badge>
            <h2 className="mt-6 max-w-4xl text-balance font-[var(--font-jakarta)] text-4xl font-black leading-[0.98] tracking-[-0.035em] sm:text-6xl">
              Siapkan satu target lamaran dan mulai latihan hari ini.
            </h2>
            <p className="mt-6 max-w-[58ch] leading-8 text-white/72">
              Mulai dari satu posisi, satu sesi suara, dan satu report yang memberi arah perbaikan
              konkret untuk interview berikutnya.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/register" size="lg" variant="secondary">
                Buat akun
              </Button>
              <Button
                className="border-white/20 bg-white/10 text-white hover:bg-white/16"
                href="/login"
                size="lg"
                variant="outline"
              >
                Masuk
              </Button>
            </div>
          </div>
          <div
            className="min-h-80 bg-cover bg-center grayscale contrast-125 lg:min-h-full"
            style={{
              backgroundImage:
                'url(https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1000)',
            }}
          />
        </div>
      </section>
    </PublicLayout>
  );
}
