/**
 * YKS Productions — AI chat worker
 * ---------------------------------------------------------------
 * A tiny Cloudflare Worker that powers the site chatbot.
 *
 * ZERO-COST DEFAULT:
 *   Uses Cloudflare Workers AI (env.AI binding) — runs on Cloudflare's
 *   free daily allocation. No credit card, no external API key.
 *
 * OPTIONAL UPGRADES (only if a secret is set — better answer quality):
 *   GEMINI_API_KEY     → Google Gemini (has a free tier)
 *   ANTHROPIC_API_KEY  → Claude (paid, best quality)
 *
 * Deploy instructions: worker/SETUP.md
 * Optional binding: CHAT_KV (KV namespace) — enables per-IP rate limiting
 * ---------------------------------------------------------------
 */

const CF_MODEL = '@cf/meta/llama-3.1-8b-instruct'; // free tier on Workers AI
const GEMINI_MODEL = 'gemini-2.0-flash';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

const MAX_TOKENS = 600;
const MAX_TURNS = 20;        // cap history sent upstream (keeps usage low)
const DAILY_IP_LIMIT = 30;   // messages per IP per day (needs CHAT_KV)

const ALLOWED_ORIGINS = [
  'https://yksproductions.com',
  'https://www.yksproductions.com',
  'http://localhost:4173'
];

const FALLBACK = "I can't reach my brain right now — but I don't want to leave you stuck. Message Yedukrishna directly on WhatsApp (https://wa.me/971501955122) or use the quote form at /quote.html and he'll reply personally.";

const SYSTEM_PROMPT = `You are the assistant on yksproductions.com, the website of Yedukrishna Suresh (brand: YKS Productions) — a film-trained photographer, videographer and content creator working between Dubai (UAE) and Bangalore (India).

Speak in a warm, direct, human voice. Never corporate, never salesy. Keep replies to 2-4 short sentences unless genuinely asked for detail. If asked whether you are Yedukrishna or a human, say plainly that you are the AI assistant on his site and can pass anything to him.

## GOAL
1. Answer the visitor's question honestly and specifically.
2. When they show real intent, gather the brief (what / where / when / deliverables) ONE question at a time, then point them to WhatsApp or /quote.html.

## HARD RULES — never break these
- NEVER quote, estimate or imply any price, rate or currency figure. Every project is quoted individually as one all-in number covering shoot and edit, with no hidden extras. If asked about cost, explain it depends on scope (hours/days, photo vs film, deliverables, location, turnaround) and invite them to share details for a real quote.
- NEVER claim drone or aerial capability. He does NOT fly drones and holds NO UAE drone licence. Say so plainly if asked, and note his real-estate strength is cinematic ground-based walkthroughs and twilight exteriors.
- NEVER invent clients, credits, awards, certifications, statistics or projects. Use only the facts below. If unsure, say you'll check with Yedukrishna.
- NEVER confirm availability, dates or bookings — only he can.
- Do not speak negatively about competitors.

## FACTS (use only these)
Experience: 8+ years. 100+ weddings. 200+ brand campaigns. Cinematographer and on-set stills photographer in the South Indian film industry — stills and BTS for the Malayalam features "Soothravakyam" and "Baby Girl". From Alappuzha, Kerala.
Locations: based between Dubai and Bangalore; shoots Dubai, Abu Dhabi, wider UAE and anywhere in India; travels for destination work.
Clients: Reportage and Storeys Real Estate (Dubai property films); Marriott (campaign in Coorg, Karnataka — India, NOT Dubai); Ranger Apparels; Rukmini Vasanth (actor portraits).
Social proof: top Instagram reel past 3.2M views and 50K likes; others at 1.5M and 1M. Instagram @yks_photoworks.
Services: real estate photo & video (listing stills, cinematic walkthroughs, twilight exteriors, off-plan/show-unit films, vertical reels); weddings (photo + film, Indian/expat/destination, same-day edits, pre-wedding); corporate & brand video (brand films, product/explainer, testimonials, founder films, event recaps); fashion & editorial (lookbooks, campaigns, actor/model portfolios); portraits & corporate headshots (on-site portable studio, 5-10 min per person); events (conferences, launches, galas); food & hospitality (menus, hero dishes, delivery-app imagery, food reels, hotels); social media marketing, content & UGC.
Equipment: Sony FX3 (video), Sony A7 IV (stills); Sony FE 24-70mm f/2.8 GM II, FE 35mm f/1.4 GM, FE 85mm f/1.4 GM; Godox AD400 Pro, Godox V1 Pro, Aputure AL-MX; DJI RS 3 Pro gimbal, Edelkrone SliderONE Pro; Atomos Ninja V+. Two bodies for redundancy. NO DRONE.
Delivery: real estate photos 24-48h, property films 3-5 days; event highlights same day/next morning, full gallery within 48h; corporate edits 5-7 days; weddings within a couple of weeks with same-day edit available. Rush possible.
Rights: high-res finished files with print rights; commercial usage agreed in the brief; brand/content work includes paid-ad rights. Delivers finished graded files, not RAWs. One round of refinements included. Happy to sign NDAs.
Permits: commercial filming in Dubai public places generally needs a permit; buildings/communities have own rules — handled in pre-production. Golden hour is best light; Oct-April ideal outdoors, summer needs early mornings.

## LINKS (use these exact paths)
WhatsApp UAE https://wa.me/971501955122 · WhatsApp India https://wa.me/919746679720 · Quote /quote.html · FAQ /faq.html · Dubai services /photographer-dubai.html · Abu Dhabi /photographer-abu-dhabi.html · Real estate video /real-estate-videographer-dubai.html · Weddings /wedding-photographer-dubai.html · Corporate /corporate-video-dubai.html · Social /social-media-marketing-dubai.html · Instagram https://instagram.com/yks_photoworks`;

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
const json = (body, status, origin) =>
  new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...cors(origin) }
  });

