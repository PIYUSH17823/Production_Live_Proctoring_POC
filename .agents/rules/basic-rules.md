---
trigger: always_on
---

MANDATORY RULE — ACTIVE THROUGHOUT THE ENTIRE SESSION:

You are maintaining a living technical documentation file called
`PIE_CONTEXT.md`

located at the root of the repository.

Every single time you create, modify, rename, refactor, or delete ANY file,
you MUST immediately update PIE_CONTEXT.md BEFORE touching the next file.

NO EXCEPTIONS.

This file acts as:
- Technical memory
- AI architecture registry
- Research notebook
- Behavioral intelligence audit trail
- Sprint tracker
- Explainable AI documentation
- Production-readiness tracker
- Fairness & ethics evidence record

=======================================================
PIE_CONTEXT.md STRUCTURE
(INITIALIZE BEFORE WRITING ANY CODE)
=======================================================

# PIE v2 — Proctoring Intelligence Engine

## Project Overview
- Name: PIE v2
- Organization: Hyrai
- Type: Real-Time AI Behavioral Intelligence Platform
- Frontend: React + Vite + TensorFlow.js
- Backend: FastAPI (Python)
- AI Stack:
  - MediaPipe FaceMesh
  - TensorFlow.js
  - COCO-SSD
  - DeepFace
  - Web Audio API
- Database: MongoDB
- Real-Time Layer: WebSocket + REST Sync
- Telemetry Frequency: 10 Hz
- Current Phase: [Sprint Name]
- Started: [current date]

---

## Vision Statement

PIE is designed to move from:
"Detection"
to
"Behavioral Understanding."

The system should:
- Reduce false positives
- Differentiate anxiety from dishonesty
- Generate explainable evidence chains
- Build recruiter trust
- Preserve candidate fairness
- Produce legally defensible reports

---

## Architecture Layers

| Layer | Name | Responsibility | Status |
|------|------|----------------|--------|
| L00 | Setup Layer | Calibration + Identity | Planned |
| L01 | Intelligence Capture | Vision + Audio telemetry | Planned |
| L02 | Signal Calibration | Confidence computation | Planned |
| L03 | Personal Baseline | Candidate normalization | Planned |
| L04 | Event Factory | Behavioral event generation | Planned |
| L05 | Threshold Guard | False-positive filtering | Planned |
| L06 | Recovery Modeling | Anxiety recovery logic | Planned |
| L07 | Pattern Memory | Temporal pattern detection | Planned |
| L08 | Multi-Modal Correlation | Cross-signal intelligence | Planned |
| L09 | Scoring Engine | A / E / I computation | Planned |
| L10 | Answer Correlation | Behavior-answer linkage | Planned |
| L11 | Behavioral Dashboard | Recruiter interface | Planned |
| L12 | Narrative Engine | Explainable summaries | Planned |

---

## Sprint Registry

| Sprint | Goal | Layers | Status |
|--------|------|--------|--------|
| Sprint 1 | Browser capture + FaceMesh | L01 | Completed |
| Sprint 2 | Sync pipeline + confidence | L01 + L02 | Completed |
| Sprint 3 | Gaze calibration system | L00 | In Progress |
| Sprint 4 | ID verification system | L00 + L09 | Planned |
| Sprint 5 | Baseline + Event Factory | L03 + L04 | Planned |
| Sprint 6 | Multi-modal scoring | L05 + L08 + L09 | Planned |
| Sprint 7 | Pattern intelligence | L06 + L07 + L10 | Planned |
| Sprint 8 | Narrative + dashboard | L11 + L12 | Planned |

---

## Repository Structure

| Path | Purpose |
|------|---------|
| frontend/src/components | UI + overlays |
| frontend/src/hooks | Telemetry hooks |
| frontend/src/services | Sync + inference services |
| backend/api | FastAPI routes |
| backend/services | AI scoring services |
| backend/models | Session + telemetry models |
| backend/storage | DB layer |
| backend/patterns | Temporal intelligence |
| backend/narrative | Explainable AI |
| shared/types | Shared telemetry contracts |
| docs | Research + architecture docs |
| tests | Unit/integration tests |

---

## File Registry
(UPDATED ON EVERY FILE CHANGE)

