'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type QuestionSpeechState = 'idle' | 'speaking' | 'unsupported';

const storedVoiceKey = 'intervue.questionVoiceName';
const preferredVoiceNames = ['Google', 'Microsoft', 'Natural', 'Enhanced', 'Samantha', 'Daniel'];

function canUseQuestionSpeech() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

export function selectNaturalQuestionVoice(
  voices: SpeechSynthesisVoice[],
  language: string,
  storedVoiceName: string | null,
) {
  const normalizedLanguage = language.toLowerCase();
  const languagePrefix = normalizedLanguage.split('-')[0] ?? normalizedLanguage;
  const storedVoice = storedVoiceName
    ? voices.find((voice) => voice.name === storedVoiceName)
    : undefined;

  if (storedVoice) {
    return storedVoice;
  }

  const languageMatches = voices.filter((voice) => {
    const voiceLanguage = voice.lang.toLowerCase();
    return voiceLanguage === normalizedLanguage || voiceLanguage.startsWith(`${languagePrefix}-`);
  });
  const candidates = languageMatches.length > 0 ? languageMatches : voices;
  const nonCompactCandidates = candidates.filter(
    (voice) => !voice.name.toLowerCase().includes('compact'),
  );
  const naturalCandidates = nonCompactCandidates.length > 0 ? nonCompactCandidates : candidates;

  return (
    naturalCandidates.find((voice) =>
      preferredVoiceNames.some((name) => voice.name.toLowerCase().includes(name.toLowerCase())),
    ) ??
    naturalCandidates.find((voice) => voice.localService) ??
    naturalCandidates[0] ??
    null
  );
}

export function useQuestionSpeech(language: string) {
  const [state, setState] = useState<QuestionSpeechState>('idle');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!canUseQuestionSpeech()) {
      setState('unsupported');
      return;
    }

    function syncVoices() {
      setVoices(window.speechSynthesis.getVoices());
    }

    syncVoices();
    window.speechSynthesis.addEventListener('voiceschanged', syncVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', syncVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (!canUseQuestionSpeech()) {
      setState('unsupported');
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setState('idle');
  }, []);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (!canUseQuestionSpeech()) {
        setState('unsupported');
        onDone?.();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = selectNaturalQuestionVoice(
        voices.length > 0 ? voices : window.speechSynthesis.getVoices(),
        language,
        window.localStorage.getItem(storedVoiceKey),
      );

      if (voice) {
        utterance.voice = voice;
        window.localStorage.setItem(storedVoiceKey, voice.name);
      }

      utterance.lang = voice?.lang ?? language;
      utterance.rate = 0.92;
      utterance.pitch = 0.95;
      utterance.volume = 1;
      utterance.onend = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
          setState('idle');
          onDone?.();
        }
      };
      utterance.onerror = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
          setState('idle');
          onDone?.();
        }
      };

      utteranceRef.current = utterance;
      setState('speaking');
      window.speechSynthesis.speak(utterance);
    },
    [language, voices],
  );

  return {
    isSupported: state !== 'unsupported',
    speak,
    state,
    stop,
  };
}
