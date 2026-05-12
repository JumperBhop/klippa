import os
import uuid
import zipfile
import shutil
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from database import init_db, create_job, update_job, get_job, get_clips, get_clip, get_or_create_user, get_user, get_user_jobs, deduct_credit
from pipeline import run_pipeline, TMP_BASE
from import_service import import_from_url, detect_platform
from providers.base import ProviderError

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
COBALT_API_KEY = os.environ.get("COBALT_API_KEY", "")
COBALT_API_URL = os.environ.get("COBALT_API_URL", "http://172.17.0.1:9000/")
RAPIDAPI_KEY   = os.environ.get("RAPIDAPI_KEY", "")
CLIP_MAX_AGE_HOURS = 24


def cleanup_old_jobs():
    """Delete job folders older than CLIP_MAX_AGE_HOURS to free disk space."""
    if not TMP_BASE.exists():
        return
    cutoff = datetime.now() - timedelta(hours=CLIP_MAX_AGE_HOURS)
    for job_dir in TMP_BASE.iterdir():
        if not job_dir.is_dir():
            continue
        try:
            mtime = datetime.fromtimestamp(job_dir.stat().st_mtime)
            if mtime < cutoff:
                shutil.rmtree(job_dir, ignore_errors=True)
        except Exception:
            pass


async def cleanup_loop():
    """Run cleanup every hour in background."""
    while True:
        await asyncio.sleep(3600)
        cleanup_old_jobs()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    TMP_BASE.mkdir(parents=True, exist_ok=True)
    cleanup_old_jobs()  # clean on startup
    task = asyncio.create_task(cleanup_loop())
    yield
    task.cancel()


app = FastAPI(title="Klippa API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
class StyleSettings(BaseModel):
    subtitle_style: str = "tiktok-bold"
    text_color: str = "#ffffff"
    watermark: bool = True


class ProcessRequest(BaseModel):
    job_id: str | None = None
    youtube_url: str | None = None
    user_id: str | None = None
    style: StyleSettings = StyleSettings()


@app.post("/api/process")
async def process(req: ProcessRequest, background_tasks: BackgroundTasks):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set")

    # Credit check
    if req.user_id:
        user = get_or_create_user(req.user_id)
        if user["credits"] <= 0:
            raise HTTPException(status_code=402, detail="Keine Credits mehr. Bitte upgraden.")
        watermark = user["plan"] == "gratis"
    else:
        watermark = True

    if req.youtube_url and not req.job_id:
        job_id = str(uuid.uuid4())
        job_dir = TMP_BASE / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        create_job(job_id, youtube_url=req.youtube_url, user_id=req.user_id)
    elif req.job_id:
        job_id = req.job_id
        if not get_job(job_id):
            raise HTTPException(status_code=404, detail="Job not found")
    else:
        raise HTTPException(status_code=400, detail="Provide job_id or youtube_url")

    if req.user_id:
        deduct_credit(req.user_id)

    style = req.style.model_dump()
    style["watermark"] = watermark
    background_tasks.add_task(run_pipeline, job_id, OPENAI_API_KEY, style)
    return {"job_id": job_id, "status": "processing"}


# ── POST /api/upload-audio/{job_id} ────────────────────────────────────────
@app.post("/api/upload-audio/{job_id}")
async def upload_audio(job_id: str, file: UploadFile = File(...)):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job_dir = TMP_BASE / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "audio.mp3").suffix or ".mp3"
    save_path = job_dir / f"music{ext}"
    content = await file.read()
    save_path.write_bytes(content)
    return {"ok": True}


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


# ── GET /api/user/{user_id} ─────────────────────────────────────────────────
@app.get("/api/user/{user_id}")
async def get_user_info(user_id: str):
    user = get_or_create_user(user_id)
    return {"user_id": user_id, "plan": user["plan"], "credits": user["credits"]}


# ── GET /api/user/{user_id}/jobs ─────────────────────────────────────────────
@app.get("/api/user/{user_id}/jobs")
async def get_jobs_for_user(user_id: str):
    jobs = get_user_jobs(user_id)
    return jobs


# ── POST /api/admin/cookies ──────────────────────────────────────────────────
ADMIN_KEY = os.environ.get("ADMIN_KEY", "klippa-admin-2026")
COBALT_COOKIES_FILE = Path(__file__).parent / "cobalt_cookies.json"


