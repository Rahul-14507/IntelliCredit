import React, { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoiceToText } from "../hooks/useVoiceToText";

interface SpeechTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  sublabel?: string;
}

const SpeechTextArea: React.FC<SpeechTextAreaProps> = ({
  value,
  onChange,
  placeholder,
  className = "",
  label,
  sublabel,
}) => {
  const {
    isRecording,
    transcript,
    interimTranscript,
    start,
    stop,
    isSupported,
  } = useVoiceToText();

  const [localValue, setLocalValue] = useState(value);

  // Sync with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Append transcript when it changes
  useEffect(() => {
    if (transcript) {
      const newValue = localValue.trim()
        ? `${localValue}\n${transcript}`
        : transcript;
      onChange(newValue);
      setLocalValue(newValue);
    }
  }, [transcript]);

  const toggleRecording = () => {
    if (isRecording) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-end">
        {label && (
          <label className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        {isSupported && (
          <div className="flex flex-col items-end">
            <button
              type="button"
              onClick={toggleRecording}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isRecording
                  ? "bg-red-100 text-red-600 animate-pulse border border-red-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              {isRecording ? (
                <>
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-ping" />
                  <span>Recording... (click to stop)</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" />
                  <span>Click to record observations</span>
                </>
              )}
            </button>
            {sublabel && (
              <span className="text-[10px] text-slate-400 mt-1 mr-1">
                {sublabel}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <textarea
          className="w-full border p-3 rounded-xl h-32 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none shadow-sm"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
          }}
        />
        {isRecording && interimTranscript && (
          <div className="absolute bottom-3 left-3 right-3 text-xs text-slate-400 italic bg-white/80 backdrop-blur-sm p-1 rounded pointer-events-none">
            {interimTranscript}...
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechTextArea;
