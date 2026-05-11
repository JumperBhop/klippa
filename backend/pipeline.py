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


def run_pipeline(job_id: str, openai_api_key: str):
    try:
        _pipeline(job_id, openai_api_key)
    except Exception as e:
        update_job(job_id, status="error", error=str(e))


def _pipeline(job_id: str, openai_api_key: str):
    job = get_job(job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found")

    job_dir = TMP_BASE / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    input_path = job_dir / "input.mp4"

    # ── STEP 1: Download / locate input ────────────────────────────────────
    update_job(job_id, status="processing", progress=5, step="Download")

    if job.get("youtube_url"):
        _yt_download(job["youtube_url"], input_path)
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
    total = len(moments)
    for i, moment in enumerate(moments):
        clip_id = str(uuid.uuid4())
        clip_path = job_dir / f"clip_{i+1}.mp4"
        srt_path = job_dir / f"clip_{i+1}.srt"

        start = float(moment["start"])
        end = float(moment["end"])
        duration = end - start

        _generate_srt(transcript, start, end, srt_path)
        _cut_clip(input_path, clip_path, srt_path, start, duration)

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


def _yt_download(url: str, output_path: Path):
    import yt_dlp
    ydl_opts = {
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": str(output_path),
        "merge_output_format": "mp4",
        "quiet": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])


def _transcribe(video_path: Path, job_id: str) -> dict:
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(str(video_path), word_timestamps=True, language="de")

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

    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    moments = json.loads(raw)
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


def _cut_clip(input_path: Path, output_path: Path, srt_path: Path, start: float, duration: float):
    # Build vf filter chain
    vf_parts = [
        "crop=in_h*9/16:in_h:(in_w-in_h*9/16)/2:0",
        "scale=1080:1920",
    ]

    # Only add subtitles filter if SRT has content
    if srt_path.exists() and srt_path.stat().st_size > 0:
        escaped = str(srt_path).replace("\\", "/").replace(":", "\\:")
        style = "FontName=Arial,FontSize=14,PrimaryColour=&H00ffffff,Bold=1,Alignment=2,MarginV=80,Outline=2,Shadow=1"
        vf_parts.append(f"subtitles='{escaped}':force_style='{style}'")

    vf = ",".join(vf_parts)

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-i", str(input_path),
        "-t", str(duration),
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(output_path),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr[-500:]}")