def _netscape_to_cobalt(netscape_text: str) -> dict:
    """
    Convert Netscape cookie file format to cobalt's cookies.json format.
    cobalt format: {"youtube": ["NAME1=VAL1; NAME2=VAL2; ..."], "tiktok": [...]}
    """
    domain_map: dict[str, list[str]] = {}
    for line in netscape_text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 7:
            continue
        domain, _, _path, _secure, _expiry, name, value = parts[:7]
        # Normalise domain → service key
        domain = domain.lstrip(".")
        if "youtube.com" in domain or "google.com" in domain or "googlevideo.com" in domain:
            key = "youtube"
        elif "tiktok.com" in domain:
            key = "tiktok"
        elif "instagram.com" in domain:
            key = "instagram"
        elif "twitter.com" in domain or "x.com" in domain or "twimg.com" in domain:
            key = "twitter"
        else:
            continue
        domain_map.setdefault(key, []).append(f"{name}={value}")

    return {svc: ["; ".join(pairs)] for svc, pairs in domain_map.items()}


@app.post("/api/admin/cookies")
async def upload_cookies(file: UploadFile = File(...), key: str = ""):
    if key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")
    from pipeline import COOKIES_FILE
    content = await file.read()
    COOKIES_FILE.write_bytes(content)

    # Also convert to cobalt JSON format and save
    try:
        cobalt_json = _netscape_to_cobalt(content.decode("utf-8", errors="ignore"))
        import json as _json
        COBALT_COOKIES_FILE.write_text(_json.dumps(cobalt_json, indent=2, ensure_ascii=False), encoding="utf-8")
        services = list(cobalt_json.keys())
    except Exception as e:
        services = []

    return {"ok": True, "size": len(content), "cobalt_services": services}


@app.get("/api/admin/cobalt-cookies")
async def get_cobalt_cookies(key: str = ""):
    """Return the current cobalt_cookies.json content for download/inspection."""
    if key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not COBALT_COOKIES_FILE.exists():
        raise HTTPException(status_code=404, detail="No cobalt cookies file. Upload youtube_cookies.txt first via /api/admin/cookies")
    import json as _json
    data = _json.loads(COBALT_COOKIES_FILE.read_text(encoding="utf-8"))
    return data


# ── Cobalt helper ────────────────────────────────────────────────────────────
from fastapi import Request as _Request
import urllib.request as _urllib_req
import urllib.error as _urllib_err
import json as _json_mod

async def _cobalt_fetch(url: str) -> dict:
    """Call self-hosted cobalt API and return parsed JSON. Raises ValueError on failure."""
    payload = _json_mod.dumps({"url": url, "videoQuality": "1080", "youtubeVideoCodec": "h264"}).encode()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if COBALT_API_KEY:
        headers["Authorization"] = f"Api-Key {COBALT_API_KEY}"

    req = _urllib_req.Request(COBALT_API_URL, data=payload, headers=headers, method="POST")
    try:
        loop = asyncio.get_event_loop()
        def _call():
            with _urllib_req.urlopen(req, timeout=30) as r:
                return _json_mod.loads(r.read())
        return await loop.run_in_executor(None, _call)
    except _urllib_err.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise ValueError(f"cobalt error {e.code}: {body[:200]}")
    except _urllib_err.URLError as e:
        raise ValueError(f"cobalt unreachable: {e}")


def _cobalt_pick_url(data: dict) -> str:
    """Extract the best direct download URL from a cobalt response."""
    status = data.get("status", "")
    if status in ("redirect", "stream", "tunnel"):
        u = data.get("url")
        if u:
            return u
    if status == "picker":
        items = data.get("picker", [])
        video_items = [i for i in items if i.get("type") == "video"] or items
        if video_items:
            return video_items[0]["url"]
    code = data.get("error", {}).get("code", status)
    raise ValueError(f"cobalt: {code}")


