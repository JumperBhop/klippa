"""
YouTubeRapidAPIProvider — lädt YouTube-Videos über RapidAPI herunter.

Unterstützte APIs (über ENV konfigurierbar):
  RAPIDAPI_KEY      — dein RapidAPI-Key (Pflicht)
  RAPIDAPI_YT_HOST  — RapidAPI Host (Standard: youtube-media-downloader.p.rapidapi.com)

Unterstützte Response-Formate:
  Format A (youtube-media-downloader): { "status": true, "videos": { "items": [...] } }
  Format B (generic):                  { "videos": [...] }
  Format C (direct):                   { "url": "..." } / { "downloadUrl": "..." }
"""

import os
import json
import re
import urllib.request
import urllib.error
import urllib.parse
import asyncio
from pathlib import Path
from typing import Optional

from .base import BaseProvider, ImportResult, ProviderError

# ── Konfiguration via ENV ────────────────────────────────────────────────────
RAPIDAPI_KEY     = os.environ.get("RAPIDAPI_KEY", "")
RAPIDAPI_YT_HOST = os.environ.get(
    "RAPIDAPI_YT_HOST",
    "youtube-media-downloader.p.rapidapi.com",
)
# Zielqualitäten in Prioritäts-Reihenfolge
PREFERRED_QUALITIES = ["1080p", "720p", "480p", "360p", "240p", "144p"]


def _extract_video_id(url: str) -> Optional[str]:
    patterns = [r"(?:v=|youtu\.be/|shorts/|embed/)([a-zA-Z0-9_-]{11})"]
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            return m.group(1)
    return None


