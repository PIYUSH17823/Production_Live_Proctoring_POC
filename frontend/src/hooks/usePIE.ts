import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { PIEMetrics, FramePayload, SyncPayload } from '../../../shared/types';

export const usePIE = (sessionId: string) => {
  const [metrics, setMetrics] = useState<PIEMetrics | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const frameBuffer = useRef<FramePayload[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);

  // L01: Audio RMS Monitoring
  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new AudioContext();
      const source = audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      source.connect(analyser.current);
    } catch (err) {
      console.error("PIE: Audio access denied", err);
    }
  };

  const getAudioLevel = (): number => {
    if (!analyser.current) return 0;
    const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
    analyser.current.getByteFrequencyData(dataArray);
    const sum = dataArray.reduce((a, b) => a + b, 0);
    return sum / dataArray.length / 255; // Normalized 0-1
  };

  // L01/L02: Frame Collection (Triggered by Vision Loop)
  const collectFrame = (
    gazeRatio: number, 
    headPose: { yaw: number, pitch: number, roll: number }, 
    objects: string[], 
    contextFlags: string[] = []
  ) => {
    if (!isRecording) return;
    
    frameBuffer.current.push({
      timestamp: Date.now(),
      gaze_ratio: gazeRatio,
      audio_level: getAudioLevel(),
      objects: objects,
      head_pose: headPose,
      context_flags: contextFlags
    });
  };

  // Sprint 2: Batch Sync Loop (1 Hz)
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(async () => {
      if (frameBuffer.current.length === 0) return;

      try {
        const payload: SyncPayload = {
          session_id: sessionId,
          frames: [...frameBuffer.current]
        };
        frameBuffer.current = []; // Immediate eviction to prevent duplicates

        const response = await axios.post(`${import.meta.env.VITE_API_URL}/sync`, payload);
        const data = response.data as PIEMetrics;
        
        setMetrics(data);

        // Explanability: Log high-severity insights to console for dev transparency
        if (data.insights?.length > 0) {
            data.insights.forEach(insight => {
                if (insight.includes("🚩")) console.warn(`[PIE ALERT] ${insight}`);
            });
        }
      } catch (err) {
        console.error("PIE Sync failure:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, sessionId]);

  const startRecording = () => {
    setIsRecording(true);
    startAudio();
  };

  return { metrics, collectFrame, startRecording, isRecording };
};
