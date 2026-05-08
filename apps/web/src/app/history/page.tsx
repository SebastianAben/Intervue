import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { requireAuth } from '@/lib/auth-server';

export default async function HistoryPage() {
  const user = await requireAuth();

  return (
    <AppShell
      activeHref="/history"
      description="History mengikuti frame Figma yang tersedia, tetapi data real masuk Phase 8."
      title="History"
      user={user}
    >
      <Card className="p-6">
        <h2 className="font-[var(--font-jakarta)] text-2xl font-extrabold">Belum ada history</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Setelah sesi interview selesai, daftar sesi dan filter target lamaran akan muncul di sini.
        </p>
      </Card>
    </AppShell>
  );
}
