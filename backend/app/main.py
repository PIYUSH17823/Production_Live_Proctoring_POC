from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel

# L01/L02 Foundation: Sync Schema
class FrameData(BaseModel):
    timestamp: float
    gaze_ratio: float
    audio_level: float
    objects: List[str]
    context_flags: List[str] = []
    head_pose: dict = {}

class SyncRequest(BaseModel):
    session_id: str
    frames: List[FrameData]

class PIEMetrics(BaseModel):
    attentiveness: float
    environment: float
    integrity: float
    confidence: float
    narrative: str
    flags: List[str]
    insights: List[str]

app = FastAPI(title="PIE v2 Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/sync", response_model=PIEMetrics)
async def sync_telemetry(req: SyncRequest):
    # Sprint 2 Placeholder: Just echo back perfect scores
    # This will be replaced by the aggregator logic in Sprint 3
    return PIEMetrics(
        attentiveness=100.0,
        environment=100.0,
        integrity=100.0,
        confidence=100.0,
        narrative="Foundation Sync Operational.",
        flags=[],
        insights=["🛡️ System foundation active"]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