# ── POST /api/dl/info ────────────────────────────────────────────────────────
@app.post("/api/dl/info")
async def dl_info(request: _Request):
    """Return video title/thumbnail/platform via cobalt (no download)."""
    body = await request.json()
    url = body.get("url", "")
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Ungültige URL")

    # Detect platform from URL for instant response even without cobalt
    def _detect(u: str) -> str:
        if "youtube.com" in u or "youtu.be" in u:   return "youtube"
        if "tiktok.com" in u or "vm.tiktok.com" in u: return "tiktok"
        if "instagram.com" in u:                       return "instagram"
        if "twitter.com" in u or "x.com" in u:        return "twitter"
        return "other"

    platform = _detect(url)

    # YouTube: yt-dlp ist von Hetzner-IPs geblockt → sofort Fallback zurückgeben
    if platform == "youtube":
        return {
            "title": None, "thumbnail": None, "duration": None,
            "uploader": None, "platform": platform, "cobalt_ready": True,
        }

    # Andere Plattformen: yt-dlp mit Timeout versuchen
    import yt_dlp
    loop = asyncio.get_event_loop()

    def _extract():
        opts = {
            "quiet": True, "no_warnings": True, "skip_download": True,
            "socket_timeout": 10,   # 10s Netzwerk-Timeout
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=False)

    try:
        info = await asyncio.wait_for(
            loop.run_in_executor(None, _extract),
            timeout=15.0,  # max 15s gesamt
        )
        return {
            "title":     info.get("title", "Video"),
            "thumbnail": info.get("thumbnail"),
            "duration":  info.get("duration"),
            "uploader":  info.get("uploader") or info.get("channel"),
            "platform":  platform,
            "cobalt_ready": True,
        }
    except Exception:
        return {
            "title": None, "thumbnail": None, "duration": None,
            "uploader": None, "platform": platform, "cobalt_ready": True,
        }


# ── YouTube InnerTube fallback (ANDROID client, no signature needed) ─────────
def _is_youtube(url: str) -> bool:
    return "youtube.com" in url or "youtu.be" in url

def _youtube_innertube_url(video_url: str) -> str:
    """
    Get a direct mp4 URL via YouTube InnerTube API.
    Tries multiple clients until one works.
    """
    import re as _re, json as _j, urllib.request as _ur, http.cookiejar as _cj

    vid = _re.search(r'(?:v=|youtu\.be/|shorts/|embed/)([a-zA-Z0-9_-]{11})', video_url)
    if not vid:
        raise ValueError("Ungültige YouTube-URL: keine Video-ID gefunden")
    video_id = vid.group(1)

    # Load cookies if available (for authenticated access)
    cookie_header = ""
    try:
        from pipeline import COOKIES_FILE
        if COOKIES_FILE.exists():
            jar = _cj.MozillaCookieJar(str(COOKIES_FILE))
            jar.load(ignore_discard=True, ignore_expires=True)
            cookie_header = "; ".join(
                f"{c.name}={c.value}" for c in jar
                if "youtube.com" in (c.domain or "") or "google.com" in (c.domain or "")
            )
    except Exception:
        pass

    # Clients to try in order
    clients = [
        {
            "name": "ANDROID",
            "version": "19.09.37",
            "key": "3",
            "ua": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
            "sdk": 30,
        },
        {
            "name": "ANDROID_TESTSUITE",
            "version": "1.9",
            "key": "30",
            "ua": "com.google.android.youtube/1.9 (Linux; U; Android 11) gzip",
            "sdk": 30,
        },
        {
            "name": "IOS",
            "version": "19.09.3",
            "key": "5",
            "ua": "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)",
            "sdk": None,
        },
    ]

    last_error = "Keine Video-URL gefunden"
    for client in clients:
        try:
            ctx = {
                "client": {
                    "clientName": client["name"],
                    "clientVersion": client["version"],
                    "hl": "en",
                    "gl": "US",
                    "utcOffsetMinutes": 0,
                }
            }
            if client.get("sdk"):
                ctx["client"]["androidSdkVersion"] = client["sdk"]

            payload = _j.dumps({"videoId": video_id, "context": ctx}).encode()

            headers = {
                "Content-Type": "application/json",
                "User-Agent": client["ua"],
                "X-YouTube-Client-Name": client["key"],
                "X-YouTube-Client-Version": client["version"],
            }
            if cookie_header:
                headers["Cookie"] = cookie_header

            req = _ur.Request(
                "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
                data=payload, headers=headers, method="POST"
            )
            with _ur.urlopen(req, timeout=15) as r:
                data = _j.loads(r.read())

            ps_status = data.get("playabilityStatus", {}).get("status", "UNKNOWN")
            if ps_status != "OK":
                reason = data.get("playabilityStatus", {}).get("reason", ps_status)
                last_error = f"YouTube: {reason}"
                continue

            formats = data.get("streamingData", {}).get("formats", [])
            # Combined mp4 formats (video+audio), best quality first
            mp4 = sorted(
                [f for f in formats if f.get("url") and "mp4" in f.get("mimeType", "")],
                key=lambda f: f.get("height", 0), reverse=True
            )
            if mp4:
                return mp4[0]["url"]

            # Any combined format
            any_fmt = [f for f in formats if f.get("url")]
            if any_fmt:
                return any_fmt[0]["url"]

            last_error = f"Client {client['name']}: keine direkte URL"

        except Exception as ex:
            last_error = str(ex)
            continue

    raise ValueError(last_error)


