"use client";

import { useMemo, useRef, useState } from "react";

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult:
    | ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as typeof window & {
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function useVoiceSearch(onResult: (text: string) => void) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const isSupported = useMemo(() => Boolean(getRecognitionConstructor()), []);

  function stop() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }

  function start() {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      return false;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        onResult(transcript);
      }
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    return true;
  }

  return {
    isListening,
    isSupported,
    start,
    stop,
  };
}
