import os
import uuid
import zipfile
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from database import init_db, create_job, update_job, get_job, get_clips, get_clip
from pipeline import run_pipeline, TMP_BASE

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    TMP_BASE.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="Klippa API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── POST /api/upload ────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    job_dir = TMP_BASE / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "video.mp4").suffix or ".mp4"
    save_path = job_dir / f"input{ext}"

    content = await file.read()
    save_path.write_bytes(content)

    create_job(job_id, file_path=str(save_path))
    return {"job_id": job_id}


# ── POST /api/process ───────────────────────────────────────────────────────
class ProcessRequest(BaseModel):
    job_id: str | None = None
    youtube_url: str | None = None


@app.post("/api/process")
async def process(req: ProcessRequest, background_tasks: BackgroundTasks):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set")

    if req.youtube_url and not req.job_id:
        job_id = str(uuid.uuid4())
        job_dir = TMP_BASE / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        create_job(job_id, youtube_url=req.youtube_url)
    elif req.job_id:
        job_id = req.job_id
        if not get_job(job_id):
            raise HTTPException(status_code=404, detail="Job not found")
    else:
        raise HTTPException(status_code=400, detail="Provide job_id or youtube_url")

    background_tasks.add_task(run_pipeline, job_id, OPENAI_API_KEY)
    return {"job_id": job_id, "status": "processing"}


# ── GET /api/status/{job_id} ────────────────────────────────────────────────
@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "step": job["step"],
        "error": job.get("error"),
    }


# ── GET /api/clips/{job_id} ─────────────────────────────────────────────────
@app.get("/api/clips/{job_id}")
async def list_clips(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    clips = get_clips(job_id)
    return [
        {
            "id": c["id"],
            "title": c["title"],
            "score": c["score"],
            "reason": c["reason"],
            "duration": c["duration"],
            "time_start": c["time_start"],
            "time_end": c["time_end"],
            "download_url": f"/api/download/{c['id']}",
        }
        for c in clips
    ]


# ── GET /api/download/{clip_id} ─────────────────────────────────────────────
@app.get("/api/download/{clip_id}")
async def download_clip(clip_id: str):
    clip = get_clip(clip_id)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    path = Path(clip["file_path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="Clip file not found")
    filename = f"klippa_{clip['title'][:40].replace(' ', '_')}.mp4"
    return FileResponse(path, media_type="video/mp4", filename=filename)


# ── GET /api/download/{job_id}/zip ──────────────────────────────────────────
@app.get("/api/download/{job_id}/zip")
async def download_zip(job_id: str):
    clips = get_clips(job_id)
    if not clips:
        raise HTTPException(status_code=404, detail="No clips found")

    import io
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, clip in enumerate(clips, 1):
            p = Path(clip["file_path"])
            if p.exists():
                zf.write(p, f"klippa_clip_{i}_{clip['title'][:30]}.mp4")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="klippa_{job_id[:8]}.zip"'},
    )


# ── GET /health ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "openai_key_set": bool(OPENAI_API_KEY)}
