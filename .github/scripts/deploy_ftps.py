#!/usr/bin/env python3
"""Upload ONLY the Vite dist/ output to a restricted DirectAdmin FTPS account.

Safety guarantees:
- Explicit FTPS with certificate validation; no unencrypted FTP fallback.
- Never deletes any remote file (not even stale assets).
- Does not upload source code, API PHP gateway, or .htaccess.
- Publishes index.html / templates.html after other files.
- Attempts atomic HTML updates using a temporary file + FTP rename.
- Retries transient control/data-channel failures on a fresh FTPS connection.
"""

from __future__ import annotations

import ftplib
import os
from pathlib import Path
import ssl
import sys
import time

DIST = Path("dist").resolve()
FORBIDDEN_NAMES = {".htaccess", ".env", ".env.production", ".env.local"}
FORBIDDEN_DIRS = {"api", "cgi-bin", ".github", "node_modules"}
LAST_FILES = ("templates.html", "index.html")
FTP_TIMEOUT_SECONDS = 120
MAX_UPLOAD_ATTEMPTS = 3
RETRY_DELAYS_SECONDS = (2, 5)


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Required GitHub environment secret is missing: {name}")
    return value


def remote_cd(ftp: ftplib.FTP_TLS, path: str, create: bool = False) -> None:
    # Accounts should be confined to a single public_html directory by DirectAdmin.
    ftp.cwd("/")
    for segment in path.replace("\\", "/").split("/"):
        if segment in {"", "."}:
            continue
        if segment == "..":
            raise ValueError("Parent segments are not allowed in FTP_REMOTE_DIR")
        try:
            ftp.cwd(segment)
        except ftplib.error_perm:
            if not create:
                raise
            ftp.mkd(segment)
            ftp.cwd(segment)


def connect_ftp(host: str, port: int, user: str, password: str,
                context: ssl.SSLContext) -> ftplib.FTP_TLS:
    ftp = ftplib.FTP_TLS(context=context, timeout=FTP_TIMEOUT_SECONDS)
    try:
        ftp.connect(host=host, port=port, timeout=FTP_TIMEOUT_SECONDS)
        ftp.login(user=user, passwd=password)
        ftp.prot_p()
        ftp.set_pasv(True)
        return ftp
    except Exception:
        ftp.close()
        raise


def close_ftp(ftp: ftplib.FTP_TLS | None) -> None:
    if ftp is None:
        return
    try:
        ftp.close()
    except OSError:
        pass


def main() -> None:
    host = require_env("FTP_HOST")
    user = require_env("FTP_USERNAME")
    password = require_env("FTP_PASSWORD")
    port = int(os.getenv("FTP_PORT") or "21")
    target = os.getenv("FTP_REMOTE_DIR") or "/"

    if not (DIST / "index.html").is_file() or not (DIST / "assets").is_dir():
        raise FileNotFoundError("Vite dist/index.html or dist/assets is missing")

    files = sorted(f for f in DIST.rglob("*") if f.is_file() and not f.is_symlink())
    files = [
        file for file in files
        if not any(part in FORBIDDEN_DIRS for part in file.relative_to(DIST).parts[:-1])
        and file.name not in FORBIDDEN_NAMES
    ]
    files.sort(key=lambda file: (file.relative_to(DIST).as_posix() in LAST_FILES,
                                 file.relative_to(DIST).as_posix()))

    if len(files) < 3:
        raise RuntimeError("Suspiciously small build: refusing to deploy")

    print(f"Connecting to configured FTPS server; deploying {len(files)} frontend files")
    context = ssl.create_default_context()
    ftp: ftplib.FTP_TLS | None = None

    try:
        for index, file in enumerate(files, start=1):
            relative = file.relative_to(DIST)
            remote_subdir = relative.parent.as_posix()
            name = file.name
            is_html_entry = relative.as_posix() in LAST_FILES
            upload_name = name + ".__uploading__" if is_html_entry else name

            for attempt in range(1, MAX_UPLOAD_ATTEMPTS + 1):
                try:
                    if ftp is None:
                        ftp = connect_ftp(host, port, user, password, context)

                    remote_cd(ftp, target)
                    if remote_subdir != ".":
                        remote_cd(ftp, target.rstrip("/") + "/" + remote_subdir, create=True)

                    with file.open("rb") as source:
                        ftp.storbinary(f"STOR {upload_name}", source, blocksize=131072)

                    if is_html_entry:
                        try:
                            ftp.rename(upload_name, name)
                        except ftplib.error_perm as exc:
                            raise RuntimeError(
                                f"Server rejected atomic rename for {name}; old page was left intact. "
                                "Ask hosting support whether FTP RNTO overwrites an existing file."
                            ) from exc

                    print(f"[{index}/{len(files)}] {relative.as_posix()}", flush=True)
                    break

                except (OSError, EOFError, ftplib.error_temp) as exc:
                    close_ftp(ftp)
                    ftp = None
                    if attempt >= MAX_UPLOAD_ATTEMPTS:
                        raise RuntimeError(
                            f"FTPS transfer failed for {relative.as_posix()} after "
                            f"{MAX_UPLOAD_ATTEMPTS} attempts: {type(exc).__name__}: {exc}"
                        ) from exc

                    delay = RETRY_DELAYS_SECONDS[min(attempt - 1, len(RETRY_DELAYS_SECONDS) - 1)]
                    print(
                        f"Transient FTPS error on {relative.as_posix()} "
                        f"(attempt {attempt}/{MAX_UPLOAD_ATTEMPTS}): "
                        f"{type(exc).__name__}: {exc}. Reconnecting in {delay}s.",
                        file=sys.stderr,
                        flush=True,
                    )
                    time.sleep(delay)

        print("BioPlot static deploy completed without deleting remote files.")

    finally:
        if ftp is not None:
            try:
                ftp.quit()
            except (OSError, EOFError, ftplib.Error):
                close_ftp(ftp)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"DEPLOY FAILED: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
