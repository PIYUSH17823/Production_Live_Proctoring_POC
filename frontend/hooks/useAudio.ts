import { useEffect, useRef, useState } from 'react';
import { AudioData } from '../../types';

// VAD threshold — speech detected if RMS > 0.05
const VAD_THRESHOLD = 0.05;

export const useAudio = (isActive: boolean) => {
  const [audioData, setAudioData] = useState<AudioData>({
    level: 0,
    isSpeaking: false,
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) return;

    let analyser: AnalyserNode;
    let dataArray: Uint8Array;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        ctxRef.current = new AudioCtx();
        analyser = ctxRef.current.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const source = ctxRef.current.createMediaStreamSource(stream);
        source.connect(analyser);

        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          // RMS of normalised values (0-1)
          const rms = Math.sqrt(
            dataArray.reduce((sum, v) => sum + (v / 255) ** 2, 0) /
            dataArray.length
          );
          setAudioData({ level: rms, isSpeaking: rms > VAD_THRESHOLD });
          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        console.error('[useAudio] Mic access error:', err);
      }
    };

    setup();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close();
    };
  }, [isActive]);

  return { audioData };
};