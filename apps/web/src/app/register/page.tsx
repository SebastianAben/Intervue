import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link className="mb-8 font-semibold text-[#0e5f55]" href="/">
        Intervue
      </Link>
      <h1 className="text-3xl font-semibold">Buat akun</h1>
      <p className="mt-3 text-[#52615c]">Form registrasi lengkap akan dibangun pada phase auth.</p>
    </main>
  );
}
