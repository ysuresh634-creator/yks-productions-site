const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ok  = d => new Response(JSON.stringify(d),     { headers: { ...CORS, 'Content-Type': 'application/json' } });
const err = (m, s=500) => new Response(JSON.stringify({ error: m }), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response('', { headers: CORS });
    if (request.method !== 'POST') return err('POST only', 405);

    const body = await request.json().catch(() => null);
    if (!body?.type) return err('Missing type', 400);

    const key = env.GEMINI_API_KEY;
    if (!key) return err('GEMINI_API_KEY secret not set. Run: wrangler secret put GEMINI_API_KEY', 500);

    if (body.type === 'invoice_ai') return invoiceAI(body, key);
    if (body.type === 'website_edit') return websiteEdit(body, key);
    return err('Unknown type', 400);
  },
};

// ── Invoice AI ────────────────────────────────────────────────────────────
async function invoiceAI({ context, message }, key) {
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
  if (!res.ok) return err(data.error?.message || 'Gemini error');

  const parts = data.candidates?.[0]?.content?.parts || [];
  const toolCalls = [];
  let text = '';
  for (const p of parts) {
    if (p.text) text += p.text;
    if (p.functionCall) toolCalls.push({ name: p.functionCall.name, input: p.functionCall.args || {} });
  }
  return ok({ text: text || null, tool_calls: toolCalls });
}

// ── Website Edit ──────────────────────────────────────────────────────────
async function websiteEdit({ file_path, instruction, file_content }, key) {
  const prompt = `You are editing HTML files for yksproductions.com — the portfolio website of Yedukrishna Suresh (YKS Productions), a cinematographer/photographer in Bangalore and Dubai.

File: ${file_path}
Instruction: ${instruction}

Return ONLY a raw JSON object — no markdown, no code fences, nothing else. Exact format:
{"edits":[{"find":"exact verbatim text to find","replace":"replacement text"},...],"commit_message":"short description"}

Rules:
- "find" must exist VERBATIM in the file including whitespace/indentation
- Make minimal changes — do not rewrite whole sections unless explicitly asked
- Preserve all surrounding HTML, scripts, and styles

File content:
${file_content}`;

  const res = await fetch(`${GEMINI}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return err(data.error?.message || `Gemini HTTP ${res.status}`);
  }

  const data = await res.json();
  let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Strip markdown code fences if present
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    return ok(JSON.parse(raw));
  } catch {
    return err('AI response was not valid JSON: ' + raw.slice(0, 300));
  }
}
