const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

const ALLOWED_ORIGINS = [
  'https://yksproductions.com',
  'https://www.yksproductions.com',
];

const MAX_BODY = 256 * 1024; // the invoice form is tiny; anything larger is abuse

const cors = origin => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
});

const ok  = (d, o) => new Response(JSON.stringify(d), { headers: { ...cors(o), 'Content-Type': 'application/json' } });
const err = (m, s, o) => new Response(JSON.stringify({ error: m }), { status: s || 500, headers: { ...cors(o), 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return new Response('', { headers: cors(origin) });
    if (request.method !== 'POST') return err('POST only', 405, origin);

    // Only the Studio may call this. Not airtight against a crafted client,
    // but this Worker can no longer write anything — worst case is Gemini quota,
    // which is hard-capped by the free tier.
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return err('Forbidden origin', 403, origin);

    const len = Number(request.headers.get('Content-Length') || 0);
    if (len > MAX_BODY) return err('Request too large', 413, origin);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return err('Request too large', 413, origin);

    let body;
    try { body = JSON.parse(raw); } catch { return err('Invalid JSON', 400, origin); }
    if (!body || !body.type) return err('Missing type', 400, origin);

    const key = env.GEMINI_API_KEY;
    if (!key) return err('GEMINI_API_KEY secret not set', 500, origin);

    if (body.type === 'invoice_ai') return invoiceAI(body, key, origin);
    return err('Unknown type', 400, origin);
  },
};

// ── Invoice AI ────────────────────────────────────────────────────────────
async function invoiceAI({ context, message }, key, origin) {
  const sys = `You are a smart assistant in YKS Studio, editing invoices and quotations for Yedukrishna Suresh (YKS Productions), a cinematographer and photographer in Bangalore/Dubai. Current document state: ${JSON.stringify(context)}. Use tools to edit the form. Currency is INR. Items use 0-based indexing. Be brief.`;

  const functions = [
    { name:'add_item',   description:'Add a line item/service', parameters:{ type:'OBJECT', properties:{ description:{type:'STRING'}, rate:{type:'NUMBER'} }, required:['description','rate'] } },
    { name:'remove_item',description:'Remove line item by 0-based index', parameters:{ type:'OBJECT', properties:{ index:{type:'INTEGER'} }, required:['index'] } },
    { name:'update_item',description:'Update item description/rate by 0-based index', parameters:{ type:'OBJECT', properties:{ index:{type:'INTEGER'}, description:{type:'STRING'}, rate:{type:'NUMBER'} }, required:['index'] } },
    { name:'set_client', description:'Set client name, phone, event', parameters:{ type:'OBJECT', properties:{ name:{type:'STRING'}, phone:{type:'STRING'}, event:{type:'STRING'} } } },
    { name:'set_advance',description:'Set advance percentage', parameters:{ type:'OBJECT', properties:{ pct:{type:'NUMBER'} }, required:['pct'] } },
    { name:'set_notes',  description:'Set notes field', parameters:{ type:'OBJECT', properties:{ text:{type:'STRING'} }, required:['text'] } },
    { name:'set_type',   description:'Switch document to INVOICE or QUOTATION', parameters:{ type:'OBJECT', properties:{ type:{type:'STRING', enum:['INVOICE','QUOTATION']} }, required:['type'] } },
    { name:'clear_items',description:'Remove all items', parameters:{ type:'OBJECT', properties:{} } },
  ];

  const res = await fetch(`${GEMINI}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: sys }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      tools: [{ function_declarations: functions }],
      tool_config: { function_calling_config: { mode: 'AUTO' } },
    }),
  });

  const data = await res.json();
  if (!res.ok) return err(data.error?.message || 'Gemini error', 502, origin);

  const parts = data.candidates?.[0]?.content?.parts || [];
  const toolCalls = [];
  let text = '';
  for (const p of parts) {
    if (p.text) text += p.text;
    if (p.functionCall) toolCalls.push({ name: p.functionCall.name, input: p.functionCall.args || {} });
  }
  return ok({ text: text || null, tool_calls: toolCalls }, origin);
}
