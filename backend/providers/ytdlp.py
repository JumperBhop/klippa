"""
YtDlpProvider — lädt Videos über yt-dlp herunter.
Primär für TikTok, Instagram, Twitter.
YouTube als optionaler Fallback (oft geblockt von Hetzner).
"""

import asyncio
from pathlib import Path

from .base import BaseProvider, ImportResult, ProviderError

COOKIES_FILE = Path(__file__).parent.parent / "youtube_cookies.txt"


class YtDlpProvider(BaseProvider):
    """
    Lädt Videos via yt-dlp herunter.
    Nutzt youtube_cookies.txt falls vorhanden (für TikTok/Instagram Auth).
    """

    async def import_url(self, url: str, dest_dir: Path) -> ImportResult:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._download_sync, url, dest_dir)

    def _download_sync(self, url: str, dest_dir: Path) -> ImportResult:
        import yt_dlp

        dest_dir.mkdir(parents=True, exist_ok=True)
        outtmpl = str(dest_dir / "input.%(ext)s")

        ydl_opts: dict = {
            "format": "bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best",
            "outtmpl": outtmpl,
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
        }
        if COOKIES_FILE.exists():
            ydl_opts["cookiefile"] = str(COOKIES_FILE)

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
        except yt_dlp.utils.DownloadError as e:
            msg = str(e)
            if "Private video" in msg or "private" in msg.lower():
                raise ProviderError("Dieses Video ist privat und nicht abrufbar.")
            if "not available" in msg.lower() or "unavailable" in msg.lower():
                raise ProviderError("Dieses Video ist nicht verfügbar.")
            if "login" in msg.lower() or "sign in" in msg.lower():
                raise ProviderError("Dieses Video erfordert einen Login.")
            raise ProviderError(f"yt-dlp Download fehlgeschlagen: {msg[:200]}")

        # Ausgabedatei finden
        output_path = dest_dir / "input.mp4"
        if not output_path.exists():
            for p in sorted(dest_dir.iterdir()):
                if p.stem == "input" and p.suffix in (".mp4", ".webm", ".mkv", ".mov"):
                    p.rename(output_path)
                    break
            else:
                raise ProviderError("yt-dlp: Keine Ausgabedatei erzeugt.")

        # Metadaten aus info extrahieren
        title = (info or {}).get("title") or "Video"
        duration = int((info or {}).get("duration") or 0)
        thumbnail = (info or {}).get("thumbnail")

        # Plattform ermitteln
        platform = "other"
        if "tiktok.com" in url:
            platform = "tiktok"
        elif "instagram.com" in url:
            platform = "instagram"
        elif "twitter.com" in url or "x.com" in url:
            platform = "twitter"
        elif "youtube.com" in url or "youtu.be" in url:
            platform = "youtube"

        return ImportResult(
            file_path=str(output_path),
            title=title,
            platform=platform,
            duration=duration,
            thumbnail=thumbnail,
        )
