/* ═══════════════════════════════════════════════════════════════
   YKS CINEMA ENGINE
   Scroll-scrubbed cinematic acts rendered on <canvas>.

   Two render paths per act:
     1. FRAME SEQUENCE — if assets/frames/<act>/manifest.json exists
        (sliced from real Higgsfield clips via tools/slice-clips.sh),
        the canvas scrubs through the JPEG frames.
     2. PROCEDURAL SHADER — raw-WebGL fragment shader fallback that
        ships with the site, so it is cinematic with zero assets.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Render resolution: the nebula/skyline shaders are soft, so a lower
  // internal buffer is visually identical but far cheaper on the GPU.
  // Phones get 1× (huge win on retina); desktops a modest 1.3×.
  const MOBILE = matchMedia('(max-width: 768px)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.0 : 1.5);
  const MAX_BUF = MOBILE ? 1100 : 2400;   // hard cap on buffer width — crisp on big screens, lean on phones

  /* ---------- pointer / tilt tracker ----------
     One tracker for every scene. Desktop follows the cursor; Android
     follows the gyroscope (no permission dialog there). iOS gets no
     random permission prompt — the shader simply rests at centre.
     Reduced-motion never attaches, so u_point stays (0,0). */
  const POINT = { x: 0, y: 0 };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
      addEventListener('pointermove', e => {
        POINT.x = Math.max(-1, Math.min(1, (e.clientX / innerWidth - .5) * 2));
        POINT.y = Math.max(-1, Math.min(1, -(e.clientY / innerHeight - .5) * 2));
      }, { passive: true });
    } else if (window.DeviceOrientationEvent &&
               typeof DeviceOrientationEvent.requestPermission !== 'function') {
      addEventListener('deviceorientation', e => {
        if (e.gamma == null) return;
        POINT.x = Math.max(-1, Math.min(1, e.gamma / 30));
        POINT.y = Math.max(-1, Math.min(1, (35 - e.beta) / 30));
      }, { passive: true });
    }
  }

  /* ---------- shared GLSL ---------- */
  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  const NOISE_LIB = `
    precision highp float;
    uniform vec2 u_res; uniform float u_time; uniform float u_scroll;
    uniform vec2 u_point;   // smoothed pointer/tilt, -1..1 (0,0 when idle)
    float hash(vec2 p){p=fract(p*0.3183099+vec2(0.71,0.113));return fract(p.x*p.y*95.4307);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
      return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0.,a=.5;
      mat2 r=mat2(.8,.6,-.6,.8);
      for(int i=0;i<5;i++){v+=a*noise(p);p=r*p*2.04;a*=.52;}
      return v;
    }
  `;

  /* ── ACT I · HERO — volcanic nebula, scroll = camera push-in ── */
  const HERO_FRAG = NOISE_LIB + `
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*u_res)/u_res.y;
      float s=u_scroll;
      float zoom=1.+s*0.85;                      // gentle push-in — stays in rich detail, never blows out the centre
      vec2 p=(uv+u_point*.05)/zoom;              // the nebula leans a few degrees toward the hand
      float t=u_time*.05+s*2.2;

      // domain-warped nebula
      vec2 q=vec2(fbm(p*2.4+t), fbm(p*2.4+vec2(5.2,1.3)-t*.7));
      vec2 r2=vec2(fbm(p*2.4+3.5*q+vec2(1.7,9.2)), fbm(p*2.4+3.5*q+vec2(8.3,2.8)+t*.4));
      float f=fbm(p*2.4+3.2*r2);

      // incredible colours: ember → magenta → violet → teal
      vec3 ember =vec3(1.00,.45,.16);
      vec3 peach =vec3(1.00,.76,.58);
      vec3 mag   =vec3(.95,.18,.50);
      vec3 viol  =vec3(.42,.16,.92);
      vec3 teal  =vec3(.10,.83,.78);
      vec3 deep  =vec3(.030,.024,.055);

      vec3 col=deep;
      col=mix(col,viol, smoothstep(.18,.78,f)*.85);
      col=mix(col,mag,  smoothstep(.34,.9,q.y)*.6);
      col=mix(col,ember,smoothstep(.42,.95,r2.x)*.95);
      col=mix(col,peach,smoothstep(.62,1.,f*r2.x)*.8);
      col=mix(col,teal, smoothstep(.55,.95,q.x*(1.-f))*.4*(1.-s*.5));

      // grade shifts cooler/violet as we push deeper
      col=mix(col,col.bgr*vec3(.9,.7,1.25),s*.20);

      // god rays from upper key light
      vec2 lp=vec2(.34-s*.2,.42);
      vec2 d=uv-lp;
      float ang=atan(d.y,d.x);
      float ray=pow(max(0.,sin(ang*7.+t*2.)*.5+.5),3.)*exp(-length(d)*2.2);
      col+=vec3(1.,.62,.3)*ray*.34*(1.-s*.4);
      col+=vec3(1.,.7,.45)*exp(-length(d)*3.4)*.38;

      // dust particles, 3 parallax layers
      for(int i=1;i<=3;i++){
        float fi=float(i);
        vec2 gp=uv*(5.+fi*4.)+vec2(t*(.4+fi*.22),fi*7.3+t*.1);
        vec2 cell=fract(gp)-.5; float id=hash(floor(gp));
        float star=smoothstep(.05+.04*fi,.0,length(cell+(vec2(id,fract(id*7.))-.5)*.6));
        col+=star*step(.75,id)*vec3(1.,.8,.6)*.5/fi;
      }

      // anamorphic flare on key light
      col+=vec3(.3,.55,.9)*exp(-abs(d.y)*26.)*exp(-abs(d.x)*2.6)*.5;

      // faint warmth where the pointer rests — light following attention
      vec2 pd=uv-u_point*vec2(.42,.26);
      col+=vec3(1.,.55,.25)*.055*exp(-dot(pd,pd)*7.5)*min(1.,length(u_point)*2.5);

      // exposure ramp + vignette + grain — gentle, no end-of-scroll blowout
      col*=1.03+s*.08;
      float vig=smoothstep(1.25,.35,length(uv));
      col*=vig;
      col+=(hash(gl_FragCoord.xy+fract(u_time)*100.)-.5)*.05;
      col=pow(max(col,0.),vec3(.92));
      gl_FragColor=vec4(col,1.);
    }
  `;

  /* ── ACT IV · DUBAI — scroll scrubs golden hour → night.
        Skyline silhouette: Burj Khalifa (stepped needle), Burj Al Arab
        (sail), Palm Jumeirah palm island, plus generic towers. ── */
  const DUBAI_FRAG = NOISE_LIB + `
    const float HORIZON = .42;

    float buildings(float x,float seed,float fmax){
      float id=floor(x); float h=hash(vec2(id,seed));
      return .12+pow(h,1.6)*fmax;
    }
    // coverage of a line segment a→b with width w (cheap smooth edge)
    float seg(vec2 p, vec2 a, vec2 b, float w){
      vec2 pa=p-a, ba=b-a;
      float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);
      return 1.-smoothstep(w*.7,w,length(pa-ba*h));
    }
    // Burj Khalifa — stepped tapering needle centred at cx
    float burj(vec2 uv,float cx){
      float x=abs(uv.x-cx);
      float h=uv.y-HORIZON;
      if(h<0.||h>.475) return 0.;
      float w = h<.05?.052 : h<.115?.040 : h<.185?.029 : h<.25?.020 :
                h<.31?.0135: h<.365?.0085: h<.415?.0048: h<.45?.0022:.0008;
      return 1.-smoothstep(w-.0015,w+.0015,x);
    }
    // Burj Al Arab — curved sail centred at cx
    float sail(vec2 uv,float cx){
      vec2 p=vec2(uv.x-cx,uv.y-HORIZON);
      if(p.y<0.||p.y>.155) return 0.;
      float t=p.y/.155;
      float xl=-.052*pow(1.-t,.62);           // curved leading edge
      float xr=.013-.006*t;                    // near-vertical mast edge
      return (1.-smoothstep(xr,xr+.003,p.x))*smoothstep(xl-.003,xl,p.x);
    }
    // palm tree — trunk + 7 fronds, base at b, scale s
    float palm(vec2 uv, vec2 b, float s){
      vec2 p=(uv-b)/s;
      if(abs(p.x)>.62||p.y<-.05||p.y>1.12) return 0.;
      vec2 top=vec2(.05,.62);
      float m=seg(p,vec2(0.,0.),top,.05);                 // trunk
      m=max(m,seg(p,top,top+vec2(.34,.06),.028));
      m=max(m,seg(p,top,top+vec2(-.32,.08),.028));
      m=max(m,seg(p,top,top+vec2(.26,-.14),.026));
      m=max(m,seg(p,top,top+vec2(-.24,-.12),.026));
      m=max(m,seg(p,top,top+vec2(.10,.24),.026));
      m=max(m,seg(p,top,top+vec2(-.10,.22),.026));
      m=max(m,seg(p,top,top+vec2(.0,.28),.024));
      return m;
    }

    void main(){
      vec2 uv=gl_FragCoord.xy/u_res;             // 0..1
      vec2 asp=vec2(u_res.x/u_res.y,1.);
      float d=u_scroll;                           // 0 golden → 1 night
      float t=u_time*.05;
      float horizon=HORIZON;

      // ---- sky ----
      vec3 goldTop=vec3(.24,.13,.32), goldMid=vec3(.95,.42,.18), goldLow=vec3(1.,.74,.38);
      vec3 duskTop=vec3(.10,.05,.28), duskMid=vec3(.66,.16,.52), duskLow=vec3(1.,.42,.34);
      vec3 nightTop=vec3(.012,.014,.05), nightMid=vec3(.04,.06,.16), nightLow=vec3(.10,.14,.30);
      float ph1=smoothstep(0.,.55,d), ph2=smoothstep(.45,1.,d);
      vec3 top=mix(mix(goldTop,duskTop,ph1),nightTop,ph2);
      vec3 mid=mix(mix(goldMid,duskMid,ph1),nightMid,ph2);
      vec3 low=mix(mix(goldLow,duskLow,ph1),nightLow,ph2);
      float sy=clamp((uv.y-horizon)/(1.-horizon),0.,1.);
      vec3 sky=mix(low,mid,smoothstep(0.,.42,sy));
      sky=mix(sky,top,smoothstep(.3,1.,sy));

      // clouds, tinted by phase
      float cl=fbm(vec2(uv.x*3.4+t*.6,uv.y*6.-t*.2));
      sky+=vec3(1.,.6,.45)*cl*.14*(1.-ph2)*smoothstep(.2,.8,sy);

      // ---- sun: descends below horizon as you scroll ----
      vec2 sunP=vec2(.66,horizon+.34-d*.46);
      float sd=length((uv-sunP)*asp);
      vec3 sunCol=mix(vec3(1.,.78,.42),vec3(1.,.36,.22),ph1);
      float disc=smoothstep(.055,.045,sd);
      float glow=exp(-sd*5.5)*(1.-ph2*.85);
      sky+=sunCol*(disc*(1.-ph2)+glow*.9);

      // stars fade in at night
      float st=hash(floor(uv*asp*240.));
      float tw=sin(u_time*2.+st*40.)*.5+.5;
      sky+=vec3(.8,.85,1.)*step(.992,st)*tw*ph2*smoothstep(.1,.5,sy);

      vec3 col=sky;
      vec3 silDark=vec3(.022,.02,.045);
      vec3 silFar =mix(mid*.55,vec3(.05,.05,.10),.6+.3*ph2);

      // ---- far row of towers ----
      float hFar=buildings(uv.x*26.+40.,7.,.20);
      if(uv.y<horizon+hFar*.6) col=mix(col,silFar,.85);

      // ---- Burj Al Arab (left) ----
      float sl=sail(uv,.14);
      col=mix(col,mix(silFar,silDark,.5),sl);

      // ---- near row of towers (carved around landmarks) ----
      float carve=1.;
      carve*=mix(.22,1.,smoothstep(.04,.09,abs(uv.x-.14)));   // around the sail
      carve*=mix(.45,1.,smoothstep(.05,.10,abs(uv.x-.55)));   // around Burj Khalifa
      carve*=mix(.10,1.,smoothstep(.07,.13,abs(uv.x-.875)));  // around the palm island
      float cellW=18.;
      float hNear=buildings(uv.x*cellW,3.,.27)*carve;
      if(uv.y<horizon+hNear){
        vec3 bCol=silDark;
        vec2 wg=vec2(fract(uv.x*cellW*7.),fract((uv.y-horizon)*46.));
        vec2 wid=vec2(floor(uv.x*cellW*7.),floor((uv.y-horizon)*46.));
        float lit=step(.62-ph2*.34,hash(wid+floor(uv.x*cellW)*.13));
        float win=step(.25,wg.x)*step(wg.x,.75)*step(.3,wg.y)*step(wg.y,.7);
        vec3 winCol=mix(vec3(1.,.72,.38),vec3(.65,.83,1.),hash(wid*1.7));
        bCol+=winCol*win*lit*(.25+ph2*.85);
        col=bCol;
      }

      // ---- Burj Khalifa (centre-right) ----
      float bk=burj(uv,.55);
      if(bk>.01){
        vec3 bCol=silDark*.9;
        // sparse vertical light bands on the tower at night
        vec2 wg=vec2(fract(uv.x*240.),fract((uv.y-horizon)*60.));
        vec2 wid=vec2(floor(uv.x*240.),floor((uv.y-horizon)*60.));
        float lit=step(.7-ph2*.35,hash(wid));
        float win=step(.3,wg.x)*step(wg.x,.7)*step(.25,wg.y)*step(wg.y,.75);
        bCol+=vec3(1.,.8,.5)*win*lit*(.18+ph2*.8);
        col=mix(col,bCol,bk);
      }

      // ---- water with reflections ----
      if(uv.y<horizon){
        float ry=horizon+(horizon-uv.y);
        float ripple=noise(vec2(uv.x*60.,uv.y*120.-u_time*1.4))*.014;
        vec2 ruv=vec2(uv.x+ripple,ry);
        float rs=clamp((ruv.y-horizon)/(1.-horizon),0.,1.);
        vec3 rsky=mix(low,mid,smoothstep(0.,.42,rs))*.8;
        float sunStreak=exp(-abs(ruv.x-sunP.x)*14.)*(1.-ph2*.8);
        rsky+=sunCol*sunStreak*.7*exp(-(horizon-uv.y)*5.);
        // Burj Khalifa light column on the water at night
        rsky+=vec3(1.,.75,.45)*exp(-abs(ruv.x-.55)*30.)*ph2*.5*exp(-(horizon-uv.y)*7.);
        float litSmear=noise(vec2(ruv.x*140.,uv.y*30.+u_time*.5));
        rsky+=vec3(1.,.7,.4)*litSmear*.12*(0.3+ph2*.9);
        float depth=smoothstep(horizon,0.,uv.y);
        col=mix(rsky,vec3(.01,.015,.04),depth*.7);
      }

      // ---- Palm Jumeirah island (right) — low sandbar + palms ----
      float islX=abs(uv.x-.875);
      float islTop=horizon+.012*(1.-smoothstep(.0,.105,islX));
      if(uv.y<islTop && uv.y>horizon-.05) col=mix(col,silDark,.95);
      float pm=palm(uv,vec2(.815,horizon+.008),.085);
      pm=max(pm,palm(uv,vec2(.875,horizon+.010),.105));
      pm=max(pm,palm(uv,vec2(.935,horizon+.007),.08));
      col=mix(col,silDark,pm);

      // haze + vignette + grain
      col+=vec3(1.,.5,.3)*exp(-abs(uv.y-horizon)*9.)*.16*(1.-ph2*.8);
      vec2 c=(gl_FragCoord.xy-.5*u_res)/u_res.y;
      col*=smoothstep(1.45,.4,length(c));
      col+=(hash(gl_FragCoord.xy+fract(u_time)*100.)-.5)*.045;
      col=pow(max(col,0.),vec3(.95));
      gl_FragColor=vec4(col,1.);
    }
  `;

  /* ---------- raw WebGL fullscreen-quad scene ---------- */
  function glScene(canvas, fragSrc) {
    window.__glCount = (window.__glCount || 0) + 1;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return null;

    function sh(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[cinema] shader error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return null; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uScroll = gl.getUniformLocation(prog, 'u_scroll');
    const uPoint = gl.getUniformLocation(prog, 'u_point');

    let scroll = 0, raf = null, t0 = performance.now(), needResize = true;
    let px = 0, py = 0;   // smoothed — the light glides, it doesn't snap

    // resize reads layout (clientWidth) — kept OUT of the per-frame loop
    // so we never force a reflow 60×/sec; only on actual viewport changes.
    function resize() {
      let w = Math.floor(canvas.clientWidth * DPR);
      let h = Math.floor(canvas.clientHeight * DPR);
      if (w > MAX_BUF) { h = Math.round(h * (MAX_BUF / w)); w = MAX_BUF; }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      needResize = false;
    }
    addEventListener('resize', () => { needResize = true; }, { passive: true });
    addEventListener('orientationchange', () => { needResize = true; }, { passive: true });

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (needResize) resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform1f(uScroll, scroll);
      px += (POINT.x - px) * .035; py += (POINT.y - py) * .035;
      if (uPoint) gl.uniform2f(uPoint, px, py);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    return {
      setProgress(p) { scroll = p; canvas.dataset.p = p.toFixed(3); },
      setActive(on) {
        canvas.dataset.active = on;
        if (on) { needResize = true; if (raf === null) raf = requestAnimationFrame(frame); }
        else if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      }
    };
  }

  /* ---------- frame-sequence scrubber (Higgsfield drop-in) ---------- */
  function frameScene(canvas, base, manifest) {
    const ctx = canvas.getContext('2d');
    const count = manifest.count;
    const pad = manifest.pad || 4;
    const pattern = manifest.pattern || 'frame_%d.jpg';
    const imgs = new Array(count);
    let progress = 0, active = false, raf = null;

    function src(i) {
      const n = String(i + 1).padStart(pad, '0');
      return base + pattern.replace('%d', n);
    }
    function load(i) {
      if (imgs[i]) return;
      const im = new Image();
      im.src = src(i);
      im.onload = () => { if (i === 0) draw(); };
      imgs[i] = im;
    }
    load(0); load(count - 1);
    let li = 0;
    (function loadNext() {
      if (li < count) { load(li++); setTimeout(loadNext, 24); }
    })();

    function draw() {
      const w = Math.floor(canvas.clientWidth * DPR), h = Math.floor(canvas.clientHeight * DPR);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      let idx = Math.min(count - 1, Math.floor(progress * (count - 1)));
      while (idx > 0 && (!imgs[idx] || !imgs[idx].complete || !imgs[idx].naturalWidth)) idx--;
      const im = imgs[idx];
      if (!im || !im.complete || !im.naturalWidth) return;
      const cr = w / h, ir = im.naturalWidth / im.naturalHeight;
      let dw, dh;
      if (ir > cr) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
      ctx.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
    function frame() { raf = requestAnimationFrame(frame); draw(); }
    return {
      setProgress(p) { progress = p; canvas.dataset.p = p.toFixed(3); if (!active) draw(); },
      setActive(on) {
        active = on; canvas.dataset.active = on;
        if (on && raf === null) raf = requestAnimationFrame(frame);
        else if (!on && raf !== null) { cancelAnimationFrame(raf); raf = null; }
      }
    };
  }

  /* ---------- public factory ----------
     Tries assets/frames/<name>/manifest.json first (real Higgsfield
     clip sliced to frames); falls back to the procedural shader. */
  const FRAGS = { hero: HERO_FRAG, dubai: DUBAI_FRAG };

  window.YKSCinema = {
    async create(name, canvas) {
      const base = 'assets/frames/' + name + '/';
      try {
        const res = await fetch(base + 'manifest.json', { cache: 'no-store' });
        if (res.ok) {
          const manifest = await res.json();
          if (manifest && manifest.count > 1) {
            console.info('[cinema] "' + name + '": using Higgsfield frame sequence (' + manifest.count + ' frames)');
            return frameScene(canvas, base, manifest);
          }
        }
      } catch (e) { /* no frames shipped — procedural path */ }
      const scene = glScene(canvas, FRAGS[name]);
      if (scene) { console.info('[cinema] "' + name + '": procedural shader'); return scene; }
      canvas.style.background = 'radial-gradient(120% 100% at 50% 20%, #2a1140, #07060a)';
      return { setProgress() {}, setActive() {} };
    }
  };
})();
