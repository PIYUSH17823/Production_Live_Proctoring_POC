import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CalibrationPointId,
  CalibrationPointSample,
  HeadPose,
} from '../types';

const PAUSE_MS = 2000;
const SAMPLE_INTERVAL_MS = 60;
const SAMPLES_PER_POINT = 20;
const TRAVEL_MS = 900;

interface CalibrationPoint {
  id: CalibrationPointId;
  label: string;
  x: string;
  y: string;
}

const POINTS: CalibrationPoint[] = [
  { id: 'top_left', label: 'Top left', x: '5%', y: '7%' },
  { id: 'top_right', label: 'Top right', x: '95%', y: '7%' },
  { id: 'bottom_right', label: 'Bottom right', x: '95%', y: '93%' },
  { id: 'bottom_left', label: 'Bottom left', x: '5%', y: '93%' },
  { id: 'center', label: 'Center', x: '50%', y: '50%' },
];

interface Props {
  isActive: boolean;
  latestPoseRef: React.MutableRefObject<HeadPose>;
  onComplete: (samples: CalibrationPointSample[]) => void;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length === 0) return 0;
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
};

const CalibrationOverlay: React.FC<Props> = ({
  isActive,
  latestPoseRef,
  onComplete,
}) => {
  const [pointIndex, setPointIndex] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [phase, setPhase] = useState<'moving' | 'sampling'>('moving');
  const [isDone, setIsDone] = useState(false);
  const collectedRef = useRef<CalibrationPointSample[]>([]);

  const currentPoint = POINTS[pointIndex];
  const totalSamples = POINTS.length * SAMPLES_PER_POINT;
  const completedSamples = pointIndex * SAMPLES_PER_POINT + sampleCount;
  const progress = Math.min((completedSamples / totalSamples) * 100, 100);

  const pointSamples = useMemo(
    () =>
      collectedRef.current.filter(
        (sample) => sample.point === currentPoint?.id,
      ),
    [currentPoint?.id, sampleCount],
  );

  useEffect(() => {
    if (!isActive || isDone || !currentPoint) return;

    setSampleCount(0);
    setPhase('moving');
    let pauseId = 0;
    const travelId = window.setTimeout(() => {
      setPhase('sampling');
      pauseId = window.setTimeout(() => {
        const intervalId = window.setInterval(() => {
          const pose = latestPoseRef.current;
          collectedRef.current.push({
            point: currentPoint.id,
            yaw: pose.yaw,
            pitch: pose.pitch,
          });

          setSampleCount((count) => {
            const nextCount = count + 1;

            if (nextCount >= SAMPLES_PER_POINT) {
              window.clearInterval(intervalId);
              setPointIndex((index) => {
                const nextIndex = index + 1;

                if (nextIndex >= POINTS.length) {
                  setIsDone(true);
                  onComplete(
                    POINTS.map((point) => {
                      const samples = collectedRef.current.filter(
                        (sample) => sample.point === point.id,
                      );

                      return {
                        point: point.id,
                        yaw: median(samples.map((sample) => sample.yaw)),
                        pitch: median(samples.map((sample) => sample.pitch)),
                      };
                    }),
                  );
                  return index;
                }

                return nextIndex;
              });
            }

            return Math.min(nextCount, SAMPLES_PER_POINT);
          });
        }, SAMPLE_INTERVAL_MS);
      }, PAUSE_MS);
    }, TRAVEL_MS);

    return () => {
      window.clearTimeout(travelId);
      window.clearTimeout(pauseId);
    };
  }, [currentPoint, isActive, isDone, latestPoseRef, onComplete]);

  if (!isActive || isDone || !currentPoint) return null;

  return (
    <div style={styles.overlay}>
      <div
        style={{
          ...styles.ball,
          left: currentPoint.x,
          top: currentPoint.y,
        }}
      />
      <div style={styles.hud}>
        <div style={styles.title}>Calibration</div>
        <div style={styles.copy}>
          {phase === 'moving'
            ? `Follow the dot to ${currentPoint.label}`
            : `Hold your gaze on ${currentPoint.label}`}
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <div style={styles.meta}>
          Point {pointIndex + 1}/{POINTS.length} · {phase} · Samples{' '}
          {pointSamples.length}/{SAMPLES_PER_POINT}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    pointerEvents: 'auto',
    background: '#0f172a',
  } as React.CSSProperties,

  ball: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    borderRadius: '50%',
    background: '#22c55e',
    border: '3px solid #ffffff',
    boxShadow:
      '0 0 0 12px rgba(34, 197, 94, 0.16), 0 14px 36px rgba(15, 23, 42, 0.5)',
    transition:
      'left 900ms cubic-bezier(0.22, 1, 0.36, 1), top 900ms cubic-bezier(0.22, 1, 0.36, 1)',
  } as React.CSSProperties,

  hud: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 'min(420px, calc(100vw - 32px))',
    transform: 'translate(-50%, -50%)',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 8,
    border: '1px solid rgba(226, 232, 240, 0.9)',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  title: {
    fontSize: 11,
    fontWeight: 800,
    color: '#0f172a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
  } as React.CSSProperties,

  copy: {
    marginTop: 4,
    fontSize: 13,
    color: '#334155',
    fontWeight: 600,
  } as React.CSSProperties,

  progressTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 999,
    background: '#e2e8f0',
    overflow: 'hidden',
  } as React.CSSProperties,

  progressFill: {
    height: '100%',
    borderRadius: 999,
    background: '#22c55e',
    transition: 'width 120ms linear',
  } as React.CSSProperties,

  meta: {
    marginTop: 8,
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
  } as React.CSSProperties,
};

export default CalibrationOverlay;
