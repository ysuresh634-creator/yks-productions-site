# Flags text that overlaps other text or runs off the page, across every generated book.
import fitz, glob, os, collections
HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(HERE,'out')
W,H=595.28,841.89
def rects_overlap(a,b):
    ix=min(a.x1,b.x1)-max(a.x0,b.x0); iy=min(a.y1,b.y1)-max(a.y0,b.y0)
    if ix<=0 or iy<=0: return 0
    return ix*iy
issues=collections.defaultdict(list)
for f in sorted(glob.glob(os.path.join(OUT,'*.pdf'))):
    tpl,scn=os.path.basename(f)[:-4].split('__')
    d=fitz.open(f)
    for pno in range(d.page_count):
        pg=d[pno]
        spans=[]
        for blk in pg.get_text('dict')['blocks']:
            if blk['type']!=0: continue
            for line in blk['lines']:
                for sp in line['spans']:
                    t=sp['text'].strip()
                    if not t: continue
                    r=fitz.Rect(sp['bbox'])
                    # a span bbox includes font ascent/descent padding; shrink to the visible glyph band
                    pad=r.height*0.19
                    spans.append((fitz.Rect(r.x0, r.y0+pad, r.x1, r.y1-pad), t, round(sp['size'],1)))
        # 1) text-vs-text overlap (ignore same-line neighbours)
        for i in range(len(spans)):
            for j in range(i+1,len(spans)):
                ra,ta,_=spans[i]; rb,tb,_=spans[j]
                a=rects_overlap(ra,rb)
                if a<=0: continue
                same_line = abs(ra.y0-rb.y0)<1.2 and abs(ra.height-rb.height)<1.2
                if same_line: continue
                # require meaningful overlap (avoid 1px kerning touches)
                smaller=min(ra.width*ra.height, rb.width*rb.height)
                if smaller<=0 or a/smaller < 0.12: continue
                issues[(tpl,scn)].append(f"p{pno+1} TEXT-OVERLAP {a/smaller*100:.0f}% '{ta[:26]}' × '{tb[:26]}'")
        # 2) text outside the page / into the bleed margin
        for r,t,sz in spans:
            if r.x0 < 12 or r.x1 > W-12 or r.y0 < 8 or r.y1 > H-8:
                issues[(tpl,scn)].append(f"p{pno+1} OFF-PAGE '{t[:30]}' box=({r.x0:.0f},{r.y0:.0f},{r.x1:.0f},{r.y1:.0f})")
    d.close()
total=sum(len(v) for v in issues.values())
print(f"scanned {len(glob.glob(os.path.join(OUT,'*.pdf')))} PDFs — {total} issues in {len(issues)} files\n")
for k in sorted(issues, key=lambda k:-len(issues[k]))[:14]:
    print(f"── {k[0]} / {k[1]} ({len(issues[k])})")
    seen=set()
    for msg in issues[k]:
        key=msg.split("'")[0]
        if key in seen and len(seen)>3: continue
        seen.add(key); print("   ",msg)
