"""
Base interface für alle Video-Import-Provider.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
import urllib.request


@dataclass
class ImportResult:
    file_path: str              # Lokaler Pfad der heruntergeladenen Datei
    title: str                  # Video-Titel
    platform: str               # youtube / tiktok / instagram / twitter
    duration: int = 0           # Länge in Sekunden
    thumbnail: Optional[str] = None  # Thumbnail-URL (kann None sein)


class ProviderError(Exception):
    """Wird geworfen wenn ein Provider einen bekannten Fehler hat."""
    pass


class BaseProvider:
    """Abstract Provider — alle konkreten Provider erben davon."""

    async def import_url(self, url: str, dest_dir: Path) -> ImportResult:
        raise NotImplementedError

    # ── Hilfsmethode: Stream-Download von einer direkten URL ────────────────
    def _stream_download(
        self,
        cdn_url: str,
        output_path: Path,
        extra_headers: Optional[dict] = None,
    ) -> None:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        }
        if extra_headers:
            headers.update(extra_headers)

        req = urllib.request.Request(cdn_url, headers=headers)
        with urllib.request.urlopen(req, timeout=300) as resp:
            with open(output_path, "wb") as f:
                while chunk := resp.read(65_536):
                    f.write(chunk)

        if not output_path.exists() or output_path.stat().st_size < 50_000:
            raise ProviderError("Download fehlgeschlagen: Datei zu klein oder leer")
