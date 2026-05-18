import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceLandmark, GazeData, GazeZone } from '../types';

const YAW_THRESHOLD = 35;
const PITCH_UP_THRESHOLD = 20;
const PITCH_DOWN_THRESHOLD = -15;
const DEFAULT_CALIBRATION_OFFSET = { yaw: 0, pitch: 0 };

interface FaceMeshResults {
  multiFaceLandmarks?: FaceLandmark[][];
}

interface FaceMeshInstance {
  setOptions(options: {
    maxNumFaces: number;
    refineLandmarks: boolean;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }): void;
  onResults(callback: (results: FaceMeshResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

interface FaceMeshConstructor {
  new (config: { locateFile: (file: string) => string }): FaceMeshInstance;
}

export const useInference = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  calibrationOffset: { yaw: number; pitch: number } = DEFAULT_CALIBRATION_OFFSET,
) => {
  const [gazeData, setGazeData] = useState<GazeData>({
    zone: 'CENTER',
    pose: { yaw: 0, pitch: 0 },
  });
  const latestPoseRef = useRef({ yaw: 0, pitch: 0 });
  const [fps, setFps] = useState(0);
  const [landmarks, setLandmarks] = useState<FaceLandmark[]>([]);
  const faceMeshRef = useRef<FaceMeshInstance | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsTime = useRef<number>(0);

  const classifyZone = useCallback(
    (rawYaw: number, rawPitch: number): GazeZone => {
      const yaw = rawYaw - calibrationOffset.yaw;
      const pitch = rawPitch - calibrationOffset.pitch;

      if (yaw > YAW_THRESHOLD) return 'RIGHT';
      if (yaw < -YAW_THRESHOLD) return 'LEFT';
      if (pitch > PITCH_UP_THRESHOLD) return 'UP';
      if (pitch < PITCH_DOWN_THRESHOLD) return 'DOWN';
      return 'CENTER';
    },
    [calibrationOffset],
  );

  useEffect(() => {
    if (!isActive) return;

    if (!window.FaceMesh) {
      console.error(
        '[useInference] FaceMesh global not found. Add the FaceMesh CDN script to index.html',
      );
      return;
    }

    let rafId = 0;
    let isRunning = true;
    let isProcessing = false;

    const fm = new window.FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    fm.onResults((results: FaceMeshResults) => {
      frameCountRef.current += 1;
      const now = Date.now();

      if (lastFpsTime.current === 0) lastFpsTime.current = now;

      if (now - lastFpsTime.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTime.current = now;
      }

      const faceLandmarks = results.multiFaceLandmarks?.[0];
      if (!faceLandmarks) {
        setLandmarks([]);
        setGazeData({ zone: 'MISSING', pose: { yaw: 0, pitch: 0 } });
        return;
      }

      setLandmarks(faceLandmarks);

      const nose = faceLandmarks[1];
      const leftEar = faceLandmarks[234];
      const rightEar = faceLandmarks[454];
      const forehead = faceLandmarks[10];
      const chin = faceLandmarks[152];

      if (!nose || !leftEar || !rightEar || !forehead || !chin) return;

      const midEarX = (leftEar.x + rightEar.x) / 2;
      const rawYaw = (nose.x - midEarX) * 500;

      const midVertY = (forehead.y + chin.y) / 2;
      const rawPitch = (nose.y - midVertY) * 500;

      const zone = classifyZone(rawYaw, rawPitch);

      console.log(
        `[Gaze] zone=${zone} yaw=${rawYaw.toFixed(1)} pitch=${rawPitch.toFixed(1)}`,
      );

      latestPoseRef.current = { yaw: rawYaw, pitch: rawPitch };
      setGazeData({ zone, pose: { yaw: rawYaw, pitch: rawPitch } });
    });

    faceMeshRef.current = fm;

    const processFrame = async () => {
      const video = videoRef.current;

      if (
        isRunning &&
        !isProcessing &&
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        isProcessing = true;

        try {
          await fm.send({ image: video });
        } catch (err: unknown) {
          isRunning = false;
          setFps(0);
          setLandmarks([]);
          setGazeData({ zone: 'MISSING', pose: { yaw: 0, pitch: 0 } });
          console.error('[useInference] FaceMesh frame error:', err);
        } finally {
          isProcessing = false;
        }
      }

      if (isRunning) {
        rafId = requestAnimationFrame(processFrame);
      }
    };

    rafId = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
      setLandmarks([]);
      setFps(0);
      fm.close();
      faceMeshRef.current = null;
      lastFpsTime.current = 0;
      frameCountRef.current = 0;
    };
  }, [isActive, classifyZone, videoRef]);

  return { gazeData, fps, landmarks, latestPoseRef };
};

declare global {
  interface Window {
    FaceMesh?: FaceMeshConstructor;
  }
}
