// Shared types used across hooks and components.

export type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied';

export type GazeZone = 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'MISSING';

export interface HeadPose {
  yaw: number;
  pitch: number;
}

export interface GazeData {
  zone: GazeZone;
  pose: HeadPose;
}

export type CalibrationPointId =
  | 'top_left'
  | 'top_right'
  | 'bottom_right'
  | 'bottom_left'
  | 'center';

export interface CalibrationPointSample {
  point: CalibrationPointId;
  yaw: number;
  pitch: number;
}

export interface AudioData {
  level: number;
  isSpeaking: boolean;
}

export interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface FramePayload {
  timestamp: number;
  gaze_zone: GazeZone;
  head_pose: HeadPose;
  face_visible: boolean;
  fps: number;
  audio_level: number;
  vad_speech: boolean;
  objects: string[];
}

export interface SyncRequest {
  session_id: string;
  frames: FramePayload[];
}

export interface SyncResponse {
  session_id: string;
  received_count: number;
  confidence: number;
  echoed_frames: FramePayload[];
}
