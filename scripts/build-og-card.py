#!/usr/bin/env python3
"""Regenerate assets/img/og-card.png (the link preview image) from
scripts/og-card.html with headless Chrome.

Usage: python3 scripts/build-og-card.py
"""
import functools
import http.server
import os
import shutil
import subprocess
import sys
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img', 'og-card.png')
CHROMES = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    shutil.which('google-chrome') or '',
    shutil.which('chromium') or '',
    shutil.which('chromium-browser') or '',
]


def main():
    chrome = next((c for c in CHROMES if c and os.path.exists(c)), None)
    if not chrome:
        sys.exit('Chrome or Chromium not found')
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    try:
        subprocess.run([
            chrome, '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1',
            '--window-size=1200,630', '--virtual-time-budget=6000', '--run-all-compositor-stages-before-draw',
            f'--screenshot={OUT}', f'http://127.0.0.1:{port}/scripts/og-card.html',
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    finally:
        httpd.shutdown()
    print('wrote', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