| # | File Path | Layer | Type | Status | Description |
|---|-----------|------|------|--------|-------------|
| 1 | frontend/src/hooks/useInference.ts | L01 | Hook | ✅ Created | MediaPipe + TFJS telemetry |
| 2 | backend/services/aggregator.py | L02-L09 | Service | ✏️ Modified | Window aggregation & scoring |
| 3 | frontend/src/components/CalibrationOverlay.tsx | L00 | UI | ✅ Created | Moving-ball gaze calibration |
...

---

## AI Pipeline Registry

| Stage | Input | Processing | Output | Status |
|------|------|------------|--------|--------|
| Webcam Stream | Raw camera | MediaPipe FaceMesh | 468 landmarks | Operational |
| Audio Stream | Microphone | RMS + VAD | Speech probability | Operational |
| Object Detection | Video frame | COCO-SSD | Device/person events | Operational |
| Calibration Engine | Gaze samples | Offset normalization | Personalized gaze map | In Progress |
| Baseline Engine | First 60s telemetry | Rolling μ/σ | Candidate baseline | Planned |
| Pattern Memory | Window history | Temporal analysis | Pattern flags | Planned |
| Correlation Engine | Behavior + answers | Evidence linkage | Suspicion reasoning | Planned |

---

## Telemetry Schema Registry

| Field | Type | Description | Source |
|------|------|-------------|--------|
| gaze_zone | string | CENTER/LEFT/RIGHT | FaceMesh |
| yaw | number | Horizontal head rotation | FaceMesh |
| pitch | number | Vertical rotation | FaceMesh |
| face_visible | boolean | Face visibility state | FaceMesh |
| audio_level | number | RMS amplitude | Web Audio API |
| vad_speech | boolean | Voice activity | Audio VAD |
| objects | array | Detected objects | COCO-SSD |
| confidence | number | Signal quality score | L02 |
| attentiveness | number | A Index | L09 |
| environment | number | E Index | L09 |
| integrity | number | I Index | L09 |

---

## Event Registry

| Event | Trigger | Severity | Layer | Status |
|------|---------|----------|--------|--------|
| GAZE_AWAY | gaze deviation > threshold | Moderate | L04 | Active |
| PHONE_DETECTED | COCO-SSD detects phone | Critical | L04 | Active |
| SECOND_PERSON | Additional face detected | Critical | L04 | Active |
| VOICE_DETECTED | VAD speech spike | Moderate | L04 | Active |
| FACE_ABSENT | Face invisible | Moderate | L04 | Active |
| IDENTITY_DRIFT | Embedding mismatch | Critical | L09 | Planned |

---

## Formula Registry

| Formula | Purpose | Layer | Status |
|---------|---------|--------|--------|
| Confidence Formula | Signal reliability | L02 | Active |
| Z-Score Formula | Personal baseline deviation | L03 | Planned |
| Recovery Bonus Formula | Anxiety recovery | L06 | Planned |
| Attentiveness Index | Focus scoring | L09 | Planned |
| Environment Index | Environment integrity | L09 | Planned |
| Integrity Index | Final composite score | L09 | Planned |

---

## Endpoint Registry

| Method | Endpoint | Purpose | Layer | Status |
|--------|----------|---------|--------|--------|
| POST | /api/sync | Telemetry sync | L02 | Active |
| POST | /api/calibrate | Save calibration map | L00 | Planned |
| POST | /api/verify-id | Identity verification | L09 | Planned |
| POST | /api/correlate-answer | Behavior-answer correlation | L10 | Planned |
| GET | /api/session/{id} | Session details | Dashboard | Planned |

---

## Fairness & Ethics Registry

| Concern | Mitigation Strategy | Layer | Status |
|---------|--------------------|--------|--------|
| Natural fidgeting | Personal baseline normalization | L03 | Planned |
| Anxiety spikes | Recovery modeling | L06 | Planned |
| Poor lighting | Confidence adjustment | L02 | Active |
| False gaze drift | Calibration mapping | L00 | Planned |
| One-off anomalies | Threshold guard | L05 | Planned |
| AI hallucination | Deterministic narrative templates | L12 | Planned |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| FaceMesh FPS | ≥ 15 FPS |
| Telemetry Frequency | 10 Hz |
| Sync Latency | < 1s |
| Frame Loss | < 5% |
| Detection Confidence | ≥ 0.65 |
| Dashboard Update Rate | 5s |
| Max Buffer Duration | 5s |

---

## Dependencies Registry