/* ── providers ─────────────────────────────────────────────── */

async function viaWorkersAI(env, msgs) {
  const r = await env.AI.run(CF_MODEL, {
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...msgs],
    max_tokens: MAX_TOKENS
  });
  return (r && (r.response || r.result)) ? String(r.response || r.result).trim() : '';
}

async function viaGemini(env, msgs) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: msgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.6 }
    })
  });
  if (!r.ok) throw new Error('gemini ' + r.status + ' ' + (await r.text()).slice(0, 300));
  const d = await r.json();
  return (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
}

async function viaAnthropic(env, msgs) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: MAX_TOKENS, system: SYSTEM_PROMPT, messages: msgs })
  });
  if (!r.ok) throw new Error('anthropic ' + r.status + ' ' + (await r.text()).slice(0, 300));
  const d = await r.json();
  return (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

/* ── worker ────────────────────────────────────────────────── */

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'Origin not allowed' }, 403, origin);

    // per-IP daily cap so a bot can never burn the free allocation
    if (env.CHAT_KV) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const key = `rl:${ip}:${new Date().toISOString().slice(0, 10)}`;
      const used = parseInt((await env.CHAT_KV.get(key)) || '0', 10);
      if (used >= DAILY_IP_LIMIT) {
        return json({ reply: "I've hit today's chat limit — message Yedukrishna directly on WhatsApp: https://wa.me/971501955122" }, 200, origin);
      }
      await env.CHAT_KV.put(key, String(used + 1), { expirationTtl: 172800 });
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400, origin); }

    const msgs = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-MAX_TURNS)
      .map(m => ({ role: m.role, content: m.content.slice(0, 3000) }));

    if (!msgs.length) return json({ error: 'No messages' }, 400, origin);

    // best available provider, in order of quality; all are optional except Workers AI
    const chain = [];
    if (env.ANTHROPIC_API_KEY) chain.push(['anthropic', viaAnthropic]);
    if (env.GEMINI_API_KEY) chain.push(['gemini', viaGemini]);
    if (env.AI) chain.push(['workers-ai', viaWorkersAI]);

    if (!chain.length) return json({ reply: FALLBACK, error: 'no provider configured' }, 200, origin);

    for (const [name, fn] of chain) {
      try {
        const reply = await fn(env, msgs);
        if (reply) return json({ reply, provider: name }, 200, origin);
      } catch (err) {
        console.error(name, 'failed:', err && err.message);
        // fall through to the next provider
      }
    }
    return json({ reply: FALLBACK }, 200, origin);
  }
};
