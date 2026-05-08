'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type PermissionState = 'idle' | 'checking' | 'granted' | 'denied' | 'unsupported';

export function SpeechCapabilityCheck() {
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');

  const supportsSpeechRecognition = useMemo(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }, []);

  async function checkMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState('unsupported');
      return;
    }

    setPermissionState('checking');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState('granted');
    } catch {
      setPermissionState('denied');
    }
  }

  const badgeTone =
    permissionState === 'granted' && supportsSpeechRecognition
      ? 'success'
      : permissionState === 'denied' ||
          permissionState === 'unsupported' ||
          !supportsSpeechRecognition
        ? 'warning'
        : 'primary';

  const statusText = (() => {
    if (!supportsSpeechRecognition) {
      return 'Browser speech recognition tidak tersedia. Interview tetap bisa memakai input teks manual.';
    }

    if (permissionState === 'granted') {
      return 'Mikrofon siap. Browser dapat memakai Web Speech API untuk membuat transcript.';
    }

    if (permissionState === 'denied') {
      return 'Izin mikrofon ditolak. Aktifkan izin browser atau lanjut dengan fallback teks manual.';
    }

    if (permissionState === 'unsupported') {
      return 'Browser tidak menyediakan akses mikrofon. Gunakan browser lain atau fallback teks manual.';
    }

    return 'Cek mikrofon sebelum masuk interview room agar kendala izin terlihat lebih awal.';
  })();

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone={badgeTone}>Microphone check</Badge>
          <h2 className="mt-4 font-[var(--font-jakarta)] text-xl font-extrabold text-[var(--foreground)]">
            Kesiapan suara
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{statusText}</p>
        </div>
        <Button
          className="w-full sm:w-auto"
          isLoading={permissionState === 'checking'}
          onClick={checkMicrophone}
          type="button"
          variant="outline"
        >
          Cek Mikrofon
        </Button>
      </div>
    </Card>
  );
}
