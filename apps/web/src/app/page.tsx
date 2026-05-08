import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { RecordingButton } from '@/components/voice/recording-button';
import { ScoreMeter } from '@/components/voice/score-meter';
import { StatusChip } from '@/components/voice/status-chip';
import { WaveformIndicator } from '@/components/voice/waveform-indicator';

const problemSolutionItems = [
  {
    title: 'Latihan sering terasa generik',
    body: 'Pertanyaan biasa tidak membaca target lamaran, level, atau skill yang perlu Anda buktikan.',
    solution: 'Intervue mengikat latihan ke target lamaran agar pertanyaan dan feedback lebih relevan.',
  },
  {
    title: 'Sulit menilai jawaban sendiri',
    body: 'Setelah latihan, banyak kandidat tidak tahu apakah jawabannya jelas, terstruktur, atau cukup meyakinkan.',
    solution: 'Feedback menyorot kekuatan, area perbaikan, dan contoh jawaban yang lebih kuat.',
  },
  {
    title: 'Berbicara berbeda dari mengetik',
    body: 'Interview kerja menuntut artikulasi suara, tempo, dan keberanian menjawab secara langsung.',
    solution: 'Flow voice-first membantu Anda berlatih menjawab seperti sesi interview sebenarnya.',
  },
];

const howItWorksItems = [
  ['Buat target lamaran', 'Masukkan posisi, perusahaan, skill, dan ringkasan pengalaman.'],
  ['Jawab lewat suara', 'Latihan dengan AI interviewer, waveform, progress, dan transcript review.'],
  ['Baca report sesi', 'Lihat skor, feedback, contoh perbaikan, dan rekomendasi latihan berikutnya.'],
];

const featureItems = [
  ['Voice-first practice', 'Latihan berbicara dengan state rekaman yang jelas dan fallback transcript.'],
  ['Feedback terstruktur', 'Skor, strengths, improvements, dan example answer dalam bahasa yang actionable.'],
  ['Target lamaran', 'Setiap sesi memakai konteks pekerjaan agar pertanyaan tidak terasa acak.'],
  ['Progress history', 'Report sesi dapat dibuka ulang untuk melihat perkembangan latihan.'],
];

