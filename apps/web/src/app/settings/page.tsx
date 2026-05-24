'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCurrentUser } from '@/lib/use-current-user';

export default function SettingsPage() {
  const { user, isLoading } = useCurrentUser();

  return (
    <AppShell
      activeHref="/settings"
      description="Pengaturan akun placeholder. Auth dan preferensi real masuk phase berikutnya."
      title="Settings"
      user={user}
    >
      <Card className="space-y-5 p-6">
        <Input disabled label="Nama" placeholder={isLoading ? 'Memuat akun...' : (user?.name ?? 'Pengguna')} />
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
