export interface FramePayload {
  timestamp: number;
  gaze_ratio: number;
  audio_level: number;
  objects: string[];
  context_flags?: string[];
  head_pose?: {
    yaw: number;
    pitch: number;
    roll: number;
  };
}

export interface SyncPayload {
  session_id: string;
  frames: FramePayload[];
}

export interface PIEMetrics {
  attentiveness: number;
  environment: number;
  integrity: number;
  confidence: number;
  narrative: string;
  flags: string[];
  insights: string[];
}
