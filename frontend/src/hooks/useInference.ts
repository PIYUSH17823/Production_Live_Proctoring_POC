import { useEffect, useRef, useState } from 'react';
import * as faceMesh from '@mediapipe/face_mesh';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export const useInference = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [isModelReady, setIsModelReady] = useState(false);
  const [inferenceData, setInferenceData] = useState<{
    yaw: number;
    pitch: number;
    roll: number;
    objects: string[];
    faceVisible: boolean;
  }>({ yaw: 0, pitch: 0, roll: 0, objects: [], faceVisible: false });

  const detectorRef = useRef<cocoSsd.ObjectDetection | null>(null);

  useEffect(() => {
    const initModels = async () => {
      // 1. Initialize COCO-SSD
      detectorRef.current = await cocoSsd.load();
      
      // 2. Initialize FaceMesh
      const fm = new faceMesh.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      fm.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          
          // Basic Yaw/Pitch estimation from landmarks
          // Landmark 1: Nose Tip, 152: Chin, 33: Left Eye, 263: Right Eye
          const yaw = (landmarks[33].x + landmarks[263].x) / 2 - landmarks[1].x;
          const pitch = (landmarks[33].y + landmarks[263].y) / 2 - landmarks[1].y;

          setInferenceData(prev => ({
            ...prev,
            yaw: yaw * 100, // Scaling for easier thresholding
            pitch: pitch * 100,
            faceVisible: true
          }));
        } else {
          setInferenceData(prev => ({ ...prev, faceVisible: false }));
        }
      });

      const processFrame = async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          // Object detection (Throttle to every 5th frame for performance)
          if (detectorRef.current) {
            const predictions = await detectorRef.current.detect(videoRef.current);
            const objects = predictions.map(p => p.class);
            setInferenceData(prev => ({ ...prev, objects }));
          }
          
          await fm.send({ image: videoRef.current });
        }
        requestAnimationFrame(processFrame);
      };

      setIsModelReady(true);
      processFrame();
    };

    initModels();
  }, []);

  return { isModelReady, inferenceData };
};