export default function HomePage() {
  return (
    <PublicLayout>
      <section className="mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl gap-10 overflow-hidden px-5 pb-10 pt-8 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(440px,0.78fr)] lg:items-center lg:gap-12">
        <div className="min-w-0 landing-rise">
          <Badge tone="primary">AI voice interview practice</Badge>
          <h1 className="mt-6 max-w-4xl font-[var(--font-jakarta)] text-4xl font-extrabold leading-[1.06] text-[var(--primary)] sm:text-6xl lg:text-7xl">
            Latihan interview kerja dengan AI interviewer berbasis suara
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            Buat target lamaran, jawab pertanyaan lewat suara, dan dapatkan feedback objektif
            untuk memperbaiki performa wawancara.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button className="w-full sm:w-auto" href="/register" size="lg">
              Mulai Latihan
            </Button>
            <Button className="w-full sm:w-auto" href="#how-it-works" size="lg" variant="outline">
              Lihat Cara Kerja
            </Button>
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-3 text-sm">
            {[
              ['3 langkah', 'dari target ke report'],
              ['Voice UI', 'rekam dan review'],
              ['0 audio', 'tidak simpan suara mentah'],
            ].map(([value, label]) => (
              <div
                className="border-l border-[var(--border)] pl-3 first:border-l-0 first:pl-0"
                key={value}
              >
                <dt className="font-[var(--font-jakarta)] text-xl font-extrabold text-[var(--foreground)]">
                  {value}
                </dt>
                <dd className="mt-1 leading-5 text-[var(--muted)]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-h-[540px] min-w-0 landing-rise lg:min-h-[620px]">
          <div className="absolute -right-4 top-8 hidden h-32 w-32 rounded-full bg-[var(--accent)] opacity-20 blur-3xl sm:block" />
          <Card className="relative overflow-hidden p-4 sm:p-5 landing-float">
            <div className="rounded-[var(--radius-md)] bg-[var(--primary)] p-5 text-white shadow-[var(--shadow-shell)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[var(--primary-muted)]">
                    Pertanyaan 2 dari 5
                  </p>
                  <h2 className="mt-3 font-[var(--font-jakarta)] text-2xl font-extrabold leading-tight sm:text-3xl">
                    Ceritakan pengalaman Anda menyelesaikan masalah di tim.
                  </h2>
                </div>
                <StatusChip status="recording" />
              </div>

              <div className="mt-8 rounded-[var(--radius-md)] bg-white/10 p-4">
                <div className="mb-4 flex items-center justify-between text-sm font-semibold text-white/78">
                  <span>Jawaban sedang direkam</span>
                  <span>01:18</span>
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

            <div className="grid gap-4 pt-4 sm:grid-cols-[1fr_0.85fr]">
              <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
                <p className="text-sm font-bold text-[var(--foreground)]">Mini feedback</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Jawaban sudah relevan. Tambahkan angka dampak agar kontribusi Anda lebih
                  meyakinkan.
                </p>
              </div>
              <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
                <ScoreMeter label="Clarity" value={78} />
              </div>
            </div>
          </Card>

          <Card className="absolute bottom-4 left-0 right-0 p-4 shadow-[var(--shadow-shell)] sm:left-8 sm:right-auto sm:w-[320px] landing-float-slow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                  Report preview
                </p>
                <h3 className="mt-2 font-[var(--font-jakarta)] text-xl font-extrabold text-[var(--foreground)]">
                  Struktur jawaban membaik
                </h3>
              </div>
              <Badge tone="success">82/100</Badge>
            </div>
            <div className="mt-4 space-y-3">
              <ScoreMeter label="Relevansi" value={86} />
              <ScoreMeter label="Dampak" value={72} />
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 lg:grid-cols-[0.72fr_1fr] lg:items-start">
          <div>
            <Badge tone="warning">Problem dan solusi</Badge>
            <h2 className="mt-5 font-[var(--font-jakarta)] text-3xl font-extrabold leading-tight text-[var(--foreground)] sm:text-4xl">
              Latihan interview perlu konteks, suara, dan feedback yang bisa dipakai.
            </h2>
          </div>
          <div className="grid gap-4">
            {problemSolutionItems.map((item) => (
              <Card className="p-5" key={item.title}>
                <h3 className="font-[var(--font-jakarta)] text-xl font-extrabold text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
                <p className="mt-4 rounded-[var(--radius-sm)] bg-[#d7ece8] px-4 py-3 text-sm font-semibold leading-6 text-[var(--primary)]">
                  {item.solution}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8"
        id="how-it-works"
        aria-labelledby="how-it-works-title"
      >
        <div className="max-w-2xl">
          <Badge tone="primary">Cara kerja</Badge>
          <h2
            className="mt-5 font-[var(--font-jakarta)] text-3xl font-extrabold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="how-it-works-title"
          >
            Dari target lamaran ke report sesi dalam satu alur latihan.
          </h2>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {howItWorksItems.map(([title, body], index) => (
            <Card className="p-5" key={title}>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary)] font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-5 font-[var(--font-jakarta)] text-xl font-extrabold text-[var(--foreground)]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[var(--primary)] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <div>
            <Badge className="bg-white/12 text-white" tone="neutral">
              Feature highlights
            </Badge>
            <h2 className="mt-5 font-[var(--font-jakarta)] text-3xl font-extrabold leading-tight sm:text-4xl">
              Dibuat untuk job seeker yang ingin latihan lebih terarah.
            </h2>
            <p className="mt-5 max-w-xl leading-8 text-white/74">
              Intervue menggabungkan target lamaran, voice state, transcript review, dan feedback
              agar latihan terasa seperti proses persiapan interview yang utuh.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featureItems.map(([title, body]) => (
              <div className="rounded-[var(--radius-md)] border border-white/12 bg-white/8 p-5" key={title}>
                <h3 className="font-[var(--font-jakarta)] text-lg font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/72">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.72fr_1fr] lg:items-center">
        <div>
          <Badge tone="success">Report preview</Badge>
          <h2 className="mt-5 font-[var(--font-jakarta)] text-3xl font-extrabold leading-tight text-[var(--foreground)] sm:text-4xl">
            Feedback dibuat ringkas, objektif, dan langsung bisa dilatih.
          </h2>
          <p className="mt-5 leading-8 text-[var(--muted)]">
            Setiap report sesi menampilkan skor, kekuatan, area perbaikan, dan rekomendasi latihan
            berikutnya tanpa membuat user harus membaca ulang semua transcript.
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--muted)]">Report sesi</p>
                <h3 className="mt-1 font-[var(--font-jakarta)] text-2xl font-extrabold text-[var(--foreground)]">
                  Business Analyst Intern
                </h3>
              </div>
              <Badge tone="success">Siap direview</Badge>
            </div>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-[0.75fr_1fr]">
            <div className="rounded-[var(--radius-sm)] bg-[#d7ece8] p-5 text-[var(--primary)]">
              <p className="text-sm font-bold">Overall score</p>
              <p className="mt-3 font-[var(--font-jakarta)] text-5xl font-extrabold">82</p>
              <p className="mt-3 text-sm font-semibold leading-6">
                Jawaban jelas dan relevan. Perkuat dengan metrik dampak.
              </p>
            </div>
            <div className="space-y-4">
              <ScoreMeter label="Kejelasan" value={88} />
              <ScoreMeter label="Relevansi role" value={84} />
              <ScoreMeter label="Contoh konkret" value={74} />
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
                <p className="text-sm font-bold text-[var(--foreground)]">Next action</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Latih jawaban STAR untuk pengalaman kolaborasi dan tambahkan angka dampak dari
                  proyek sebelumnya.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-7xl rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-10 text-center text-white shadow-[var(--shadow-shell)] sm:px-8">
          <h2 className="mx-auto max-w-3xl font-[var(--font-jakarta)] text-3xl font-extrabold leading-tight sm:text-4xl">
            Siapkan target lamaran pertama dan mulai latihan interview hari ini.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-white/74">
            Mulai dari satu target, satu sesi latihan, dan satu report yang memberi arah perbaikan.
          </p>
          <div className="mt-7 flex justify-center">
            <Button href="/register" size="lg" variant="secondary">
              Mulai Latihan
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
