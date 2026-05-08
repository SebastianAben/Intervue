'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await login({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });

    setIsLoading(false);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    const nextPath = new URLSearchParams(window.location.search).get('next') ?? '/dashboard';
    router.push(nextPath.startsWith('/') ? nextPath : '/dashboard');
    router.refresh();
  }

  return (
    <AuthLayout
      subtitle="Masuk untuk membuka target lamaran, history latihan, dan report sesi."
      title="Masuk ke Intervue"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
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
          autoComplete="current-password"
          disabled={isLoading}
          label="Password"
          name="password"
          placeholder="Masukkan password"
          required
          type="password"
        />
        {error ? (
          <p className="rounded-[var(--radius-sm)] bg-[#fde8e8] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        <Button className="w-full" isLoading={isLoading} type="submit">
          Masuk
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Belum punya akun?{' '}
        <Link className="font-bold text-[var(--primary-600)]" href="/register">
          Buat akun
        </Link>
      </p>
    </AuthLayout>
  );
}
