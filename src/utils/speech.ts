import { useCallback, useEffect, useRef, useState } from 'react';

export interface NarrationSegment {
  label: string;
  text: string;
  paragraphIndex?: number;
}

export function useThaiSpeech() {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [rate, setRateState] = useState<number>(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [segments, setSegments] = useState<NarrationSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);

  const sessionIdRef = useRef(0);
  const segmentsRef = useRef<NarrationSegment[]>([]);
  const currentIndexRef = useRef(0);
  const rateRef = useRef(1.0);
  const voiceURIRef = useRef('');
  const isSpeakingRef = useRef(false);

  // Sync available speech synthesis voices (handles async loading in Chromium)
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      const sorted = [...available].sort((a, b) => {
        const aThai = a.lang.toLowerCase().startsWith('th') ? 0 : 1;
        const bThai = b.lang.toLowerCase().startsWith('th') ? 0 : 1;
        return aThai - bThai;
      });
      setVoices(sorted);

      if (!voiceURIRef.current && sorted.length > 0) {
        const defaultThai =
          sorted.find((v) => v.lang.toLowerCase().startsWith('th')) ||
          sorted[0];
        if (defaultThai) {
          voiceURIRef.current = defaultThai.voiceURI;
          setSelectedVoiceURI(defaultThai.voiceURI);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    sessionIdRef.current += 1;
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeakingId(null);
    setSegments([]);
    segmentsRef.current = [];
    setCurrentSegmentIndex(0);
    currentIndexRef.current = 0;
  }, [isSupported]);

  const speakSegmentAt = useCallback(
    (index: number, sessionId: number, activeId: string) => {
      if (!isSupported) return;
      if (sessionId !== sessionIdRef.current) return;

      const list = segmentsRef.current;
      if (index < 0 || index >= list.length) {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setIsPaused(false);
        setSpeakingId(null);
        setCurrentSegmentIndex(0);
        currentIndexRef.current = 0;
        return;
      }

      currentIndexRef.current = index;
      setCurrentSegmentIndex(index);

      const segment = list[index];
      const utterance = new SpeechSynthesisUtterance(segment.text);
      utterance.lang = 'th-TH';
      utterance.rate = rateRef.current;

      const allVoices = window.speechSynthesis.getVoices();
      const matchedVoice =
        allVoices.find((v) => v.voiceURI === voiceURIRef.current) ||
        allVoices.find((v) => v.lang.toLowerCase().startsWith('th'));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang || 'th-TH';
      }

      utterance.onstart = () => {
        if (sessionId !== sessionIdRef.current) return;
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        setIsPaused(false);
        setSpeakingId(activeId);
      };

      utterance.onend = () => {
        if (sessionId !== sessionIdRef.current) return;
        if (index + 1 < list.length) {
          speakSegmentAt(index + 1, sessionId, activeId);
        } else {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          setIsPaused(false);
          setSpeakingId(null);
          setCurrentSegmentIndex(0);
          currentIndexRef.current = 0;
        }
      };

      utterance.onerror = () => {
        if (sessionId !== sessionIdRef.current) return;
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setIsPaused(false);
        setSpeakingId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const speakQueue = useCallback(
    (
      nextSegments: NarrationSegment[],
      id: string,
      startIndex = 0
    ) => {
      if (!isSupported || nextSegments.length === 0) return;

      const cleanSegments = nextSegments.filter((s) => s.text.trim().length > 0);
      if (cleanSegments.length === 0) return;

      sessionIdRef.current += 1;
      const mySession = sessionIdRef.current;
      window.speechSynthesis.cancel();

      segmentsRef.current = cleanSegments;
      setSegments(cleanSegments);
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setIsPaused(false);
      setSpeakingId(id);

      const safeIndex = Math.max(
        0,
        Math.min(cleanSegments.length - 1, startIndex)
      );
      speakSegmentAt(safeIndex, mySession, id);
    },
    [isSupported, speakSegmentAt]
  );

  const speak = useCallback(
    (text: string, id: string) => {
      if (!isSupported) return;
      if (isSpeakingRef.current && speakingId === id) {
        stop();
        return;
      }
      speakQueue([{ label: 'เสียงบรรยาย', text }], id, 0);
    },
    [isSupported, speakingId, stop, speakQueue]
  );

  const pause = useCallback(() => {
    if (!isSupported || !isSpeakingRef.current) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported || !isSpeakingRef.current) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported]);

  const togglePause = useCallback(() => {
    if (!isSpeakingRef.current) return;
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  const jumpToSegment = useCallback(
    (targetIndex: number) => {
      if (!isSupported || !speakingId || segmentsRef.current.length === 0) {
        return;
      }
      const bounded = Math.max(
        0,
        Math.min(segmentsRef.current.length - 1, targetIndex)
      );
      sessionIdRef.current += 1;
      const mySession = sessionIdRef.current;
      window.speechSynthesis.cancel();
      setIsPaused(false);
      speakSegmentAt(bounded, mySession, speakingId);
    },
    [isSupported, speakingId, speakSegmentAt]
  );

  const nextSegment = useCallback(() => {
    if (currentIndexRef.current + 1 < segmentsRef.current.length) {
      jumpToSegment(currentIndexRef.current + 1);
    }
  }, [jumpToSegment]);

  const prevSegment = useCallback(() => {
    if (currentIndexRef.current > 0) {
      jumpToSegment(currentIndexRef.current - 1);
    }
  }, [jumpToSegment]);

  const setRate = useCallback(
    (nextRate: number) => {
      rateRef.current = nextRate;
      setRateState(nextRate);
      if (
        isSupported &&
        isSpeakingRef.current &&
        speakingId &&
        segmentsRef.current.length > 0
      ) {
        sessionIdRef.current += 1;
        const mySession = sessionIdRef.current;
        window.speechSynthesis.cancel();
        setIsPaused(false);
        speakSegmentAt(currentIndexRef.current, mySession, speakingId);
      }
    },
    [isSupported, speakingId, speakSegmentAt]
  );

  const handleSelectVoice = useCallback(
    (uri: string) => {
      voiceURIRef.current = uri;
      setSelectedVoiceURI(uri);
      if (
        isSupported &&
        isSpeakingRef.current &&
        speakingId &&
        segmentsRef.current.length > 0
      ) {
        sessionIdRef.current += 1;
        const mySession = sessionIdRef.current;
        window.speechSynthesis.cancel();
        setIsPaused(false);
        speakSegmentAt(currentIndexRef.current, mySession, speakingId);
      }
    },
    [isSupported, speakingId, speakSegmentAt]
  );

  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const thaiVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith('th')
  );

  return {
    isSupported,
    isSpeaking,
    isPaused,
    speakingId,
    rate,
    setRate,
    voices: thaiVoices.length > 0 ? thaiVoices : voices,
    selectedVoiceURI,
    setSelectedVoiceURI: handleSelectVoice,
    segments,
    currentSegmentIndex,
    currentSegment: segments[currentSegmentIndex] || null,
    speak,
    speakQueue,
    pause,
    resume,
    togglePause,
    stop,
    nextSegment,
    prevSegment,
    jumpToSegment,
  };
}
