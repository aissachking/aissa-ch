"""Rebuild the pre-rendered markup of the site from data.js.

- index.html: the #featured and #grid blocks are refreshed from what app.js renders.
- <id>/index.html: one page per project = the home page + its own <head> meta + the
  pre-rendered detail view (so links like /aissa-ch/zad/ work and are indexable).

Run:  python3 tools/build_pages.py      (needs: pip install playwright && playwright install chromium)
"""
import asyncio, functools, http.server, json, os, re, threading
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://aissachking.github.io/aissa-ch/"
PORT = 8799


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def element_span(html, elem_id):
    """(start of inner, end of inner) for the <div ... id="elem_id"> element."""
    m = re.search(r'<div\b[^>]*\bid="%s"[^>]*>' % re.escape(elem_id), html)
    if not m:
        raise ValueError("no #" + elem_id)
    i, depth = m.end(), 1
    for t in re.finditer(r"<(/?)div\b[^>]*>", html[i:]):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return m.start(), m.end(), i + t.start(), i + t.end()
    raise ValueError("unclosed #" + elem_id)


def set_inner(html, elem_id, inner, open_tag=None):
    s, ie, e, end = element_span(html, elem_id)
    return html[:s] + (open_tag or html[s:ie]) + inner + html[e:end] + html[end:]


def clean(markup):
    return re.sub(r'\s+class="([^"]*)"', lambda m: ' class="%s"' % " ".join(c for c in m.group(1).split() if c != "pre"), markup)


def head_for(a, old_page):
    """Meta block + JSON-LD for one project page. Reuse the existing ones when the page exists."""
    if old_page and a.get("_keep_meta", True):
        meta = re.search(r'<base href="\.\./">.*?<meta name="twitter:card"[^>]*>', old_page, re.S)
        ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', old_page, re.S)
        if meta and ld and json.loads(ld.group(1)).get("name") == a["name"]["ar"]:
            return meta.group(0), ld.group(0)
    url = SITE + a["id"] + "/"
    title = f'{a["name"]["ar"]} — AISSA CH'
    desc = (a["short"]["ar"] + " " + a["long"]["ar"])[:160]
    e = lambda s: s.replace("&", "&amp;").replace('"', "&quot;")
    meta = f'''<base href="../">
<title>{title}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AISSA CH">
<meta property="og:locale" content="ar_DZ">
<meta property="og:locale:alternate" content="fr_DZ">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{SITE}img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">'''
    ld = {"@context": "https://schema.org",
          "@type": "SoftwareApplication" if a["kind"] == "apk" else "WebApplication",
          "name": a["name"]["ar"], "alternateName": a["name"]["fr"], "description": a["long"]["ar"],
          "applicationCategory": "BusinessApplication" if a["id"] == "tasli7" else "LifestyleApplication",
          "operatingSystem": "Android" if a["kind"] == "apk" else "Web",
          "author": {"@type": "Person", "name": "Aissa CH", "url": SITE},
          "url": url, "image": SITE + a["shots"][0]}
    if a["kind"] == "apk" and a.get("url"):
        ld["downloadUrl"] = a["url"] if a["url"].startswith("http") else SITE + a["url"]
    if a["kind"] == "web" and a.get("url"):
        ld["sameAs"] = a["url"]
    return meta, '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>"


async def main():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1280, "height": 900}, service_workers="block", reduced_motion="reduce")
        pg = await ctx.new_page()
        await pg.route("**/fonts.g*/**", lambda r: r.abort())
        await pg.goto(f"http://127.0.0.1:{PORT}/index.html")
        await pg.wait_for_timeout(800)
        apps = await pg.evaluate("window.APPS")
        featured = clean(await pg.evaluate("document.getElementById('featured').innerHTML"))
        grid = clean(await pg.evaluate("document.getElementById('grid').innerHTML"))

        path = os.path.join(ROOT, "index.html")
        home = open(path, encoding="utf-8").read()
        home = set_inner(home, "featured", featured)
        home = set_inner(home, "grid", grid)
        open(path, "w", encoding="utf-8").write(home)

        for a in apps:
            await pg.goto(f"http://127.0.0.1:{PORT}/index.html#{a['id']}")
            await pg.wait_for_timeout(600)
            detail = clean(await pg.evaluate("document.getElementById('detail').innerHTML"))
            ppath = os.path.join(ROOT, a["id"], "index.html")
            old = open(ppath, encoding="utf-8").read() if os.path.exists(ppath) else ""
            meta, ld = head_for(a, old)
            page = home.replace('<html lang="ar" dir="rtl">', f'<html lang="ar" dir="rtl" data-app="{a["id"]}">', 1)
            page = re.sub(r'\n<title>.*?<meta name="twitter:card"[^>]*>', lambda m: meta, page, count=1, flags=re.S)
            page = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: ld, page, count=1, flags=re.S)
            page = page.replace("<body>", '<body style="overflow:hidden">', 1)
            page = set_inner(page, "detail", detail, '<div class="detail" id="detail" role="dialog" aria-modal="true" aria-labelledby="dTitle">')
            os.makedirs(os.path.dirname(ppath), exist_ok=True)
            open(ppath, "w", encoding="utf-8").write(page)
            print("built", a["id"])
        await b.close()
    srv.shutdown()


asyncio.run(main())
