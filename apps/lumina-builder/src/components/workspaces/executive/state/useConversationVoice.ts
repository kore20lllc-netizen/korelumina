import { useCallback, useEffect, useRef, useState } from "react";

/*
 * EW-1f: voice in the Executive Office conversation, using the browser's
 * own speech engines (the owner chose browser voice first).
 *
 * - Talk: the microphone dictates into the message box as you speak; when
 *   you stop, the question is sent. Transcription is done by the browser
 *   (Chrome sends audio to Google; Safari uses Apple's engine). Nothing is
 *   recorded or stored by KoreLumina.
 * - Listen: replies can be read aloud with the browser's built-in voices.
 *   "Voice replies" reads each new answer automatically; the choice is
 *   remembered in this browser only.
 *
 * Where the browser has no speech engine the controls say so and stay off.
 */

type RecognitionResultList = ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;

interface BrowserRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: RecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => BrowserRecognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const candidate =
    (window as unknown as { SpeechRecognition?: RecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
  return candidate ?? null;
}

const VOICE_REPLIES_KEY = "korelumina.executiveOffice.voiceReplies";

/* Natural-sounding voices that ship with macOS and Chrome, best first. */
const PREFERRED_VOICES = [
  "Samantha",
  "Ava",
  "Allison",
  "Daniel",
  "Karen",
  "Google US English",
  "Google UK English Male",
  "Google UK English Female",
];

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const name of PREFERRED_VOICES) {
    const match = voices.find((voice) => voice.name.startsWith(name));
    if (match) return match;
  }
  return (
    voices.find((voice) => voice.lang.startsWith(navigator.language.slice(0, 2)) && voice.localService) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    voices[0] ??
    null
  );
}

/* Long identifiers read badly aloud; keep the sentence, drop the hash. */
function speakable(text: string): string {
  return text
    .replace(/\b[0-9a-f]{12,}\b/gi, "")
    .replace(/canonical:document:[^\s,.;)]+/g, "a canonical document")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function readVoiceReplies(): boolean {
  try {
    return window.localStorage.getItem(VOICE_REPLIES_KEY) === "on";
  } catch {
    return false;
  }
}

export interface ConversationVoice {
  canListen: boolean;
  canSpeak: boolean;
  listening: boolean;
  interim: string;
  listenError: string | null;
  startListening(): void;
  stopListening(): void;
  voiceReplies: boolean;
  setVoiceReplies(on: boolean): void;
  speakingKey: string | null;
  speak(key: string, text: string): void;
  stopSpeaking(): void;
}

export function useConversationVoice({
  onFinalTranscript,
}: {
  onFinalTranscript(text: string): void;
}): ConversationVoice {
  const Recognition = recognitionConstructor();
  const canListen = Recognition !== null;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  const recognition = useRef<BrowserRecognition | null>(null);
  const finalText = useRef("");
  const cancelled = useRef(false);
  const onFinal = useRef(onFinalTranscript);
  onFinal.current = onFinalTranscript;

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [listenError, setListenError] = useState<string | null>(null);
  const [voiceReplies, setVoiceRepliesState] = useState(() => (canSpeak ? readVoiceReplies() : false));
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);

  const startListening = useCallback(() => {
    if (!Recognition || recognition.current) return;
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeakingKey(null);

    const instance = new Recognition();
    instance.lang = navigator.language || "en-US";
    instance.continuous = false;
    instance.interimResults = true;
    finalText.current = "";
    cancelled.current = false;

    instance.onresult = (event) => {
      let live = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText.current += result[0].transcript;
        else live += result[0].transcript;
      }
      setInterim(`${finalText.current}${live}`.trim());
    };

    instance.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setListenError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone access is blocked. Allow it for this site in the browser's address bar."
          : `Voice input stopped: ${event.error}.`,
      );
    };

    instance.onend = () => {
      recognition.current = null;
      setListening(false);
      setInterim("");
      const text = finalText.current.trim();
      if (text && !cancelled.current) onFinal.current(text);
    };

    setListenError(null);
    setListening(true);
    recognition.current = instance;
    try {
      instance.start();
    } catch (error) {
      recognition.current = null;
      setListening(false);
      setListenError(`Voice input could not start: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [Recognition, canSpeak]);

  /* Stop and send what was heard. */
  const stopListening = useCallback(() => {
    recognition.current?.stop();
  }, []);

  const stopSpeaking = useCallback(() => {
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeakingKey(null);
  }, [canSpeak]);

  const speak = useCallback(
    (key: string, text: string) => {
      if (!canSpeak) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(speakable(text));
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1.02;
      utterance.onend = () => setSpeakingKey((current) => (current === key ? null : current));
      utterance.onerror = () => setSpeakingKey((current) => (current === key ? null : current));
      setSpeakingKey(key);
      synth.speak(utterance);
    },
    [canSpeak],
  );

  const setVoiceReplies = useCallback(
    (on: boolean) => {
      setVoiceRepliesState(on);
      if (!on) stopSpeaking();
      try {
        window.localStorage.setItem(VOICE_REPLIES_KEY, on ? "on" : "off");
      } catch {
        /* Blocked storage only forgets the choice next time. */
      }
    },
    [stopSpeaking],
  );

  /* Voices load asynchronously in Chrome; warm the list. Clean up on leave. */
  useEffect(() => {
    if (canSpeak) window.speechSynthesis.getVoices();
    return () => {
      cancelled.current = true;
      recognition.current?.abort();
      if (canSpeak) window.speechSynthesis.cancel();
    };
  }, [canSpeak]);

  return {
    canListen,
    canSpeak,
    listening,
    interim,
    listenError,
    startListening,
    stopListening,
    voiceReplies,
    setVoiceReplies,
    speakingKey,
    speak,
    stopSpeaking,
  };
}
