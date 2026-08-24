#!/usr/bin/env python3
"""Build search-index.json from the pages listed in sitemap.xml.

The sitemap is the source of truth for what's public — anything not in it
(previews, noindex utility pages, talent profiles) never reaches the index.
Run from the repo root:  python3 tools/build_search_index.py
"""
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://yksproductions.com"

# Talent names are private (profiles are noindex and names must never be published).
# Belt and braces: refuse to index anything under the profile directory.
BLOCKED = ("/talents/id/",)

TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")


def text(s):
    return WS.sub(" ", html.unescape(TAG.sub(" ", s))).strip()


def first(pattern, src, group=1):
    m = re.search(pattern, src, re.I | re.S)
    return text(m.group(group)) if m else ""


def category(path):
    p = path.strip("/")
    if p in ("", "index.html"):
        return "Home"
    if p.startswith("blog/"):
        return "Journal"
    if p.startswith("models-in-") or p in ("talents.html", "casting-india.html") or p.startswith("talents/"):
        return "Talent"
    if p in ("dubai/", "india/", "dubai/index.html", "india/index.html"):
        return "Market"
    if p in ("real-estate.html", "fashion.html", "films.html", "portraits.html",
             "marriott.html", "nights.html", "weddings.html"):
        return "Work"
    if p in ("faq.html", "quote.html", "gear.html", "story.html", "prints.html",
             "privacy.html", "terms.html"):
        return "Info"
    return "Services"


def local_path(url):
    rel = url.replace(SITE, "").split("#")[0].split("?")[0]
    if rel in ("", "/"):
        rel = "/index.html"
    if rel.endswith("/"):
        rel += "index.html"
    return rel, os.path.join(ROOT, rel.lstrip("/"))


def main():
    sitemap = open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()
    urls = re.findall(r"<loc>([^<]+)</loc>", sitemap)

    entries, missing = [], []
    for url in urls:
        rel, fp = local_path(url)
        if any(b in rel for b in BLOCKED):
            continue
        if not os.path.isfile(fp):
            missing.append(rel)
            continue

        src = open(fp, encoding="utf-8", errors="ignore").read()
        # strip anything that isn't prose before pulling headings
        body = re.sub(r"<(script|style|svg|noscript)\b.*?</\1>", " ", src, flags=re.I | re.S)

        title = first(r"<title>(.*?)</title>", src)
        title = re.sub(r"\s*[—|]\s*YKS Productions.*$", "", title).strip()
        desc = first(r'<meta\s+name="description"\s+content="(.*?)"', src)

        heads, seen = [], set()
        for h in re.findall(r"<h[123][^>]*>(.*?)</h[123]>", body, re.I | re.S):
            t = text(h)
            k = t.lower()
            if t and 2 < len(t) < 90 and k not in seen:
                seen.add(k)
                heads.append(t)
            if len(heads) >= 14:
                break

        entries.append({
            "u": rel,
            "t": title or rel,
            "d": desc,
            "k": " · ".join(heads),
            "c": category(rel),
        })

    entries.sort(key=lambda e: (e["c"] != "Home", e["c"], e["t"]))
    out = os.path.join(ROOT, "search-index.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))

    size = os.path.getsize(out)
    by_cat = {}
    for e in entries:
        by_cat[e["c"]] = by_cat.get(e["c"], 0) + 1
    print(f"indexed {len(entries)} pages -> search-index.json ({size/1024:.1f} KB)")
    print("  " + "  ".join(f"{k}:{v}" for k, v in sorted(by_cat.items())))
    if missing:
        print(f"  WARNING: {len(missing)} sitemap URLs have no local file: {missing[:5]}")

    # hard guard: a talent profile path must never appear
    blob = json.dumps(entries)
    for b in BLOCKED:
        if b in blob:
            sys.exit(f"ABORT: blocked path {b} leaked into the index")


if __name__ == "__main__":
    main()
