'use client';

import { useCallback, useRef, useState } from 'react';
import type { SpeechRecognitionSource } from '@intervue/shared';

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export type LiveSpeechState = 'idle' | 'listening' | 'unsupported' | 'denied' | 'error';

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }

  const speechWindow = window as WindowWithSpeechRecognition;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function useLiveSpeechRecognition() {
  const [state, setState] = useState<LiveSpeechState>('idle');
  const [transcript, setTranscript] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [source, setSource] = useState<SpeechRecognitionSource>('web_speech_api');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const stopRequestedRef = useRef(false);

  const stop = useCallback(() => {
    const elapsed = startedAtRef.current
      ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
      : durationSeconds;
    setDurationSeconds(elapsed);
    startedAtRef.current = null;
    stopRequestedRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState((value) => (value === 'listening' ? 'idle' : value));
    return elapsed;
  }, [durationSeconds]);

  const reset = useCallback((nextTranscript = '') => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    startedAtRef.current = null;
    stopRequestedRef.current = false;
    setTranscript(nextTranscript);
    setDurationSeconds(0);
    setRetryCount(0);
    setSource('web_speech_api');
    setState('idle');
  }, []);

  const start = useCallback(
    ({ initialTranscript = '', language }: { initialTranscript?: string; language: string }) => {
      const SpeechRecognition = getSpeechRecognitionConstructor();
      if (!SpeechRecognition) {
        setSource('manual');
        setState('unsupported');
        return false;
      }

      recognitionRef.current?.stop();

      const recognition = new SpeechRecognition();
      let finalTranscript = initialTranscript.trim();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const spokenText = result[0]?.transcript ?? '';

          if (result.isFinal) {
            finalTranscript = `${finalTranscript} ${spokenText}`.trim();
          } else {
            interimTranscript = `${interimTranscript} ${spokenText}`.trim();
          }
        }

        setTranscript(`${finalTranscript} ${interimTranscript}`.trim());
      };
      recognition.onerror = (event) => {
        setRetryCount((value) => value + 1);
        setSource('manual');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setState('denied');
          return;
        }

        setState('error');
      };
      recognition.onend = () => {
        const elapsed = startedAtRef.current
          ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
          : durationSeconds;
        setDurationSeconds(elapsed);
        startedAtRef.current = null;
        recognitionRef.current = null;
        setState((value) => {
          if (stopRequestedRef.current && value === 'listening') {
            return 'idle';
          }
          return value === 'listening' ? 'idle' : value;
        });
      };

      try {
        stopRequestedRef.current = false;
        startedAtRef.current = Date.now();
        recognitionRef.current = recognition;
        setSource('web_speech_api');
        setTranscript(initialTranscript.trim());
        setDurationSeconds(0);
        setState('listening');
        recognition.start();
        return true;
      } catch {
        setRetryCount((value) => value + 1);
        setSource('manual');
        setState('error');
        return false;
      }
    },
    [durationSeconds],
  );

  return {
    durationSeconds,
    isListening: state === 'listening',
    isSupported: state !== 'unsupported',
    reset,
    retryCount,
    setTranscript,
    source,
    start,
    state,
    stop,
    transcript,
  };
}
