import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalibrationMap, FaceLandmark, GazeData, GazeZone } from '../types';

declare global {
  interface Window {
    FaceMesh?: any;
    tf?: any;
    cocoSsd?: any;
  }
}

const DEFAULT_YAW_THRESHOLD = 35;
const DEFAULT_PITCH_THRESHOLD = 20;
const MIN_YAW_THRESHOLD = 12;
const MIN_PITCH_THRESHOLD = 10;
const RANGE_THRESHOLD_RATIO = 0.32;
const OBJECT_DETECTION_INTERVAL_MS = 1000; // Run object detection every 1000ms

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

export const useInference = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  calibrationMap: CalibrationMap | null = null,
) => {
  const [gazeData, setGazeData] = useState<GazeData>({
    zone: 'CENTER',
    pose: { yaw: 0, pitch: 0 },
  });
  const [objects, setObjects] = useState<string[]>([]);
  const previousObjectsRef = useRef<string[]>([]);
  const latestPoseRef = useRef({ yaw: 0, pitch: 0 });
  const [fps, setFps] = useState(0);
  const [landmarks, setLandmarks] = useState<FaceLandmark[]>([]);
  const faceMeshRef = useRef<FaceMeshInstance | null>(null);
  const cocoSsdModelRef = useRef<any>(null);
  const frameCountRef = useRef(0);
  const lastFpsTime = useRef<number>(0);
  const lastObjectDetectionTime = useRef<number>(0);
  const isDetecting = useRef(false);

  const classifyZone = useCallback(
    (rawYaw: number, rawPitch: number): GazeZone => {
      const yaw = rawYaw - (calibrationMap?.centerYaw ?? 0);
      const pitch = rawPitch - (calibrationMap?.centerPitch ?? 0);
      const yawThreshold = calibrationMap
        ? Math.max(calibrationMap.yawRange * RANGE_THRESHOLD_RATIO, MIN_YAW_THRESHOLD)
        : DEFAULT_YAW_THRESHOLD;
      const pitchThreshold = calibrationMap
        ? Math.max(
            calibrationMap.pitchRange * RANGE_THRESHOLD_RATIO,
            MIN_PITCH_THRESHOLD,
          )
        : DEFAULT_PITCH_THRESHOLD;

      if (yaw > yawThreshold) return 'RIGHT';
      if (yaw < -yawThreshold) return 'LEFT';
      if (pitch > pitchThreshold) return 'UP';
      if (pitch < -pitchThreshold) return 'DOWN';
      return 'CENTER';
    },
    [calibrationMap],
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
    let objectDetectionIntervalId = 0;

    // Initialize COCO-SSD for object detection
    const initCocoSsd = async () => {
      try {
        if (!window.cocoSsd) {
          console.warn('[useInference] COCO-SSD not available, skipping object detection');
          return;
        }
        const model = await window.cocoSsd.load();
        cocoSsdModelRef.current = model;
        console.log('[useInference] COCO-SSD model loaded');
      } catch (err) {
        console.error('[useInference] Failed to load COCO-SSD:', err);
      }
    };

    // Run object detection periodically
    const detectObjects = async () => {
      if (!cocoSsdModelRef.current || !videoRef.current || isDetecting.current) return;

      isDetecting.current = true;
      try {
        const predictions: any[] = await cocoSsdModelRef.current.detect(videoRef.current);
        
        // Filter with different thresholds: person lower (0.55) for better multi-person detection, others higher (0.65)
        // IMPORTANT: Preserve duplicates in array so person_count works correctly on backend
        const detectedClasses = predictions
          .filter((p: any) => {
            const lowerClass = String(p.class).toLowerCase();
            // Lower threshold for person to catch second person at angles
            if (lowerClass === 'person') {
              return p.score > 0.55;
            }
            // Standard threshold for other objects (phone, laptop, etc)
            return p.score > 0.65;
          })
          .map((p: any) => String(p.class).toLowerCase());
        
        // Only update and log if detection results changed (avoid spam)
        const classesChanged = previousObjectsRef.current.sort().join(',') !== detectedClasses.sort().join(',');
        if (classesChanged) {
          console.log('[COCO-SSD] Objects detected:', detectedClasses, `(person count: ${detectedClasses.filter(c => c === 'person').length})`);
          previousObjectsRef.current = detectedClasses;
          setObjects(detectedClasses);
        }
      } catch (err) {
        console.error('[useInference] Object detection error:', err);
      } finally {
        isDetecting.current = false;
      }
    };

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
      setGazeData({
        zone,
        pose: {
          yaw: rawYaw - (calibrationMap?.centerYaw ?? 0),
          pitch: rawPitch - (calibrationMap?.centerPitch ?? 0),
        },
      });
    });

    faceMeshRef.current = fm;

    // Initialize COCO-SSD and start object detection
    initCocoSsd().then(() => {
      if (isRunning && cocoSsdModelRef.current) {
        objectDetectionIntervalId = window.setInterval(detectObjects, OBJECT_DETECTION_INTERVAL_MS);
      }
    });

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
          setObjects([]);
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
      if (objectDetectionIntervalId) clearInterval(objectDetectionIntervalId);
      setLandmarks([]);
      setObjects([]);
      setFps(0);
      fm.close();
      faceMeshRef.current = null;
      cocoSsdModelRef.current = null;
      lastFpsTime.current = 0;
      frameCountRef.current = 0;
      lastObjectDetectionTime.current = 0;
      previousObjectsRef.current = [];
    };
  }, [isActive, classifyZone, videoRef]);

  return { gazeData, fps, landmarks, objects, latestPoseRef };
};
