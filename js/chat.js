/* ═══════════════════════════════════════════════════════════════
   IRIS — the YKS Productions assistant
   ───────────────────────────────────────────────────────────────
   Named after the ring of blades inside a lens that opens and
   closes to let light in.

   Renders ONE labelled control (not three anonymous circles) and
   absorbs the WhatsApp + call shortcuts into the same bar, so the
   corner reads as a single toolbar with a clear primary action.

   Talks to the Cloudflare Worker (worker/yks-chat-worker.js) so the
   API key is never in the browser. Activate by setting the endpoint
   in js/chat-config.js. If it's empty the widget doesn't render and
   landing.js keeps its own WhatsApp/call buttons — nothing breaks.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var EP = (window.YKS_CHAT_ENDPOINT || '').trim();
  if (!EP) return;                          // not configured — stay invisible
  if (document.querySelector('.yc-bar')) return;

  var BOT = 'Iris';

  /* Dubai pages carry the UAE number, India pages the Indian one. */
  var waLink = document.querySelector('a[href*="wa.me/"]');
  var NUM = (document.body && document.body.getAttribute('data-wa'))
         || (waLink && (waLink.href.match(/wa\.me\/(\d+)/) || [])[1])
         || '971501955122';
  var WA_URL = 'https://wa.me/' + NUM + '?text='
             + encodeURIComponent("Hi Yedukrishna, I'd like to enquire about a shoot.");

  /* ── languages ─────────────────────────────────────────────────
     Iris answers in whatever the visitor writes. These just decide
     how she OPENS — worth getting right, since a Gulf or Kerala
     visitor landing on a Malayalam or Arabic hello converts very
     differently to one landing on English. */
  var L10N = {
    en: {
      greet: "Hey — I'm " + BOT + ". I help Yedukrishna work out what a shoot needs.\n\nWhat are you planning?",
      tease: "Hi, I'm <b>" + BOT + "</b> — planning a shoot? Ask me anything.",
      ph: 'Tell ' + BOT + ' what you’re planning…',
      openers: ['What does a shoot cost?', 'I need a property video in Dubai',
                'Photos for my wedding', 'What gear does he shoot on?']
    },
    ar: {
      greet: 'أهلاً — أنا ' + 'آيريس' + '. أساعد يدوكريشنا في تجهيز التصوير وفهم احتياجات كل مشروع.\n\nشو ناوي تصوّر؟',
      tease: 'أنا <b>آيريس</b> — عندك تصوير في بالك؟ اسألني أي شي.',
      ph: 'اكتب لي شو ناوي تصوّر…',
      openers: ['كم تكلفة التصوير؟', 'فيديو عقاري في دبي', 'تصوير أعراس', 'شو الكاميرات اللي يستخدمها؟']
    },
    ml: {
      greet: 'ഹായ് — ഞാൻ ഐറിസ്. യദുകൃഷ്ണന്റെ ഷൂട്ടുകൾ പ്ലാൻ ചെയ്യാൻ ഞാൻ സഹായിക്കും.\n\nഎന്താണ് മനസ്സിലുള്ളത്?',
      tease: 'ഞാൻ <b>ഐറിസ്</b> — ഒരു ഷൂട്ട് പ്ലാൻ ചെയ്യുന്നുണ്ടോ? എന്തും ചോദിക്കാം.',
      ph: 'എന്താണ് പ്ലാൻ എന്ന് പറയൂ…',
      openers: ['ഷൂട്ടിന് എത്ര ചെലവാകും?', 'ദുബായിൽ പ്രോപ്പർട്ടി വീഡിയോ',
                'വിവാഹ ഫോട്ടോഗ്രഫി', 'ഏത് ക്യാമറയാണ് ഉപയോഗിക്കുന്നത്?']
    },
    hi: {
      greet: 'नमस्ते — मैं आइरिस हूँ। यदुकृष्ण के शूट प्लान करने में मदद करती हूँ।\n\nआप क्या सोच रहे हैं?',
      tease: 'मैं <b>आइरिस</b> — कोई शूट प्लान कर रहे हैं? कुछ भी पूछिए।',
      ph: 'बताइए क्या प्लान कर रहे हैं…',
      openers: ['शूट का खर्च कितना है?', 'दुबई में प्रॉपर्टी वीडियो',
                'शादी की फोटोग्राफी', 'कौन सा कैमरा इस्तेमाल करते हैं?']
    },
    kn: {
      greet: 'ಹಾಯ್ — ನಾನು ಐರಿಸ್. ಯದುಕೃಷ್ಣ ಅವರ ಶೂಟ್ ಪ್ಲಾನ್ ಮಾಡೋಕೆ ಸಹಾಯ ಮಾಡ್ತೀನಿ.\n\nಏನು ಪ್ಲಾನ್ ಮಾಡ್ತಾ ಇದೀರಾ?',
      tease: 'ನಾನು <b>ಐರಿಸ್</b> — ಶೂಟ್ ಪ್ಲಾನ್ ಮಾಡ್ತಾ ಇದೀರಾ? ಏನಾದ್ರೂ ಕೇಳಿ.',
      ph: 'ಏನು ಪ್ಲಾನ್ ಅಂತ ಹೇಳಿ…',
      openers: ['ಶೂಟ್‌ಗೆ ಎಷ್ಟು ಖರ್ಚಾಗುತ್ತೆ?', 'ಬೆಂಗಳೂರಿನಲ್ಲಿ ಪ್ರಾಪರ್ಟಿ ವೀಡಿಯೊ',
                'ಮದುವೆ ಫೋಟೋಗ್ರಫಿ', 'ಯಾವ ಕ್ಯಾಮೆರಾ ಬಳಸ್ತಾರೆ?']
    }
  };
  var LANG = (navigator.language || 'en').slice(0, 2).toLowerCase();
  var T = L10N[LANG] || L10N.en;

  var GREET = T.greet;
  var OPENERS = T.openers;

  /* Nobody in Bangalore browses with a Kannada locale — so the only way
     people discover they can type Manglish/Hinglish/Kanglish is if we
     tell them. This strip is the invitation. */
  var LANG_STRIP = 'മലയാളം · हिन्दी · ಕನ್ನಡ · العربية — or just type however you talk';

  /* Follow-ups offered after each reply, picked on what was just discussed.
     Keeps the conversation moving instead of leaving a dead empty box. */
  var FOLLOWUPS = [
    { k: /real estate|propert|villa|apartment|listing|off.plan|walkthrough|twilight/i,
      c: ['How long does it take?', 'Can you shoot a furnished unit?', '→ Get a quote'] },
    { k: /wedding|mehndi|haldi|sangeet|reception|bride|groom|nikah/i,
      c: ['Do you travel for weddings?', 'Photo and film both?', '→ Get a quote'] },
    { k: /headshot|portrait|team|linkedin/i,
      c: ['Can you come to our office?', 'How long per person?', '→ Get a quote'] },
    { k: /food|menu|restaurant|dish|hotel|hospitality/i,
      c: ['Do you shoot on location?', 'Delivery-app images too?', '→ Get a quote'] },
    { k: /reel|instagram|social|content|ugc|campaign/i,
      c: ['How many reels a month?', 'Do you write the concept?', '→ Get a quote'] },
    { k: /model|talent|casting|expat/i,
      c: ['Can you source talent?', 'Hair and makeup too?', '→ Get a quote'] },
    { k: /gear|camera|lens|sony|godox|light|equipment/i,
      c: ['Do you shoot 4K?', 'What about low light?', 'See his work'] },
    { k: /cost|price|charge|budget|rate|quote|aed|rupee|\$/i,
      c: ['What changes the cost?', '→ Get a quote', '→ WhatsApp him'] },
    { k: /wedding|event|conference|launch|gala|party/i,
      c: ['Same-day highlights?', 'How many hours?', '→ Get a quote'] },
    { k: /film|movie|soothravakyam|baby girl|cinema|bts|stills/i,
      c: ['What did he shoot on set?', 'See his work', '→ Get a quote'] },
    { k: /bangalore|bengaluru|india|kerala|coorg/i,
      c: ['Does he travel in India?', 'What does he shoot there?', '→ Get a quote'] }
  ];
  var DEFAULT_FOLLOWUPS = ['How does a shoot work?', 'See his work', '→ Get a quote'];

  /* Chips beginning with → are actions, not messages. */
  var ACTIONS = {
    '→ Get a quote': '/quote.html',
    '→ WhatsApp him': WA_URL,
    'See his work': 'https://www.instagram.com/yks_photoworks/'
  };

  /* ── the aperture mark ─────────────────────────────────────── */
  var APERTURE =
      '<svg class="yc-ap" viewBox="0 0 100 100" aria-hidden="true">'
    + '<circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="7"/>'
    + '<path d="M50 30 67.3 40 67.3 60 50 70 32.7 60 32.7 40Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>'
    + '<g stroke="currentColor" stroke-width="6" stroke-linecap="round">'
    + '<path d="M50 30 83.6 26.5"/><path d="M67.3 40 87.2 67.3"/><path d="M67.3 60 53.6 90.8"/>'
    + '<path d="M50 70 16.4 73.5"/><path d="M32.7 60 12.8 32.7"/><path d="M32.7 40 46.4 9.2"/>'
    + '</g></svg>';

  var WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.413c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';
  var TEL_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';

  /* ── styles ────────────────────────────────────────────────── */
  var css = ''
    /* one toolbar, clear hierarchy: two quiet circles + one loud pill */
    + '.yc-bar{position:fixed;right:18px;bottom:18px;z-index:301;display:flex;align-items:center;gap:9px;'
    + 'font-family:Inter,system-ui,-apple-system,sans-serif}'
    + '.yc-bar.hide{display:none}'
    + '.yc-mini{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
    + 'background:rgba(18,15,24,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);'
    + 'border:1px solid rgba(244,237,226,.18);box-shadow:0 6px 20px rgba(0,0,0,.4);'
    + 'transition:transform .25s cubic-bezier(.22,.61,.36,1),border-color .25s,color .25s}'
    + '.yc-mini svg{width:19px;height:19px;display:block}'
    + '.yc-mini.wa{color:#25D366}.yc-mini.tel{color:#ff8c3b}'
    + '.yc-mini:hover{transform:translateY(-2px);border-color:currentColor}'
    + '.yc-pill{display:flex;align-items:center;gap:9px;height:52px;padding:0 20px 0 8px;border:0;cursor:pointer;'
    + 'border-radius:30px;background:linear-gradient(135deg,#ff8c3b,#ffc9a3);color:#07060a;'
    + 'box-shadow:0 10px 30px rgba(255,140,59,.34),0 4px 14px rgba(0,0,0,.34);'
    + 'font-family:inherit;font-size:14.5px;font-weight:600;letter-spacing:.01em;white-space:nowrap;'
    + 'transition:transform .25s cubic-bezier(.22,.61,.36,1),box-shadow .25s}'
    + '.yc-pill:hover{transform:translateY(-2px);box-shadow:0 14px 38px rgba(255,140,59,.46),0 4px 14px rgba(0,0,0,.34)}'
    + '.yc-pill .yc-mark{width:36px;height:36px;border-radius:50%;background:rgba(7,6,10,.14);'
    + 'display:flex;align-items:center;justify-content:center;flex:none}'
    + '.yc-pill .yc-ap{width:21px;height:21px;display:block;animation:ycSpin 26s linear infinite}'
    + '@keyframes ycSpin{to{transform:rotate(360deg)}}'
    /* the invitation — the thing that makes it discoverable at all */
    + '.yc-tease{position:fixed;right:18px;bottom:82px;z-index:301;max-width:min(268px,calc(100vw - 36px));'
    + 'background:#14111c;border:1px solid rgba(255,140,59,.34);border-radius:16px 16px 4px 16px;'
    + 'padding:13px 34px 13px 15px;color:#f4ede2;font-family:Inter,system-ui,sans-serif;font-size:13px;line-height:1.5;'
    + 'box-shadow:0 18px 44px rgba(0,0,0,.5);cursor:pointer;opacity:0;transform:translateY(10px) scale(.96);'
    + 'transition:opacity .4s ease,transform .4s cubic-bezier(.22,.61,.36,1)}'
    + '.yc-tease.on{opacity:1;transform:none}'
    + '.yc-tease b{color:#ff8c3b;font-weight:600}'
    + '.yc-tease .yc-tx{position:absolute;top:5px;right:7px;background:none;border:0;color:rgba(244,237,226,.45);'
    + 'font-size:17px;line-height:1;cursor:pointer;padding:3px 5px}'
    + '.yc-tease .yc-tx:hover{color:#ff8c3b}'
    /* panel */
    + '.yc-panel{position:fixed;right:18px;bottom:18px;z-index:302;width:min(392px,calc(100vw - 36px));'
    + 'height:min(600px,calc(100vh - 110px));background:rgba(13,11,18,.95);'
    + '-webkit-backdrop-filter:blur(26px);backdrop-filter:blur(26px);'
    + 'border:1px solid rgba(244,237,226,.14);border-radius:20px;display:none;flex-direction:column;overflow:hidden;'
    + 'box-shadow:0 34px 90px rgba(0,0,0,.66);font-family:Inter,system-ui,-apple-system,sans-serif}'
    + '.yc-panel.on{display:flex;animation:ycIn .34s cubic-bezier(.22,.61,.36,1)}'
    + '@keyframes ycIn{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}'
    + '.yc-head{display:flex;align-items:center;gap:11px;padding:14px 12px 14px 16px;'
    + 'border-bottom:1px solid rgba(244,237,226,.1);background:linear-gradient(180deg,rgba(255,140,59,.09),transparent)}'
    + '.yc-av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#ff8c3b,#ffc9a3);color:#07060a;'
    + 'display:flex;align-items:center;justify-content:center;flex:none}'
    + '.yc-av .yc-ap{width:22px;height:22px;display:block}'
    + '.yc-ttl{flex:1;min-width:0}'
    + '.yc-ttl b{display:block;font-family:"Playfair Display",Georgia,serif;font-size:17px;color:#f4ede2;font-weight:600;line-height:1.15}'
    + '.yc-ttl span{display:flex;align-items:center;gap:5px;font-size:11px;color:rgba(244,237,226,.5);margin-top:2px}'
    + '.yc-ttl span i{width:6px;height:6px;border-radius:50%;background:#1fd6c9;display:block;flex:none}'
    + '.yc-hbtn{width:32px;height:32px;border-radius:9px;border:0;background:rgba(244,237,226,.07);cursor:pointer;'
    + 'display:flex;align-items:center;justify-content:center;flex:none;transition:.2s;text-decoration:none}'
    + '.yc-hbtn svg{width:16px;height:16px;display:block}'
    + '.yc-hbtn.wa{color:#25D366}.yc-hbtn.tel{color:#ff8c3b}'
    + '.yc-hbtn.x{color:rgba(244,237,226,.6);font-size:20px;line-height:1}'
    + '.yc-hbtn:hover{background:rgba(244,237,226,.14)}'
    + '.yc-langs{padding:8px 16px;font-size:10.5px;letter-spacing:.02em;text-align:center;'
    + 'color:rgba(244,237,226,.42);border-bottom:1px solid rgba(244,237,226,.07);background:rgba(244,237,226,.02)}'
    + '.yc-log{flex:1;overflow-y:auto;padding:18px 16px 6px;display:flex;flex-direction:column;gap:11px;'
    + 'scrollbar-width:thin;scrollbar-color:rgba(244,237,226,.2) transparent}'
    + '.yc-log::-webkit-scrollbar{width:5px}'
    + '.yc-log::-webkit-scrollbar-thumb{background:rgba(244,237,226,.18);border-radius:4px}'
    + '.yc-msg{max-width:88%;padding:11px 14px;border-radius:16px;font-size:14px;line-height:1.62;'
    + 'white-space:pre-wrap;word-wrap:break-word;animation:ycMsg .3s cubic-bezier(.22,.61,.36,1)}'
    + '@keyframes ycMsg{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}'
    + '.yc-msg.bot{align-self:flex-start;background:rgba(244,237,226,.07);color:#f4ede2;border-bottom-left-radius:5px}'
    + '.yc-msg.me{align-self:flex-end;background:linear-gradient(135deg,rgba(255,140,59,.26),rgba(255,140,59,.16));'
    + 'color:#f4ede2;border:1px solid rgba(255,140,59,.28);border-bottom-right-radius:5px}'
    + '.yc-msg a{color:#ff8c3b;text-decoration:underline;text-underline-offset:2px}'
    /* chips live inside the log, directly under the last reply — so they read
       as part of the conversation instead of stranding a gap above the input */
    + '.yc-chips{display:flex;flex-wrap:wrap;gap:7px;padding:1px 0 6px}'
    + '.yc-chip{font-size:12.5px;padding:9px 14px;border-radius:30px;border:1px solid rgba(244,237,226,.2);'
    + 'background:rgba(244,237,226,.03);color:rgba(244,237,226,.86);cursor:pointer;font-family:inherit;'
    + 'transition:.2s;animation:ycMsg .3s cubic-bezier(.22,.61,.36,1)}'
    + '.yc-chip:hover{border-color:#ff8c3b;color:#ff8c3b;background:rgba(255,140,59,.08)}'
    + '.yc-chip.go{border-color:rgba(255,140,59,.5);color:#ff8c3b}'
    + '.yc-foot{display:flex;gap:8px;padding:12px 12px 8px;align-items:flex-end}'
    + '.yc-in{flex:1;background:rgba(244,237,226,.06);border:1px solid rgba(244,237,226,.16);border-radius:14px;'
    + 'padding:12px 14px;color:#f4ede2;font-family:inherit;font-size:14px;outline:none;resize:none;'
    + 'max-height:104px;line-height:1.5;transition:border-color .2s}'
    + '.yc-in:focus{border-color:rgba(255,140,59,.6)}'
    + '.yc-in::placeholder{color:rgba(244,237,226,.36)}'
    + '.yc-send{flex:none;width:42px;height:42px;border-radius:12px;border:0;cursor:pointer;'
    + 'background:linear-gradient(135deg,#ff8c3b,#ffc9a3);color:#07060a;display:flex;align-items:center;'
    + 'justify-content:center;transition:.2s}'
    + '.yc-send svg{width:18px;height:18px}'
    + '.yc-send:hover{filter:brightness(1.08)}'
    + '.yc-send:disabled{opacity:.4;cursor:default;filter:none}'
    + '.yc-typing{display:flex;gap:4px;padding:14px}'
    + '.yc-typing i{width:6px;height:6px;border-radius:50%;background:rgba(244,237,226,.5);animation:ycB 1.2s infinite}'
    + '.yc-typing i:nth-child(2){animation-delay:.15s}.yc-typing i:nth-child(3){animation-delay:.3s}'
    + '@keyframes ycB{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}'
    + '.yc-note{font-size:10.5px;color:rgba(244,237,226,.36);text-align:center;padding:0 16px 12px}'
    + '.yc-note a{color:rgba(255,140,59,.8)}'
    /* phone: a proper bottom sheet, not a floating card wedged above the fold */
    + '@media(max-width:640px){'
    + '.yc-bar{right:14px;bottom:14px;gap:8px}'
    + '.yc-mini{width:42px;height:42px}.yc-pill{height:50px;padding:0 18px 0 7px;font-size:14px}'
    + '.yc-tease{right:14px;left:14px;bottom:76px;max-width:none}'
    + '.yc-panel{right:0;left:0;bottom:0;width:100%;height:86vh;height:86dvh;'
    + 'border-radius:22px 22px 0 0;border-bottom:0}'
    + '.yc-panel.on{animation:ycUp .34s cubic-bezier(.22,.61,.36,1)}'
    + '@keyframes ycUp{from{transform:translateY(100%)}to{transform:none}}'
    + '.yc-foot{padding-bottom:calc(8px + env(safe-area-inset-bottom))}'
    + '.yc-note{padding-bottom:calc(12px + env(safe-area-inset-bottom))}'
    + '.yc-msg{font-size:14.5px;max-width:90%}'
    + '}'
    + '@media(prefers-reduced-motion:reduce){.yc-pill .yc-ap{animation:none}'
    + '.yc-panel.on,.yc-msg,.yc-chip{animation:none}}';

  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* landing.js puts its own WhatsApp/call stack in the same corner.
     We've absorbed both into this bar, so retire it. */
  function dropOldFab() {
    var old = document.querySelector('.l-fab');
    if (old) old.remove();
  }
  dropOldFab();
  document.addEventListener('DOMContentLoaded', dropOldFab);
  window.addEventListener('load', dropOldFab);

  /* ── the bar ───────────────────────────────────────────────── */
  var bar = document.createElement('div');
  bar.className = 'yc-bar';
  bar.innerHTML =
      '<a class="yc-mini wa" href="' + WA_URL + '" target="_blank" rel="noopener" aria-label="Message Yedukrishna on WhatsApp">' + WA_ICON + '</a>'
    + '<a class="yc-mini tel" href="tel:+' + NUM + '" aria-label="Call Yedukrishna">' + TEL_ICON + '</a>'
    + '<button class="yc-pill" aria-label="Chat with ' + BOT + ', the YKS Productions assistant">'
    + '<span class="yc-mark">' + APERTURE + '</span>Ask ' + BOT + '</button>';
  document.body.appendChild(bar);
  var pill = bar.querySelector('.yc-pill');

  /* ── the panel ─────────────────────────────────────────────── */
  var panel = document.createElement('div');
  panel.className = 'yc-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat with ' + BOT);
  panel.innerHTML =
      '<div class="yc-head"><div class="yc-av">' + APERTURE + '</div>'
    + '<div class="yc-ttl"><b>' + BOT + '</b><span><i></i>Replies instantly</span></div>'
    + '<a class="yc-hbtn wa" href="' + WA_URL + '" target="_blank" rel="noopener" title="WhatsApp Yedukrishna" aria-label="WhatsApp Yedukrishna">' + WA_ICON + '</a>'
    + '<a class="yc-hbtn tel" href="tel:+' + NUM + '" title="Call Yedukrishna" aria-label="Call Yedukrishna">' + TEL_ICON + '</a>'
    + '<button class="yc-hbtn x" aria-label="Close chat">&times;</button></div>'
    + '<div class="yc-langs">' + LANG_STRIP + '</div>'
    + '<div class="yc-log" id="ycLog"></div>'
    + '<div class="yc-chips" id="ycChips"></div>'
    + '<div class="yc-foot"><textarea class="yc-in" id="ycIn" rows="1" dir="auto" placeholder="' + T.ph + '"></textarea>'
    + '<button class="yc-send" id="ycSend" aria-label="Send"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div>'
    + '<div class="yc-note">' + BOT + ' is an AI assistant — for anything urgent, '
    + '<a href="' + WA_URL + '" target="_blank" rel="noopener">message Yedukrishna</a></div>';
  document.body.appendChild(panel);

  var log = panel.querySelector('#ycLog'), input = panel.querySelector('#ycIn'),
      send = panel.querySelector('#ycSend'), chips = panel.querySelector('#ycChips');
  var history = [], busy = false, started = false;

  /* ── the invitation ────────────────────────────────────────── */
  var tease = null;
  function killTease() {
    if (!tease) return;
    tease.classList.remove('on');
    var t = tease; tease = null;
    setTimeout(function () { if (t.parentNode) t.remove(); }, 420);
  }
  function showTease() {
    if (started || tease) return;
    try { if (sessionStorage.getItem('yksIris')) return; } catch (e) {}
    tease = document.createElement('div');
    tease.className = 'yc-tease';
    tease.setAttribute('dir', 'auto');
    tease.innerHTML = '<button class="yc-tx" aria-label="Dismiss">&times;</button>' + T.tease;
    document.body.appendChild(tease);
    requestAnimationFrame(function () { tease && tease.classList.add('on'); });
    tease.querySelector('.yc-tx').onclick = function (e) {
      e.stopPropagation();
      try { sessionStorage.setItem('yksIris', '1'); } catch (err) {}
      killTease();
    };
    tease.onclick = function () { open(); };
    setTimeout(killTease, 14000);          // never nag
  }
  setTimeout(showTease, 5500);

  /* ── rendering ─────────────────────────────────────────────── */
  function esc(s) {
    return String(s).replace(/[<>&]/g, function (c) {
      return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c];
    });
  }
  function md(s) {
    return esc(s)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])((?:https?:\/\/|\/)[^\s<)]+\.(?:html|com|ae|in)[^\s<)]*)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }
  function add(who, text) {
    var d = document.createElement('div');
    d.className = 'yc-msg ' + who;
    d.setAttribute('dir', 'auto');   // Arabic replies flip themselves, no JS needed
    d.innerHTML = who === 'bot' ? md(text) : esc(text);
    log.appendChild(d); log.scrollTop = log.scrollHeight;
    return d;
  }
  function typing(on) {
    var t = log.querySelector('.yc-typing');
    if (on && !t) {
      var d = document.createElement('div');
      d.className = 'yc-msg bot yc-typing';
      d.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(d); log.scrollTop = log.scrollHeight;
    } else if (!on && t) { t.remove(); }
  }
  function setChips(list) {
    chips.innerHTML = '';
    log.appendChild(chips);          // always sit under the newest reply
    list.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'yc-chip' + (ACTIONS[c] ? ' go' : '');
      b.textContent = c;
      b.onclick = function () {
        if (ACTIONS[c]) {
          var href = ACTIONS[c];
          if (window.gtag) gtag('event', 'chat_action', { method: c });
          if (/^https?:/.test(href)) window.open(href, '_blank', 'noopener');
          else location.href = href;
          return;
        }
        ask(c);
      };
      chips.appendChild(b);
    });
    log.scrollTop = log.scrollHeight;
  }
  /* Pick follow-ups from what was actually just discussed. */
  function followUps(bot, user) {
    var hay = (user + ' ' + bot);
    for (var i = 0; i < FOLLOWUPS.length; i++) {
      if (FOLLOWUPS[i].k.test(hay)) return FOLLOWUPS[i].c;
    }
    return DEFAULT_FOLLOWUPS;
  }

  /* ── talking ───────────────────────────────────────────────── */
  function ask(text) {
    text = (text || input.value).trim();
    if (!text || busy) return;
    input.value = ''; input.style.height = 'auto';
    add('me', text);
    history.push({ role: 'user', content: text });
    chips.innerHTML = '';
    busy = true; send.disabled = true; typing(true);

    if (window.gtag && history.length === 1) gtag('event', 'chat_started', { method: 'iris' });

    fetch(EP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history,
        /* so Iris knows which page they're reading and doesn't ask
           them to re-state what the page already told her */
        ctx: {
          page: (document.title || '').slice(0, 120),
          path: location.pathname,
          lang: navigator.language || ''
        }
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        typing(false);
        var reply = j && j.reply ? j.reply
          : "Sorry — that one didn't reach me. Try again, or message Yedukrishna: " + WA_URL;
        add('bot', reply);
        history.push({ role: 'assistant', content: reply });
        setChips(followUps(reply, text));
      })
      .catch(function () {
        typing(false);
        add('bot', "I can't reach my brain right now. Yedukrishna's on WhatsApp though: " + WA_URL);
        setChips(['→ WhatsApp him', '→ Get a quote']);
      })
      .then(function () { busy = false; send.disabled = false; input.focus(); });
  }

  /* ── open / close ──────────────────────────────────────────── */
  function open() {
    killTease();
    try { sessionStorage.setItem('yksIris', '1'); } catch (e) {}
    panel.classList.add('on');
    bar.classList.add('hide');
    if (!started) { started = true; add('bot', GREET); setChips(OPENERS); }
    if (!matchMedia('(max-width:640px)').matches) {
      setTimeout(function () { input.focus(); }, 140);
    }
  }
  function close() {
    panel.classList.remove('on');
    bar.classList.remove('hide');
  }

  pill.onclick = open;
  panel.querySelector('.yc-hbtn.x').onclick = close;
  send.onclick = function () { ask(); };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('on')) close();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); }
  });
  input.addEventListener('input', function () {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 104) + 'px';
  });
})();