# ── POST /api/dl/url ──────────────────────────────────────────────────────────
@app.post("/api/dl/url")
async def dl_url(request: _Request):
    """
    Get a direct CDN download URL.
    For YouTube: tries cobalt first, falls back to InnerTube ANDROID API.
    For other platforms: cobalt only.
    """
    body = await request.json()
    url = body.get("url", "")
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Ungültige URL")

    # ── YouTube: cobalt tunnel → Content-Disposition:attachment → echter Download ──
    if _is_youtube(url):
        # Cobalt-Tunnel zuerst: URL läuft über unseren Server, hat Content-Disposition:attachment
        # und CORS-Header → Browser lädt direkt herunter, kein neuer Tab
        try:
            data = await _cobalt_fetch(url)
            tunnel_url = _cobalt_pick_url(data)
            # Extract title from cobalt filename if possible
            filename = data.get("filename", "")
            return {"url": tunnel_url, "source": "cobalt", "filename": filename}
        except Exception:
            pass  # Cobalt failed → RapidAPI fallback

        # Fallback: RapidAPI (rohe CDN-URL, kein Content-Disposition)
        if RAPIDAPI_KEY:
            try:
                import re as _re
                vid = _re.search(r'(?:v=|youtu\.be/|shorts/|embed/)([a-zA-Z0-9_-]{11})', url)
                if vid:
                    video_id = vid.group(1)
                    loop = asyncio.get_event_loop()
                    def _rapid_fetch():
                        import urllib.request as _ur, json as _j
                        host = os.environ.get("RAPIDAPI_YT_HOST", "youtube-media-downloader.p.rapidapi.com")
                        _headers = {
                            "X-RapidAPI-Key": RAPIDAPI_KEY,
                            "X-RapidAPI-Host": host,
                            "User-Agent": "Mozilla/5.0",
                            "Accept": "application/json",
                        }
                        _req = _ur.Request(f"https://{host}/v2/video/details?videoId={video_id}", headers=_headers)
                        with _ur.urlopen(_req, timeout=15) as _r:
                            return _j.loads(_r.read())
                    data = await loop.run_in_executor(None, _rapid_fetch)
                    items = data.get("videos", {}).get("items", [])
                    with_audio = [i for i in items if i.get("hasAudio") and i.get("url")]
                    all_items  = [i for i in items if i.get("url")]
                    preferred  = with_audio or all_items
                    PREF = ["1080p","720p","480p","360p","240p","144p"]
                    preferred.sort(key=lambda i: next((j for j,q in enumerate(PREF) if q in str(i.get("quality",""))), 999))
                    if preferred:
                        return {"url": preferred[0]["url"], "source": "rapidapi",
                                "title": data.get("title"), "thumbnail": (data.get("thumbnails") or [{}])[-1].get("url")}
            except Exception:
                pass

        raise HTTPException(status_code=400, detail="YouTube-Download nicht verfügbar.")

    # ── Other platforms: cobalt only ─────────────────────────────────────────
    try:
        data = await _cobalt_fetch(url)
        direct_url = _cobalt_pick_url(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"url": direct_url}


# ── POST /api/import ─────────────────────────────────────────────────────────
class ImportRequest(BaseModel):
    url: str
    user_id: str | None = None


