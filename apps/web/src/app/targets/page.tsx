import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth-server';

export default async function TargetsPage() {
  const user = await requireAuth();

  return (
    <AppShell
      activeHref="/targets"
      description="Placeholder shell untuk pengelolaan target lamaran. Fitur CRUD masuk Phase 4."
      title="Target Lamaran"
      user={user}
    >
      <Card className="p-6">
        <h2 className="font-[var(--font-jakarta)] text-2xl font-extrabold">
          Target lamaran belum dibuat
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Pada Phase 4, halaman ini akan memuat daftar target, form posisi, industri, job
          description, dan ringkasan pengalaman.
        </p>
        <Button className="mt-6" href="/interview" variant="outline">
          Lihat Setup Interview
        </Button>
      </Card>
    </AppShell>
  );
}