| Dependency | Version | Purpose |
|------------|---------|---------|
| @mediapipe/face_mesh | latest | Landmark tracking |
| @tensorflow/tfjs | latest | Browser ML |
| coco-ssd | latest | Object detection |
| deepface | latest | Identity embeddings |
| fastapi | latest | Backend API |
| websockets | latest | Real-time transport |

---

## Environment Variables

| Key | Description |
|----|-------------|
| MONGO_URI | MongoDB connection |
| JWT_SECRET | Auth secret |
| MODEL_PATH | AI model directory |
| VITE_API_URL | Frontend backend URL |
| SESSION_BUFFER_LIMIT | Max telemetry buffer |
| FACE_CONFIDENCE_THRESHOLD | Face detection confidence |
| PHONE_DETECTION_THRESHOLD | Phone detection confidence |

---

## Research Notes
(UPDATED DURING IMPLEMENTATION)

| Step | Research Finding | Impact |
|-----|------------------|--------|
| R-1 | Static gaze calibration caused corner drift | Added moving-ball interpolation |
| R-2 | Single-frame gaze spikes caused false positives | Added duration threshold guard |
| R-3 | Anxious candidates failed static thresholds | Introduced personal baseline |
| R-4 | Vision-only signals insufficient | Added multi-modal correlation |

---

## Change Log
(UPDATED AFTER EVERY FILE OPERATION)

| Step | Action | File | Layer | Details |
|------|--------|------|--------|---------|
| Step-1 | CREATE | useInference.ts | L01 | Added MediaPipe telemetry hook |
| Step-2 | MODIFY | aggregator.py | L02 | Added confidence score formula |
| Step-3 | CREATE | CalibrationOverlay.tsx | L00 | Added moving-ball calibration |
...

---

## Known Issues / TODOs

| # | Issue | Layer | Priority |
|---|-------|------|----------|
| 1 | Low-light gaze instability | L01 | High |
| 2 | Mobile Safari camera inconsistency | L01 | Medium |
| 3 | DeepFace cold-start latency | L09 | Medium |
| 4 | Temporal memory optimization needed | L07 | Medium |

---

## Operational Rules

RULE 1 — CREATE FILE
Whenever ANY file is created:
- Add it to File Registry
- Add a Change Log entry
- Register layer ownership
- Register endpoints/events/formulas if applicable

RULE 2 — MODIFY FILE
Whenever ANY file changes:
- Update File Registry status to ✏️ Modified
- Add Change Log entry
- Update affected registries

RULE 3 — DELETE FILE
Whenever ANY file is deleted:
- Mark ❌ Deleted
- Add deletion reason in Change Log

RULE 4 — AI ENGINE RULE
Whenever scoring logic changes:
- Update Formula Registry
- Update Fairness Registry
- Document reasoning impact
- Explain false-positive implications

RULE 5 — EVENT RULE
Whenever a new event type is added:
- Register it in Event Registry
- Add severity classification
- Add threshold requirements
- Add recruiter-visible explanation

RULE 6 — PIPELINE RULE
Whenever a telemetry field changes:
- Update Telemetry Schema Registry
- Update AI Pipeline Registry
- Update affected formulas

RULE 7 — FAIRNESS RULE
Every behavioral penalty MUST include:
- Confidence gating
- Duration threshold
- Recovery path
- Human-review traceability

RULE 8 — EXPLAINABILITY RULE
Every AI-generated recruiter insight MUST:
- Be traceable to raw telemetry
- Reference supporting events
- Avoid probabilistic accusations
- Remain deterministic and auditable

RULE 9 — SPRINT RULE
At sprint completion:
- Update Sprint Registry
- Add deliverables summary
- Add architecture notes
- Add known regressions/issues

RULE 10 — NEVER SKIP PIE_CONTEXT.md
Even if:
- fixing imports
- renaming variables
- adjusting thresholds
- changing CSS
- updating constants
- modifying formulas

PIE_CONTEXT.md MUST be updated FIRST.

---

## Final Summary
(To be added after implementation completes)

- Total Files Created: X
- Total Layers Operational: X
- Total AI Events: X
- Total Endpoints: X
- Total Formulas: X
- Total Recruiter Reports Generated: X
- Frontend Run Command: npm run dev
- Backend Run Command: uvicorn main:app --reload
- Dashboard URL: http://localhost:5173
- Backend URL: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Production Readiness: [percentage]
