from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.confidence import calculate_confidence

app = FastAPI(title="PIE v2 Proctoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GazeZone = Literal["CENTER", "LEFT", "RIGHT", "UP", "DOWN", "MISSING"]


class HeadPose(BaseModel):
    yaw: float
    pitch: float


class FramePayload(BaseModel):
    timestamp: int
    gaze_zone: GazeZone
    head_pose: HeadPose
    face_visible: bool
    fps: float
    audio_level: float
    vad_speech: bool
    objects: list[str]


class SyncRequest(BaseModel):
    session_id: str
    frames: list[FramePayload]


class SyncResponse(BaseModel):
    session_id: str
    received_count: int
    confidence: float
    echoed_frames: list[FramePayload]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/sync", response_model=SyncResponse)
def sync(payload: SyncRequest) -> SyncResponse:
    frame_count = len(payload.frames)
    avg_fps = (
        sum(frame.fps for frame in payload.frames) / frame_count
        if frame_count
        else 0.0
    )
    visibility_ratio = (
        sum(1 for frame in payload.frames if frame.face_visible) / frame_count
        if frame_count
        else 0.0
    )
    confidence = calculate_confidence(
        avg_fps=avg_fps,
        visibility_ratio=visibility_ratio,
    )

    return SyncResponse(
        session_id=payload.session_id,
        received_count=frame_count,
        confidence=confidence,
        echoed_frames=payload.frames,
    )