class YouTubeRapidAPIProvider(BaseProvider):
    """Lädt YouTube-Videos über eine RapidAPI herunter."""

    def __init__(self):
        if not RAPIDAPI_KEY:
            raise ProviderError(
                "RAPIDAPI_KEY ist nicht gesetzt. "
                "Bitte den API-Key als ENV-Variable konfigurieren."
            )

    async def import_url(self, url: str, dest_dir: Path) -> ImportResult:
        video_id = _extract_video_id(url)
        if not video_id:
            raise ProviderError("Ungültige YouTube-URL — keine Video-ID gefunden.")

        loop = asyncio.get_event_loop()
        api_data = await loop.run_in_executor(None, self._fetch_api, video_id, url)

        cdn_url, quality = self._pick_best_url(api_data)

        dest_dir.mkdir(parents=True, exist_ok=True)
        output_path = dest_dir / "input.mp4"
        await loop.run_in_executor(None, self._stream_download, cdn_url, output_path)

        # Metadaten extrahieren (Format A oder generic)
        title     = self._extract_title(api_data) or f"YouTube-Video {video_id}"
        duration  = self._extract_duration(api_data)
        thumbnail = self._extract_thumbnail(api_data)

        return ImportResult(
            file_path=str(output_path),
            title=title,
            platform="youtube",
            duration=duration,
            thumbnail=thumbnail,
        )

    # ── API-Aufruf ───────────────────────────────────────────────────────────

    def _fetch_api(self, video_id: str, url: str) -> dict:
        """
        Ruft die RapidAPI auf.
        Versucht zuerst /v2/video/details (youtube-media-downloader),
        fällt zurück auf /download?url=... (generisches Format).
        """
        host = RAPIDAPI_YT_HOST
        headers = {
            "X-RapidAPI-Key":  RAPIDAPI_KEY,
            "X-RapidAPI-Host": host,
        }

        # Format A: youtube-media-downloader.p.rapidapi.com
        if "youtube-media-downloader" in host:
            api_url = f"https://{host}/v2/video/details?videoId={urllib.parse.quote(video_id)}"
        else:
            # Generic: /download?url=YOUTUBE_URL
            api_url = f"https://{host}/download?url={urllib.parse.quote(url, safe='')}"

        req = urllib.request.Request(api_url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="ignore")[:300]
            if e.code == 403:
                raise ProviderError("RapidAPI: Ungültiger API-Key oder Zugriff verweigert.")
            if e.code == 429:
                raise ProviderError("RapidAPI: Rate-Limit erreicht. Bitte warte kurz.")
            raise ProviderError(f"RapidAPI HTTP {e.code}: {body}")
        except urllib.error.URLError as e:
            raise ProviderError(f"RapidAPI nicht erreichbar: {e}")

        # Status-Check
        status = data.get("status", True)
        if status is False or (isinstance(status, str) and status.lower() not in ("ok", "success", "true")):
            msg = data.get("message") or data.get("error") or str(status)
            if "private" in str(msg).lower():
                raise ProviderError("Dieses YouTube-Video ist privat.")
            if "unavailable" in str(msg).lower() or "not available" in str(msg).lower():
                raise ProviderError("Dieses YouTube-Video ist nicht verfügbar (gelöscht oder gesperrt).")
            raise ProviderError(f"RapidAPI Fehler: {msg}")

        return data

    # ── URL-Auswahl ──────────────────────────────────────────────────────────

    def _pick_best_url(self, data: dict) -> tuple[str, str]:
        """
        Wählt die beste Video-URL aus der API-Antwort.
        Unterstützt Format A (youtube-media-downloader) und generische Formate.
        """
        # Format A: { "videos": { "items": [ {"quality":"720p","url":"...","hasAudio":true} ] } }
        videos_obj = data.get("videos")
        if isinstance(videos_obj, dict):
            items = videos_obj.get("items") or []
            # Nur Items mit Audio (combined stream)
            with_audio = [v for v in items if v.get("hasAudio") and v.get("url")]
            if not with_audio:
                with_audio = [v for v in items if v.get("url")]

            if with_audio:
                with_audio.sort(key=lambda v: self._quality_rank(
                    str(v.get("quality") or v.get("qualityLabel") or "")
                ))
                chosen = with_audio[0]
                return chosen["url"], str(chosen.get("quality") or "")

        # Format B: { "videos": [ {...} ] }  (flache Liste)
        videos_list = data.get("videos") if isinstance(data.get("videos"), list) else []
        if not videos_list:
            videos_list = data.get("links") or data.get("formats") or []

        if videos_list:
            mp4 = [
                v for v in videos_list
                if v.get("url") and "mp4" in (
                    v.get("extension") or v.get("format") or v.get("mimeType") or ""
                ).lower()
            ]
            if not mp4:
                mp4 = [v for v in videos_list if v.get("url")]

            if mp4:
                mp4.sort(key=lambda v: self._quality_rank(
                    str(v.get("quality") or v.get("qualityLabel") or "")
                ))
                chosen = mp4[0]
                return chosen["url"], str(chosen.get("quality") or "")

        # Format C: direkte URL
        if data.get("url"):
            return data["url"], ""
        if data.get("downloadUrl"):
            return data["downloadUrl"], ""

        raise ProviderError(
            "RapidAPI hat keine Download-URL zurückgegeben. "
            "Das Video ist evtl. privat, zu lang, oder das API-Limit ist erreicht."
        )

    @staticmethod
    def _quality_rank(q: str) -> int:
        for i, pref in enumerate(PREFERRED_QUALITIES):
            if pref in q:
                return i
        return 999

    # ── Metadaten-Extraktion ─────────────────────────────────────────────────

    @staticmethod
    def _extract_title(data: dict) -> Optional[str]:
        if data.get("title"):
            return data["title"]
        # youtube-media-downloader hat manchmal keinen direkten title-key
        return None

    @staticmethod
    def _extract_duration(data: dict) -> int:
        # Format A: { "duration": { "secondsText": "213" } }
        dur = data.get("duration")
        if isinstance(dur, dict):
            try:
                return int(dur.get("secondsText") or dur.get("seconds") or 0)
            except (ValueError, TypeError):
                return 0
        # Generic: { "duration": 213 }
        if isinstance(dur, (int, float)):
            return int(dur)
        return 0

    @staticmethod
    def _extract_thumbnail(data: dict) -> Optional[str]:
        # Format A: { "thumbnails": [ {"url": "..."} ] }
        thumbs = data.get("thumbnails")
        if isinstance(thumbs, list) and thumbs:
            # Letztes (größtes) Thumbnail nehmen
            return thumbs[-1].get("url")
        # Generic
        return data.get("thumbnail")
