import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { requireAuth } from '@/lib/auth-server';

export default async function SettingsPage() {
  const user = await requireAuth();

  return (
    <AppShell
      activeHref="/settings"
      description="Pengaturan akun placeholder. Auth dan preferensi real masuk phase berikutnya."
      title="Settings"
      user={user}
    >
      <Card className="space-y-5 p-6">
        <Input disabled label="Nama" placeholder={user.name} />
        <Select
          disabled
          label="Preferensi bahasa interview"
          options={[
            { label: 'Bahasa Indonesia', value: 'id-ID' },
            { label: 'English', value: 'en-US' },
          ]}
        />
      </Card>
    </AppShell>
  );
}
