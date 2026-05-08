import { useEffect, useRef, useState, useCallback } from 'react';
import { GazeData, GazeZone } from '../types';

// Thresholds — will be overridden by calibration in Sprint 3
const YAW_THRESHOLD = 35;   // degrees from center
const PITCH_UP_THRESHOLD = 20;
const PITCH_DOWN_THRESHOLD = -15;

export const useInference = (
    videoRef: React.RefObject<HTMLVideoElement>,
    isActive: boolean,
    // calibrationOffset will be {yaw: 0, pitch: 0} until Sprint 3 wires it in
    calibrationOffset: { yaw: number; pitch: number } = { yaw: 0, pitch: 0 }
) => {
    const [gazeData, setGazeData] = useState<GazeData>({
        zone: 'CENTER',
        pose: { yaw: 0, pitch: 0 },
    });
    const [fps, setFps] = useState(0);
    const faceMeshRef = useRef<any>(null);
    const frameCountRef = useRef(0);
    const lastFpsTime = useRef(Date.now());

    const classifyZone = useCallback(
        (rawYaw: number, rawPitch: number): GazeZone => {
            // Subtract the candidate's natural center offset
            const yaw = rawYaw - calibrationOffset.yaw;
            const pitch = rawPitch - calibrationOffset.pitch;

            if (yaw > YAW_THRESHOLD) return 'RIGHT';
            if (yaw < -YAW_THRESHOLD) return 'LEFT';
            if (pitch > PITCH_UP_THRESHOLD) return 'UP';
            if (pitch < PITCH_DOWN_THRESHOLD) return 'DOWN';
            return 'CENTER';
        },
        [calibrationOffset]
    );

    useEffect(() => {
        if (!isActive) return;

        // FaceMesh requires the global MediaPipe script loaded in index.html
        // We check for it here and warn clearly if it's missing
        if (!window.FaceMesh) {
            console.error(
                '[useInference] window.FaceMesh not found. ' +
                'Add the MediaPipe CDN scripts to index.html'
            );
            return;
        }

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

        fm.onResults((results: any) => {
            // FPS counter
            frameCountRef.current += 1;
            const now = Date.now();
            if (now - lastFpsTime.current >= 1000) {
                setFps(frameCountRef.current);
                frameCountRef.current = 0;
                lastFpsTime.current = now;
            }

            if (
                !results.multiFaceLandmarks ||
                results.multiFaceLandmarks.length === 0
            ) {
                setGazeData({ zone: 'MISSING', pose: { yaw: 0, pitch: 0 } });
                return;
            }

            const lm = results.multiFaceLandmarks[0];

            /*
             * Yaw  (left/right): difference between nose tip (1) and the
             *       midpoint of both ears (234, 454)
             * Pitch (up/down):   difference between nose tip (1) and the
             *       midpoint of forehead (10) and chin (152)
             *
             * Multiplied by 500 to convert normalised units to approximate degrees.
             * This is a good-enough approximation for zone classification.
             */
            const nose = lm[1];
            const leftEar = lm[234];
            const rightEar = lm[454];
            const forehead = lm[10];
            const chin = lm[152];

            const midEarX = (leftEar.x + rightEar.x) / 2;
            const rawYaw = (nose.x - midEarX) * 500;

            const midVertY = (forehead.y + chin.y) / 2;
            const rawPitch = (nose.y - midVertY) * 500;

            const zone = classifyZone(rawYaw, rawPitch);

            // Log to console for D3 verification
            console.log(
                `[Gaze] zone=${zone} yaw=${rawYaw.toFixed(1)} pitch=${rawPitch.toFixed(1)}`
            );

            setGazeData({ zone, pose: { yaw: rawYaw, pitch: rawPitch } });
        });

        faceMeshRef.current = fm;

        // Camera loop — feeds frames into FaceMesh
        if (!window.Camera || !videoRef.current) return;

        const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
                if (faceMeshRef.current && videoRef.current) {
                    await faceMeshRef.current.send({ image: videoRef.current });
                }
            },
            width: 640,
            height: 480,
        });

        camera.start();

        return () => {
            camera.stop();
            faceMeshRef.current?.close();
        };
    }, [isActive, classifyZone]);

    return { gazeData, fps };
};

// Extend Window for MediaPipe globals
declare global {
    interface Window {
        FaceMesh: any;
        Camera: any;
    }
}