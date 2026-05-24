'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import type { AuthUser } from '@intervue/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { deleteAccount, updateAccount } from '@/lib/api-client';
import { cacheCurrentUser, clearCachedUser, useCurrentUser } from '@/lib/use-current-user';

const statusOptions = [
  { label: 'Mahasiswa', value: 'student' },
  { label: 'Fresh graduate', value: 'fresh_graduate' },
  { label: 'Job seeker', value: 'job_seeker' },
  { label: 'Lainnya', value: 'other' },
];

const languageOptions = [
  { label: 'Bahasa Indonesia', value: 'id' },
  { label: 'English', value: 'en' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const [savedUser, setSavedUser] = useState<AuthUser | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const settingsUser = savedUser ?? user;

  useEffect(() => {
    if (user) {
      setSavedUser(user);
    }
  }, [user]);

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setIsSavingProfile(true);

    const formData = new FormData(event.currentTarget);
    const response = await updateAccount({
      name: String(formData.get('name') ?? ''),
      status: String(formData.get('status') ?? 'job_seeker') as NonNullable<typeof user>['status'],
      defaultLanguage: String(formData.get('defaultLanguage') ?? 'id') as NonNullable<
        typeof user
      >['defaultLanguage'],
    });

    setIsSavingProfile(false);

    if (response.error) {
      setProfileError(response.error.message);
      return;
    }

    cacheCurrentUser(response.data.user);
    setSavedUser(response.data.user);
    setProfileMessage('Pengaturan akun berhasil disimpan.');
    router.refresh();
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteError(null);
    setIsDeleting(true);

    const formData = new FormData(event.currentTarget);
    const response = await deleteAccount({
      password: String(formData.get('password') ?? ''),
    });

    setIsDeleting(false);

    if (response.error) {
      setDeleteError(response.error.message);
      return;
    }

    setDeleteModalOpen(false);
    clearCachedUser();
    router.push('/');
    router.refresh();
  }

  return (
    <AppShell
      activeHref="/settings"
      description="Kelola identitas akun, preferensi interview, dan data yang tersimpan di Intervue."
      title="Pengaturan"
      user={settingsUser}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="space-y-5 p-6">
          <form className="space-y-5" key={settingsUser?.id ?? 'loading-profile'} onSubmit={handleUpdateProfile}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-[var(--font-jakarta)] text-2xl font-black tracking-[-0.02em] text-[var(--foreground)]">
                  Profil akun
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Ubah identitas dasar dan preferensi bahasa default untuk sesi interview.
                </p>
              </div>
              <Button
                className="w-full sm:w-auto"
                disabled={isLoading || !settingsUser}
                isLoading={isSavingProfile}
                type="submit"
              >
                Simpan perubahan
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                defaultValue={settingsUser?.name ?? ''}
                disabled={isLoading || isSavingProfile}
                label="Nama"
                name="name"
                placeholder={isLoading ? 'Memuat akun...' : 'Nama lengkap'}
                required
              />
              <Input
                disabled
                helperText="Perubahan email membutuhkan verifikasi dan belum tersedia di versi ini."
                label="Email"
                value={isLoading ? 'Memuat email...' : (settingsUser?.email ?? '-')}
              />
              <Select
                defaultValue={settingsUser?.status ?? 'job_seeker'}
                disabled={isLoading || isSavingProfile}
                label="Status pengguna"
                name="status"
                options={statusOptions}
              />
              <Select
                defaultValue={settingsUser?.defaultLanguage ?? 'id'}
                disabled={isLoading || isSavingProfile}
                helperText="Dipakai sebagai bahasa default saat membuat target atau latihan baru."
                label="Preferensi bahasa"
                name="defaultLanguage"
                options={languageOptions}
              />
            </div>

            {profileError ? (
              <p className="rounded-[var(--radius-sm)] bg-[#fde8e8] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
                {profileError}
              </p>
            ) : null}
            {profileMessage ? (
              <p className="rounded-[var(--radius-sm)] bg-[#e8f6ef] px-4 py-3 text-sm font-semibold text-[var(--primary)]">
                {profileMessage}
              </p>
            ) : null}
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-[var(--font-jakarta)] text-xl font-black tracking-[-0.02em] text-[var(--foreground)]">
            Preferensi interview
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Preferensi utama sekarang bisa diubah dari profil akun. Pengaturan lanjutan mengikuti
            target lamaran yang dipilih saat mulai latihan.
          </p>
          <div className="mt-6 space-y-4">
            {[
              ['Mode default', 'Practice'],
              ['Jumlah pertanyaan', '5 pertanyaan'],
              ['Tipe interview', 'Mixed'],
            ].map(([label, value]) => (
              <div className="border-t border-[var(--border)] pt-4" key={label}>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-6">
          <h2 className="font-[var(--font-jakarta)] text-2xl font-black tracking-[-0.02em] text-[var(--foreground)]">
            Data tersimpan
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Intervue menyimpan target lamaran, transcript jawaban, skor sesi, dan report agar
            progres latihan bisa dibuka kembali.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {['Target lamaran', 'Riwayat sesi', 'Report interview'].map((item) => (
              <div
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                key={item}
              >
                <p className="text-sm font-bold text-[var(--foreground)]">{item}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  Ikut terhapus saat akun dihapus permanen.
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-[#f4b8b8] bg-[#fff5f5] p-6 shadow-[0_18px_42px_rgb(186_26_26_/_0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--danger)]">
            Danger zone
          </p>
          <h2 className="mt-3 font-[var(--font-jakarta)] text-xl font-black tracking-[-0.02em] text-[var(--foreground)]">
            Hapus akun permanen
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Aksi ini menghapus akun, target lamaran, sesi interview, transcript, dan report. Data
            tidak bisa dipulihkan.
          </p>
          <Button
            className="mt-6 w-full"
            disabled={isLoading || !settingsUser}
            onClick={() => {
              setDeleteError(null);
              setDeleteModalOpen(true);
            }}
            type="button"
            variant="danger"
          >
            Hapus akun
          </Button>
        </Card>
      </div>

      <Modal
        description="Masukkan password untuk mengonfirmasi penghapusan akun permanen."
        onClose={isDeleting ? undefined : () => setDeleteModalOpen(false)}
        open={deleteModalOpen}
        title="Hapus akun?"
      >
        <form className="space-y-5" onSubmit={handleDeleteAccount}>
          <Input
            autoComplete="current-password"
            disabled={isDeleting}
            error={deleteError ?? undefined}
            label="Password"
            name="password"
            placeholder="Masukkan password"
            required
            type="password"
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              disabled={isDeleting}
              onClick={() => setDeleteModalOpen(false)}
              type="button"
              variant="ghost"
            >
              Batal
            </Button>
            <Button isLoading={isDeleting} type="submit" variant="danger">
              Hapus akun permanen
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
