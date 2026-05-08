'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { register } from '@/lib/api-client';

type RegisterStatus = 'student' | 'fresh_graduate' | 'job_seeker' | 'other';
type RegisterLanguage = 'id' | 'en';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await register({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      status: String(formData.get('status') ?? 'job_seeker') as RegisterStatus,
      defaultLanguage: String(formData.get('defaultLanguage') ?? 'id') as RegisterLanguage,
    });

    setIsLoading(false);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <AuthLayout
      subtitle="Buat akun untuk menyimpan target lamaran, sesi latihan, dan feedback interview."
      title="Buat akun Intervue"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          autoComplete="name"
          disabled={isLoading}
          label="Nama"
          name="name"
          placeholder="Nama lengkap"
          required
        />
        <Input
          autoComplete="email"
          disabled={isLoading}
          label="Email"
          name="email"
          placeholder="nama@email.com"
          required
          type="email"
        />
        <Input
          autoComplete="new-password"
          disabled={isLoading}
          helperText="Minimal 8 karakter."
          label="Password"
          minLength={8}
          name="password"
          placeholder="Buat password"
          required
          type="password"
        />
        <Select
          disabled={isLoading}
          label="Status pengguna"
          name="status"
          options={[
            { label: 'Mahasiswa', value: 'student' },
            { label: 'Fresh graduate', value: 'fresh_graduate' },
            { label: 'Job seeker', value: 'job_seeker' },
            { label: 'Lainnya', value: 'other' },
          ]}
        />
        <Select
          disabled={isLoading}
          label="Preferensi bahasa"
          name="defaultLanguage"
          options={[
            { label: 'Bahasa Indonesia', value: 'id' },
            { label: 'English', value: 'en' },
          ]}
        />
        {error ? (
          <p className="rounded-[var(--radius-sm)] bg-[#fde8e8] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        <Button className="w-full" isLoading={isLoading} type="submit">
          Mulai Latihan
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Sudah punya akun?{' '}
        <Link className="font-bold text-[var(--primary-600)]" href="/login">
          Masuk
        </Link>
      </p>
    </AuthLayout>
  );
}
