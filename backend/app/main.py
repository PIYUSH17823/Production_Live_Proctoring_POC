from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from typing import Literal
from uuid import uuid4

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
        "https://production-live-proct-git-b68f3b-piyush9-skilljourneys-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GazeZone = Literal["CENTER", "LEFT", "RIGHT", "UP", "DOWN", "MISSING"]
MAX_RECENT_FRAMES = 200
SESSION_TOKEN_TTL_MINUTES = 120
FRONTEND_IFRAME_BASE_URL = (
    "https://production-live-proct-git-b68f3b-piyush9-skilljourneys-projects.vercel.app"
)
SESSION_STORE: dict[str, "SessionRecord"] = {}


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
    session_id: str | None = None
    frames: list[FramePayload]


class SyncResponse(BaseModel):
    session_id: str
    received_count: int
    confidence: float
    echoed_frames: list[FramePayload]


class SessionRecord(BaseModel):
    session_id: str
    created_at: str
    last_seen_at: str
    candidate_id: str | None = None
    assessment_id: str | None = None
    proctoring_token: str | None = None
    expires_at: str | None = None
    total_frames: int = 0
    last_confidence: float = 0.0
    recent_frames: list[FramePayload] = []


class AdminSessionSummary(BaseModel):
    session_id: str
    candidate_id: str | None = None
    assessment_id: str | None = None
    created_at: str
    last_seen_at: str
    expires_at: str | None = None
    total_frames: int
    last_confidence: float
    recent_frame_count: int


class AdminSessionsResponse(BaseModel):
    sessions: list[AdminSessionSummary]


class SessionStartRequest(BaseModel):
    candidate_id: str
    assessment_id: str


class SessionStartResponse(BaseModel):
    session_id: str
    proctoring_token: str
    expires_at: str
    iframe_url: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_iframe_url(session_id: str, proctoring_token: str) -> str:
    return (
        f"{FRONTEND_IFRAME_BASE_URL}/"
        f"?session_id={session_id}&token={proctoring_token}"
    )


def get_or_create_session(session_id: str | None) -> SessionRecord:
    resolved_session_id = session_id or f"session-{uuid4()}"
    record = SESSION_STORE.get(resolved_session_id)
    if record:
        return record

    now = utc_now()
    record = SessionRecord(
        session_id=resolved_session_id,
        created_at=now,
        last_seen_at=now,
    )
    SESSION_STORE[resolved_session_id] = record
    return record


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

    session = get_or_create_session(payload.session_id)
    session.last_seen_at = utc_now()
    session.total_frames += frame_count
    session.last_confidence = confidence
    session.recent_frames.extend(payload.frames)
    session.recent_frames = session.recent_frames[-MAX_RECENT_FRAMES:]

    return SyncResponse(
        session_id=session.session_id,
        received_count=frame_count,
        confidence=confidence,
        echoed_frames=payload.frames,
    )


@app.post("/api/session/start", response_model=SessionStartResponse)
def session_start(body: SessionStartRequest) -> SessionStartResponse:
    session_id = f"session-{uuid4()}"
    proctoring_token = token_urlsafe(32)
    now = utc_now()
    expires_at = (
        datetime.now(timezone.utc) + timedelta(minutes=SESSION_TOKEN_TTL_MINUTES)
    ).isoformat()
    SESSION_STORE[session_id] = SessionRecord(
        session_id=session_id,
        created_at=now,
        last_seen_at=now,
        candidate_id=body.candidate_id,
        assessment_id=body.assessment_id,
        proctoring_token=proctoring_token,
        expires_at=expires_at,
    )
    return SessionStartResponse(
        session_id=session_id,
        proctoring_token=proctoring_token,
        expires_at=expires_at,
        iframe_url=build_iframe_url(session_id, proctoring_token),
    )

@app.get("/api/admin/sessions", response_model=AdminSessionsResponse)
def list_sessions() -> AdminSessionsResponse:
    return AdminSessionsResponse(
        sessions=[
            AdminSessionSummary(
                session_id=session.session_id,
                candidate_id=session.candidate_id,
                assessment_id=session.assessment_id,
                created_at=session.created_at,
                last_seen_at=session.last_seen_at,
                expires_at=session.expires_at,
                total_frames=session.total_frames,
                last_confidence=session.last_confidence,
                recent_frame_count=len(session.recent_frames),
            )
            for session in SESSION_STORE.values()
        ]
    )


@app.get("/api/admin/sessions/{session_id}", response_model=SessionRecord)
def get_session(session_id: str) -> SessionRecord:
    return get_or_create_session(session_id)
