"use client";

import { useCallback, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

type WebSpeechRecognition = typeof window extends { webkitSpeechRecognition: infer T }
  ? T
  : unknown;

function getWebSpeechRecognition(): WebSpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: WebSpeechRecognition;
    webkitSpeechRecognition?: WebSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() =>
    Capacitor.isNativePlatform() ? true : getWebSpeechRecognition() !== null,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startWeb = useCallback(() => {
    const SpeechRecognitionCtor = getWebSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionCtor as any)();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string;
      onResult(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onResult]);

  const startNative = useCallback(async () => {
    const { available } = await SpeechRecognition.available();
    if (!available) return;

    const permission = await SpeechRecognition.checkPermissions();
    if (permission.speechRecognition !== "granted") {
      const requested = await SpeechRecognition.requestPermissions();
      if (requested.speechRecognition !== "granted") return;
    }

    setListening(true);
    try {
      const result = await SpeechRecognition.start({
        language: "es-ES",
        maxResults: 1,
        partialResults: false,
        popup: false,
      });
      const transcript = result.matches?.[0];
      if (transcript) onResult(transcript);
    } finally {
      setListening(false);
    }
  }, [onResult]);

  const start = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      void startNative();
    } else {
      startWeb();
    }
  }, [startNative, startWeb]);

  const stop = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      void SpeechRecognition.stop();
    } else {
      recognitionRef.current?.stop();
    }
    setListening(false);
  }, []);

  return { start, stop, listening, supported };
}
