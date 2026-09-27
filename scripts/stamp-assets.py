#!/usr/bin/env python3
"""Stamp every stylesheet and script link in index.html with a short hash of
the file it points to (`js/polar.js?v=1a2b3c4d5e`), and the images the
stylesheet uses the same way. A browser then never pairs a new page with an
older copy of its code kept in its cache: GitHub Pages lets browsers keep
files for ten minutes, and a phone that mixes a new index.html with the
main.js of the previous version never starts Polar.

Run it after changing any file under css/ or js/, or Polar's sprite sheet.

Usage: python3 scripts/stamp-assets.py [--check]
  --check  only report stale stamps, and exit with 1 if there are any
"""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLESHEET = 'css/style.css'
PAGES = ['index.html']

# url(../assets/img/polar.png) or url(../assets/img/polar.png?v=...)
CSS_REF = re.compile(r'url\((?P<q>["\']?)\.\./(?P<path>[\w./-]+?)(?:\?v=[0-9a-f]+)?(?P=q)\)')
# href="css/style.css", src="js/main.js?v=..." or data-src="js/city.js" (loaded later)
PAGE_REF = re.compile(r'(?P<attr>(?:href|src|data-src)=")(?P<path>(?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"')


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return f.read()


def digest(path):
    with open(os.path.join(ROOT, path), 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()[:10]


def stamp_css(css):
    def repl(m):
        q = m.group('q')
        return f'url({q}../{m.group("path")}?v={digest(m.group("path"))}{q})'
    return CSS_REF.sub(repl, css)


def stamp_page(html, css_hash):
    def repl(m):
        path = m.group('path')
        version = css_hash if path == STYLESHEET else digest(path)
        return f'{m.group("attr")}{path}?v={version}"'
    return PAGE_REF.sub(repl, html)


def main():
    check = '--check' in sys.argv[1:]
    stale = []

    # the stylesheet first: its own hash has to include the stamps inside it
    css = read(STYLESHEET)
    new_css = stamp_css(css)
    if new_css != css:
        stale.append(STYLESHEET)
        if not check:
            with open(os.path.join(ROOT, STYLESHEET), 'w', encoding='utf-8') as f:
                f.write(new_css)
    css_hash = hashlib.sha256(new_css.encode('utf-8')).hexdigest()[:10]

    for page in PAGES:
        html = read(page)
        new_html = stamp_page(html, css_hash)
        if new_html != html:
            stale.append(page)
            if not check:
                with open(os.path.join(ROOT, page), 'w', encoding='utf-8') as f:
                    f.write(new_html)

    if check:
        if stale:
            print('stale stamps in ' + ', '.join(stale) + ': run python3 scripts/stamp-assets.py')
            sys.exit(1)
        print('stamps are current')
    else:
        print('stamped ' + ', '.join(stale) if stale else 'stamps were already current')


if __name__ == '__main__':
    main()
