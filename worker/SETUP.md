# AI chatbot — zero-cost setup (~10 minutes)

Your site is static hosting, so it can't keep a secret. If an AI API key sat in the
page, anyone could view-source it and spend your money. So the chatbot's brain lives
in a **Cloudflare Worker** — a tiny free serverless function that holds the key and
talks to the AI for you.

**Cost: zero.** The default setup uses **Cloudflare Workers AI**, which runs the model
on Cloudflare's own free daily allowance. No credit card, no external API key.

---

## Step 1 — Create a Cloudflare account (2 min)

1. Go to **https://dash.cloudflare.com/sign-up**
2. Sign up with your email (free plan — no card needed)
3. Verify your email

> You do **not** need to move your domain to Cloudflare. The Worker is standalone.

---

## Step 2 — Create the Worker (3 min)

1. In the dashboard sidebar: **Compute (Workers)** → **Workers & Pages**
2. Click **Create** → **Start with Hello World!** → **Deploy**
3. Name it something like `yks-chat` (this becomes your URL)
4. After it deploys, click **Edit code**
5. Delete everything in the editor
6. Open `worker/yks-chat-worker.js` from your site folder, copy **all** of it, paste it in
7. Click **Deploy**

Your Worker URL will look like:
`https://yks-chat.<your-subdomain>.workers.dev`

**Copy that URL — you need it in Step 4.**

---

## Step 3 — Turn on the free AI (2 min)

The Worker needs permission to use Cloudflare's AI models.

1. Still in your Worker → **Settings** → **Bindings**
2. Click **Add** → choose **Workers AI**
3. Set **Variable name** to exactly: `AI`
4. **Deploy**

That's the zero-cost brain connected.

### Optional but recommended — stop abuse burning your free allowance
1. Sidebar → **Storage & Databases** → **KV** → **Create a namespace**, call it `yks-chat-kv`
2. Back in your Worker → **Settings** → **Bindings** → **Add** → **KV namespace**
3. Variable name: `CHAT_KV` → select `yks-chat-kv` → **Deploy**

This caps each visitor at 30 messages/day so a bot can't drain your quota.

---

## Step 4 — Switch it on (1 min)

1. Open `js/chat-config.js` in your site folder
2. Paste your Worker URL:
   ```js
   window.YKS_CHAT_ENDPOINT = 'https://yks-chat.your-subdomain.workers.dev';
   ```
3. Save, commit and push (or just send me the URL and I'll do it)

The chat bubble appears on every page within minutes. Until you do this, the widget
stays completely hidden — nothing on the site looks broken.

---

## Want better answers later? (optional)

The free Cloudflare model is good but not brilliant. Two upgrade paths — the Worker
already supports both, you only add a secret:

**Google Gemini — also has a free tier**
1. Get a key at **https://aistudio.google.com/apikey**
2. Worker → **Settings** → **Variables and Secrets** → **Add**
3. Name: `GEMINI_API_KEY`, type **Secret**, paste the key → **Deploy**

**Claude — paid, best quality**
1. Get a key at **https://console.anthropic.com** (add billing)
2. Same steps, name it `ANTHROPIC_API_KEY`

The Worker automatically uses the best one available: Claude → Gemini → Workers AI.
Remove the secret to fall back.

---

## Testing it

Open your site, click the chat bubble (bottom right, above the WhatsApp button) and ask
something like *"do you shoot real estate video in Dubai?"*.

**If it says it can't connect:** check the Worker URL in `chat-config.js` matches exactly,
and that the `AI` binding in Step 3 is named exactly `AI`.

**To watch it live:** Worker → **Logs** → **Begin log stream**, then send a message.

---

## What the bot will and won't do

It's been given your real business facts — gear, experience, clients, delivery times,
locations — and strict rules:

- ❌ **Never quotes a price.** Every project is individually quoted; it collects the
  brief and sends people to WhatsApp or `/quote.html`.
- ❌ **Never claims drone/aerial work.** It states plainly that you don't fly drones.
- ❌ **Never invents** clients, credits, stats or availability.
- ✅ Answers gear, process, delivery, locations and service questions.
- ✅ Gathers what/where/when and pushes toward a booking conversation.

To change what it knows or says, edit `SYSTEM_PROMPT` near the top of
`worker/yks-chat-worker.js`, then redeploy.
