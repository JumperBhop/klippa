"""
ImportService — erkennt Plattform und routet zum richtigen Provider.

Routing:
  YouTube  → YouTubeRapidAPIProvider  (Hauptweg)
             YtDlpProvider            (Fallback wenn RapidAPI-Key fehlt)
  TikTok   → YtDlpProvider
  Instagram→ YtDlpProvider
  Twitter  → YtDlpProvider
  Sonstige → YtDlpProvider
"""

import os
from pathlib import Path

from providers.base import ImportResult, ProviderError
from providers.youtube_rapidapi import YouTubeRapidAPIProvider
from providers.ytdlp import YtDlpProvider


def detect_platform(url: str) -> str:
    url = url.lower()
    if "youtube.com" in url or "youtu.be" in url:
        return "youtube"
    if "tiktok.com" in url:
        return "tiktok"
    if "instagram.com" in url:
        return "instagram"
    if "twitter.com" in url or "x.com" in url:
        return "twitter"
    return "other"


async def import_from_url(url: str, dest_dir: Path) -> ImportResult:
    """
    Importiert ein Video von der angegebenen URL.
    Wählt automatisch den richtigen Provider.
    """
    platform = detect_platform(url)

    if platform == "youtube":
        # Hauptweg: RapidAPI
        rapidapi_key = os.environ.get("RAPIDAPI_KEY", "")
        if rapidapi_key:
            try:
                provider = YouTubeRapidAPIProvider()
                return await provider.import_url(url, dest_dir)
            except ProviderError:
                # Wenn RapidAPI einen echten Fehler hat (privates Video, Limit etc.)
                raise
            except Exception as e:
                # Unerwarteter Fehler → Fallback auf yt-dlp versuchen
                raise ProviderError(f"RapidAPI-Fehler: {str(e)[:200]}")
        else:
            # Kein API-Key → Fallback auf yt-dlp (funktioniert evtl. nicht für YouTube)
            raise ProviderError(
                "Für YouTube-Downloads ist ein RapidAPI-Key nötig. "
                "Bitte RAPIDAPI_KEY als ENV-Variable setzen."
            )

    # TikTok / Instagram / Twitter / andere → yt-dlp
    provider = YtDlpProvider()
    return await provider.import_url(url, dest_dir)
