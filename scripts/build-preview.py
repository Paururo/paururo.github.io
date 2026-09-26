#!/usr/bin/env python3
"""Rebuild preview.html: index.html with the stylesheet, the scripts and the
two images seen first (logo and portrait) inlined, so the page can be opened
as a single file. Other images keep their relative paths.

Usage: python3 scripts/build-preview.py
"""
import base64
import mimetypes
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INLINE_IMAGES = ['assets/img/logo.png', 'assets/img/web/portrait-960.webp']


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return f.read()


def data_uri(path):
    mime = mimetypes.guess_type(path)[0] or 'image/webp'
    with open(os.path.join(ROOT, path), 'rb') as f:
        return f'data:{mime};base64,' + base64.b64encode(f.read()).decode('ascii')


def main():
    html = read('index.html')
    # the stylesheet moves next to the page, so its asset paths lose the ../
    css = read('css/style.css').replace('url(../assets/', 'url(assets/')
    html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')

    def inline_script(match):
        code = read(match.group(1))
        assert '</script' not in code, match.group(1)
        return '<script>\n' + code + '\n</script>'
    html = re.sub(r'<script src="(js/[\w.-]+\.js)"></script>', inline_script, html)

    for path in INLINE_IMAGES:
        html = html.replace(f'src="{path}"', f'src="{data_uri(path)}"')

    with open(os.path.join(ROOT, 'preview.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'wrote preview.html ({len(html) // 1024} KB)')


if __name__ == '__main__':
    main()
