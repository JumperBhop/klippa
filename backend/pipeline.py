import json
import os
import subprocess
import uuid
from pathlib import Path

from database import update_job, save_clip, get_job

TMP_BASE = Path(os.environ.get("KLIPPA_TMP", Path.home() / "AppData" / "Local" / "Temp" / "klippa"))

SYSTEM_PROMPT = """Du bist ein Social-Media-Experte. Analysiere das Transkript und gib die 3-5 besten Momente für virale Shorts zurück.
Kriterien: starker Hook in den ersten 2 Sekunden, klarer Punkt, emotional, ohne Vorkontext verständlich, 30-90 Sekunden lang.
Antworte NUR als gültiges JSON Array (kein Markdown, kein Text davor/danach):
[{"start": 12.5, "end": 45.2, "score": 92, "reason": "Starker Hook...", "title": "Clip Titel"}]"""


def run_pipeline(job_id: str, openai_api_key: str, style: dict = None):
    try:
        _pipeline(job_id, openai_api_key, style or {})
    except Exception as e:
        update_job(job_id, status="error", error=str(e))


def _pipeline(job_id: str, openai_api_key: str, style: dict):
    job = get_job(job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found")

    job_dir = TMP_BASE / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    input_path = job_dir / "input.mp4"

    # ── STEP 1: Download / locate input ────────────────────────────────────
    update_job(job_id, status="processing", progress=5, step="Download")

    if job.get("youtube_url"):
        _download_via_cobalt(job["youtube_url"], input_path)
    elif job.get("file_path"):
        input_path = Path(job["file_path"])
        if not input_path.exists():
            raise FileNotFoundError(f"Uploaded file not found: {input_path}")
    else:
        raise ValueError("No youtube_url or file_path for job")

    update_job(job_id, progress=15, step="Transkription")

    # ── STEP 2: Transcription ───────────────────────────────────────────────
    transcript = _transcribe(input_path, job_id)
    update_job(job_id, progress=40, step="KI-Analyse")

    # ── STEP 3: GPT-4o Analysis ─────────────────────────────────────────────
    moments = _analyze(transcript, openai_api_key)
    update_job(job_id, progress=55, step="Video schneiden")

    # ── STEP 4: FFmpeg cutting ──────────────────────────────────────────────
    watermark = style.get("watermark", True)
    subtitle_style = style.get("subtitle_style", "tiktok-bold")
    text_color = style.get("text_color", "#ffffff")

    total = len(moments)
    for i, moment in enumerate(moments):
        clip_id = str(uuid.uuid4())
        clip_path = job_dir / f"clip_{i+1}.mp4"
        srt_path = job_dir / f"clip_{i+1}.srt"

        start = float(moment["start"])
        end = float(moment["end"])
        duration = end - start

        _generate_srt(transcript, start, end, srt_path)
        _cut_clip(
            input_path, clip_path, srt_path, start, duration,
            watermark=watermark,
            subtitle_style=subtitle_style,
            text_color=text_color,
        )

        mins = int(duration // 60)
        secs = int(duration % 60)
        dur_str = f"{mins}:{secs:02d}"

        save_clip(
            clip_id=clip_id,
            job_id=job_id,
            file_path=str(clip_path),
            score=int(moment.get("score", 80)),
            reason=moment.get("reason", ""),
            title=moment.get("title", f"Clip {i+1}"),
            duration=dur_str,
            time_start=start,
            time_end=end,
        )

        progress = 55 + int(((i + 1) / total) * 40)
        update_job(job_id, progress=progress, step=f"Clip {i+1}/{total} fertig")

    # ── STEP 5: Done ────────────────────────────────────────────────────────
    update_job(job_id, status="done", progress=100, step="Fertig")


COOKIES_FILE = Path(__file__).parent / "youtube_cookies.txt"
COBALT_API_KEY = os.environ.get("COBALT_API_KEY", "")
COBALT_API_URL = os.environ.get("COBALT_API_URL", "http://172.17.0.1:9000/")


def _download_via_cobalt(url: str, output_path: Path):
    """
    Download from any supported platform.
    Strategy: try self-hosted cobalt first (handles YouTube/TikTok via Node.js n-challenge solver),
    fall back to yt-dlp (works for some platforms from Hetzner).
    """
    try:
        _cobalt_download(url, output_path)
        return
    except Exception:
        pass  # cobalt failed — try yt-dlp

    _ytdlp_download(url, output_path)


def _cobalt_download(url: str, output_path: Path):
    """Download via self-hosted cobalt (Node.js solves YouTube n-challenge natively)."""
    import json as _json
    import urllib.request
    import urllib.error

    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if COBALT_API_KEY:
        headers["Authorization"] = f"Api-Key {COBALT_API_KEY}"

    payload = _json.dumps({"url": url, "videoQuality": "1080", "youtubeVideoCodec": "h264"}).encode()
    req = urllib.request.Request(COBALT_API_URL, data=payload, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = _json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise ValueError(f"cobalt {e.code}: {body[:200]}")
    except urllib.error.URLError as e:
        raise ValueError(f"cobalt unreachable: {e}")

    status = data.get("status", "")
    if status in ("redirect", "stream", "tunnel"):
        cdn_url = data.get("url")
        if cdn_url:
            _stream_download(cdn_url, output_path)
            return
    if status == "picker":
        items = data.get("picker", [])
        video_items = [i for i in items if i.get("type") == "video"] or items
        if video_items:
            _stream_download(video_items[0]["url"], output_path)
            return
    code = data.get("error", {}).get("code", status)
    raise ValueError(f"cobalt: {code}")


def _stream_download(url: str, output_path: Path):
    """Stream-download from a direct CDN URL into output_path."""
    import urllib.request

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        with open(output_path, "wb") as f:
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                f.write(chunk)

    if not output_path.exists() or output_path.stat().st_size < 10_000:
        raise ValueError("Download fehlgeschlagen: leere Datei")


def _ytdlp_download(url: str, output_path: Path):
    """Fallback: download via yt-dlp (works for Instagram/Twitter from Hetzner)."""
    import yt_dlp

    is_youtube = "youtube.com" in url or "youtu.be" in url
    is_tiktok  = "tiktok.com" in url

    if is_youtube or is_tiktok:
        raise ValueError(
            "YouTube/TikTok-Download nicht möglich: Unser Server wird blockiert. "
            "Bitte lade das Video herunter und verwende den Datei-Upload."
        )

    outtmpl = str(output_path.with_suffix("")) + ".%(ext)s"
    ydl_opts = {
        "format": "bestvideo+bestaudio/best",
        "outtmpl": outtmpl,
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
        "postprocessors": [{"key": "FFmpegVideoConvertor", "preferedformat": "mp4"}],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except yt_dlp.utils.DownloadError as e:
        raise ValueError(f"Download fehlgeschlagen: {str(e)[:300]}")

    if not output_path.exists():
        stem = output_path.stem
        for p in sorted(output_path.parent.iterdir()):
            if p.stem == stem and p.suffix in (".mp4", ".webm", ".mkv", ".mov"):
                p.rename(output_path)
                break
        else:
            raise FileNotFoundError("yt-dlp produced no output file")


def _transcribe(video_path: Path, job_id: str) -> dict:
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(str(video_path), word_timestamps=True)

    transcript_path = video_path.parent / "transcript.json"
    with open(transcript_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return result


def _analyze(transcript: dict, openai_api_key: str) -> list:
    from openai import OpenAI
    client = OpenAI(api_key=openai_api_key)

    full_text = ""
    for seg in transcript.get("segments", []):
        full_text += f"[{seg['start']:.1f}s - {seg['end']:.1f}s] {seg['text'].strip()}\n"

    # Limit to 12000 chars to stay within token limits
    if len(full_text) > 12000:
        full_text = full_text[:12000] + "\n...[Transkript gekürzt]"

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Transkript:\n{full_text}"},
        ],
        temperature=0.3,
        max_tokens=1500,
    )

    raw = (response.choices[0].message.content or "").strip()

    # Strip markdown code fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    # Try to extract JSON array via regex as fallback
    if not raw or not raw.startswith("["):
        import re
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        raw = match.group(0) if match else "[]"

    moments = json.loads(raw) if raw else []
    return moments[:5]


def _generate_srt(transcript: dict, clip_start: float, clip_end: float, srt_path: Path):
    words = []
    for seg in transcript.get("segments", []):
        for w in seg.get("words", []):
            ws = w.get("start", 0)
            we = w.get("end", 0)
            if ws >= clip_start and we <= clip_end:
                words.append({"word": w["word"].strip(), "start": ws - clip_start, "end": we - clip_start})

    # Group into chunks of 4 words
    lines = []
    chunk_size = 4
    for i in range(0, len(words), chunk_size):
        chunk = words[i:i + chunk_size]
        if not chunk:
            continue
        text = " ".join(w["word"] for w in chunk)
        start = chunk[0]["start"]
        end = chunk[-1]["end"]
        lines.append((start, end, text))

    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, (start, end, text) in enumerate(lines, 1):
            f.write(f"{idx}\n{_srt_time(start)} --> {_srt_time(end)}\n{text}\n\n")

    if not lines:
        srt_path.write_text("")


def _srt_time(secs: float) -> str:
    h = int(secs // 3600)
    m = int((secs % 3600) // 60)
    s = int(secs % 60)
    ms = int((secs % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _hex_to_ass(hex_color: str) -> str:
    """Convert #RRGGBB to ASS &H00BBGGRR format."""
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"&H00{b:02X}{g:02X}{r:02X}"


def _cut_clip(
    input_path: Path,
    output_path: Path,
    srt_path: Path,
    start: float,
    duration: float,
    watermark: bool = True,
    subtitle_style: str = "tiktok-bold",
    text_color: str = "#ffffff",
):
    vf_parts = [
        "crop=in_h*9/16:in_h:(in_w-in_h*9/16)/2:0",
        "scale=1080:1920",
    ]

    # Always bottom-center, normal size
    # FontSize=14 → ~39px visual on 1080×1920 (ASS default PlayRes 384×288, scale=2.8125)
    font_size = 14
    alignment = 2
    margin_v = 80
    ass_color = _hex_to_ass(text_color)

    style_map = {
        "tiktok-bold":   f"FontName=Arial,FontSize={font_size},PrimaryColour={ass_color},Bold=1,Alignment={alignment},MarginV={margin_v},Outline=2,OutlineColour=&H00000000,Shadow=1",
        "minimal-white": f"FontName=Arial,FontSize={font_size},PrimaryColour={ass_color},Bold=0,Alignment={alignment},MarginV={margin_v},Outline=0,Shadow=0,BorderStyle=0",
        "karaoke":       f"FontName=Arial,FontSize={font_size},PrimaryColour={ass_color},Bold=1,Alignment={alignment},MarginV={margin_v},Outline=2,OutlineColour=&H00000000,Shadow=1",
        "word-pop":      f"FontName=Arial,FontSize={int(font_size*1.15)},PrimaryColour={ass_color},Bold=1,Alignment={alignment},MarginV={margin_v},Outline=2,OutlineColour=&H00ED3A7C,Shadow=1",
    }
    srt_style = style_map.get(subtitle_style, style_map["tiktok-bold"])

    if srt_path.exists() and srt_path.stat().st_size > 0:
        escaped = str(srt_path).replace("\\", "/").replace(":", "\\:")
        vf_parts.append(f"subtitles='{escaped}':force_style='{srt_style}'")

    if watermark:
        vf_parts.append(
            "drawtext=text='klippa.de':fontcolor=white@0.65:fontsize=28"
            ":x=w-tw-24:y=h-th-36:shadowcolor=black@0.5:shadowx=1:shadowy=1"
        )

    vf = ",".join(vf_parts)

    # Check for custom background music uploaded for this job
    music_path = None
    for ext in [".mp3", ".m4a", ".wav", ".ogg", ".aac"]:
        candidate = input_path.parent / f"music{ext}"
        if candidate.exists():
            music_path = candidate
            break

    if music_path:
        af = "[0:a]volume=1.0[oa];[1:a]volume=0.20[ma];[oa][ma]amix=inputs=2:duration=first:dropout_transition=1[outa]"
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-i", str(input_path),
            "-stream_loop", "-1",
            "-i", str(music_path),
            "-t", str(duration),
            "-vf", vf,
            "-filter_complex", af,
            "-map", "0:v",
            "-map", "[outa]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            str(output_path),
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-i", str(input_path),
            "-t", str(duration),
            "-vf", vf,
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            str(output_path),
        ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr[-500:]}")
