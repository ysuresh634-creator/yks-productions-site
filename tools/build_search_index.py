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


# Subject tags drive the filter chips — a client who only wants weddings
# should be able to see weddings and nothing else, whatever the page type.
#
# Matched against the URL PATH ONLY, deliberately. The paths here are already
# descriptive (wedding-photographer-dubai.html, real-estate-videographer-*),
# whereas descriptions and headings mention every service on every page — going
# near them tagged gear.html as "Real estate" and faq.html as "Weddings".
# A general page (faq, gear, quote, photographer-<city>) getting no subject is
# the right answer: it isn't a wedding page, so a Weddings filter must not list it.
SUBJECTS = [
    ("Weddings",    r"wedding|haldi|bride|engagement"),
    ("Real estate", r"real-?estate|property"),
    ("Fashion",     r"fashion|editorial|lookbook"),
    ("Models",      r"models-in-|casting|talents"),
    ("Films",       r"^/films|film-stills|soothravakyam|baby-?girl|\bbts\b"),
    ("Portraits",   r"portrait|headshot|maternity"),
    ("Corporate",   r"corporate|marriott|social-?media|content-?creator"),
    ("Events",      r"event|nights|party"),
    ("Food",        r"food"),
]


def subjects(path):
    p = path.lower()
    return [name for name, pat in SUBJECTS if re.search(pat, p)]


SECTION = re.compile(r'<section\b[^>]*\bid="([^"]+)"[^>]*>', re.I)
# structural shells, not places a visitor wants to be dropped
SKIP_IDS = re.compile(r"^(act-hero|act-quote|act-book|contact-sheet|frames)$", re.I)


def sections(body, cap=8):
    """Yield (id, html-chunk) for each <section id> — chunk runs to the next
    section start, which is enough to find that section's own heading."""
    marks = [(m.group(1), m.end()) for m in SECTION.finditer(body)]
    out = []
    for i, (sid, pos) in enumerate(marks):
        if SKIP_IDS.match(sid):
            continue
        end = marks[i + 1][1] if i + 1 < len(marks) else min(len(body), pos + 6000)
        out.append((sid, body[pos:end]))
        if len(out) >= cap:
            break
    return out


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

        heads_s = " · ".join(heads)
        cat, subs = category(rel), subjects(rel)
        entries.append({
            "u": rel,
            "t": title or rel,
            "d": desc,
            "k": heads_s,
            "c": cat,
            "g": subs,
        })

        # Section anchors — so a result can land on the exact part of the page
        # (fashion.html#divya) instead of dropping the visitor at the top.
        for sid, chunk in sections(body):
            head = first(r"<h[1-3][^>]*>(.*?)</h[1-3]>", chunk)
            if not head or len(head) > 80:
                continue
            # Headlines here are deliberately poetic ("Pick a thread.") — useless
            # to search. The eyebrow above them is the plain label ("The work"),
            # so prefer it for the title and keep the headline as context.
            eyebrow = first(r'class="(?:l-)?eyebrow"[^>]*>(.*?)</', chunk)
            eyebrow = re.sub(r"^\s*\d+\s*[—\-–·]?\s*", "", eyebrow).strip()
            label = eyebrow if len(eyebrow) > 2 else head
            entries.append({
                "u": rel + "#" + sid,
                "t": label,
                "d": head if label != head else "",
                "k": head + " " + eyebrow,    # both are searchable either way
                "c": cat,
                "g": subs,
                "a": 1,                       # anchor entry
                "p": title or rel,            # parent page, shown as the subtitle
            })

    entries.sort(key=lambda e: (e["c"] != "Home", e["c"], e["t"]))
    out = os.path.join(ROOT, "search-index.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))

    size = os.path.getsize(out)
    by_cat, by_sub = {}, {}
    for e in entries:
        by_cat[e["c"]] = by_cat.get(e["c"], 0) + 1
        for g in e["g"]:
            by_sub[g] = by_sub.get(g, 0) + 1
    print(f"indexed {len(entries)} pages -> search-index.json ({size/1024:.1f} KB)")
    print("  sections: " + "  ".join(f"{k}:{v}" for k, v in sorted(by_cat.items())))
    print("  subjects: " + "  ".join(f"{k}:{v}" for k, v in sorted(by_sub.items())))
    untagged = [e["u"] for e in entries if not e["g"]]
    if untagged:
        print(f"  untagged ({len(untagged)}): {untagged[:6]}")
    if missing:
        print(f"  WARNING: {len(missing)} sitemap URLs have no local file: {missing[:5]}")

    # hard guard: a talent profile path must never appear
    blob = json.dumps(entries)
    for b in BLOCKED:
        if b in blob:
            sys.exit(f"ABORT: blocked path {b} leaked into the index")


if __name__ == "__main__":
    main()
