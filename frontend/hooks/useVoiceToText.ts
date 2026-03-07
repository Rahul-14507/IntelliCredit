import { useState, useCallback, useRef, useEffect } from "react";

export interface useVoiceToTextReturn {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  isSupported: boolean;
}

export const useVoiceToText = (
  lang: string = "en-IN",
): useVoiceToTextReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => prev + " " + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [lang]);

  const start = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      setInterimTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimTranscript("");
    }
  }, [isRecording]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isRecording,
    transcript,
    interimTranscript,
    start,
    stop,
    reset,
    isSupported,
  };
};
