import React from 'react';
export function useReaderTts({ viewRef, settingsRef }) {
  const ttsEnabledRef = React.useRef(false);
  const [ttsStatus, setTtsStatus] = React.useState('off');
  const speakNext = React.useCallback(async (D) => {
    if (!ttsEnabledRef.current) return;
    if (
      !D &&
      (await viewRef.current?.goRight(),
      await new Promise((S0) => window.setTimeout(S0, 120)),
      await viewRef.current?.initTTS('sentence'),
      (D = viewRef.current?.tts?.start()),
      !D)
    )
      return stopTts();
    const n0 = new DOMParser()
      .parseFromString(D, 'application/xml')
      .documentElement.textContent?.trim();
    if (!n0) return speakNext(viewRef.current?.tts?.next());
    const C0 = new SpeechSynthesisUtterance(n0);
    C0.rate = settingsRef.current.ttsRate;
    C0.pitch = settingsRef.current.ttsPitch;
    C0.lang = viewRef.current?.language?.canonical || 'zh-CN';
    C0.onend = () => {
      ttsEnabledRef.current && speakNext(viewRef.current?.tts?.next());
    };
    C0.onerror = () => stopTts();
    speechSynthesis.speak(C0);
  }, []);
  const toggleTts = async () => {
    if (ttsStatus === 'paused') {
      speechSynthesis.resume();
      setTtsStatus('playing');
      return;
    }
    if (ttsStatus === 'playing') {
      speechSynthesis.pause();
      setTtsStatus('paused');
      return;
    }
    try {
      speechSynthesis.cancel();
      ttsEnabledRef.current = true;
      await viewRef.current?.initTTS('sentence');
      setTtsStatus('playing');
      await speakNext(viewRef.current?.tts?.start());
    } catch {
      stopTts();
    }
  };
  function stopTts() {
    ttsEnabledRef.current = false;
    speechSynthesis.cancel();
    setTtsStatus('off');
  }
  React.useEffect(
    () => () => {
      ttsEnabledRef.current = false;
      speechSynthesis.cancel();
    },
    [],
  );
  return {
    ttsStatus,
    toggleTts,
    stopTts,
  };
}