def _run_import_job(job_id: str, url: str):
    """Läuft im Background-Thread: importiert Video und aktualisiert Job-Status."""
    import asyncio as _asyncio

    async def _do():
        platform = detect_platform(url)
        update_job(job_id, status="processing", progress=10,
                   step=f"{platform.capitalize()}-Video wird importiert…")
        try:
            if platform == "youtube" and RAPIDAPI_KEY:
                # YouTube: CDN-URL via RapidAPI holen, NICHT auf Server herunterladen
                # (YouTube-CDN blockiert Hetzner-IPs — Browser lädt direkt)
                import re as _re, urllib.request as _ur, json as _j
                vid = _re.search(r'(?:v=|youtu\.be/|shorts/|embed/)([a-zA-Z0-9_-]{11})', url)
                if not vid:
                    raise ProviderError("Ungültige YouTube-URL")
                video_id = vid.group(1)
                host = os.environ.get("RAPIDAPI_YT_HOST", "youtube-media-downloader.p.rapidapi.com")
                hdrs = {
                    "X-RapidAPI-Key": RAPIDAPI_KEY,
                    "X-RapidAPI-Host": host,
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "application/json",
                }
                req = _ur.Request(f"https://{host}/v2/video/details?videoId={video_id}", headers=hdrs)
                with _ur.urlopen(req, timeout=15) as r:
                    data = _j.loads(r.read())

                title     = data.get("title") or f"YouTube {video_id}"
                thumbs    = data.get("thumbnails") or []
                thumbnail = thumbs[-1].get("url") if thumbs else None
                dur_obj   = data.get("duration") or {}
                duration  = int(dur_obj.get("secondsText") or dur_obj.get("seconds") or 0) if isinstance(dur_obj, dict) else int(dur_obj or 0)

                items     = data.get("videos", {}).get("items", [])
                PREF      = ["1080p","720p","480p","360p","240p","144p"]
                with_audio = [i for i in items if i.get("hasAudio") and i.get("url")]
                all_items  = [i for i in items if i.get("url")]
                preferred  = with_audio or all_items
                preferred.sort(key=lambda i: next((j for j,q in enumerate(PREF) if q in str(i.get("quality",""))), 999))
                cdn_url = preferred[0]["url"] if preferred else None
                if not cdn_url:
                    raise ProviderError("Keine Download-URL verfügbar")

                meta_step = f"done|{title.replace('|','_')}|{duration}|{(thumbnail or '').replace('|','_')}|youtube"
                update_job(job_id, status="done", progress=100,
                           step=meta_step, file_path=cdn_url, error=None)
                return

            # Andere Plattformen: yt-dlp (TikTok, Instagram, Twitter)
            job_dir = TMP_BASE / job_id
            result = await import_from_url(url, job_dir)
            meta_step = (
                f"done"
                f"|{result.title.replace('|','_')}"
                f"|{result.duration}"
                f"|{(result.thumbnail or '').replace('|','_')}"
                f"|{result.platform}"
            )
            update_job(job_id, status="done", progress=100,
                       step=meta_step, file_path=result.file_path, error=None)

        except ProviderError as e:
            update_job(job_id, status="error", error=str(e))
        except Exception as e:
            update_job(job_id, status="error", error=f"Unbekannter Fehler: {str(e)[:200]}")

    _asyncio.run(_do())


@app.post("/api/import")
async def import_video(req: ImportRequest, background_tasks: BackgroundTasks):
    """
    Startet einen Video-Import-Job.
    YouTube → RapidAPI | TikTok/Instagram → yt-dlp
    """
    url = req.url.strip()
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Ungültige URL")

    platform = detect_platform(url)

    # Für YouTube: prüfen ob API-Key vorhanden
    if platform == "youtube" and not RAPIDAPI_KEY:
        raise HTTPException(
            status_code=503,
            detail="YouTube-Import nicht verfügbar: RAPIDAPI_KEY fehlt."
        )

    job_id = str(uuid.uuid4())
    job_dir = TMP_BASE / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    # Job in DB anlegen
    create_job(job_id, youtube_url=url, user_id=req.user_id)
    update_job(job_id, status="processing", progress=5,
               step=f"{platform.capitalize()}-Video wird importiert…")

    background_tasks.add_task(_run_import_job, job_id, url)
    return {"job_id": job_id, "status": "processing", "platform": platform}


@app.get("/api/import/{job_id}")
async def get_import_status(job_id: str):
    """Status eines Import-Jobs + Ergebnis wenn fertig."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Import-Job nicht gefunden")

    response = {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "step": job["step"],
        "error": job.get("error"),
        "platform": detect_platform(job.get("youtube_url") or ""),
    }

    # Wenn fertig: Metadaten aus dem step-Feld extrahieren
    if job["status"] == "done" and job.get("step", "").startswith("done|"):
        parts = job["step"].split("|", 4)
        # done | title | duration | thumbnail | platform
        if len(parts) >= 5:
            response["result"] = {
                "title":     parts[1],
                "duration":  int(parts[2]) if parts[2].isdigit() else 0,
                "thumbnail": parts[3] or None,
                "platform":  parts[4],
                "file_path": job.get("file_path", ""),
            }

    return response


# ── GET /health ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    from pipeline import COOKIES_FILE
    return {
        "status": "ok",
        "openai_key_set": bool(OPENAI_API_KEY),
        "cookies": COOKIES_FILE.exists(),
        "cobalt_cookies": COBALT_COOKIES_FILE.exists(),
    }
