/* YKS stats: cookieless, anonymous visit counting (no IP, no IDs, no form contents). Off with DNT/GPC or the privacy page's "Turn it off". See /privacy.html#stats */
(function(w,d,n){'use strict';
if(w.YKSStats)return;var E='https://yks-stats.ysuresh634.workers.dev/c',L,S,q,T=0;
try{L=localStorage;S=sessionStorage}catch(e){}
try{q=new URLSearchParams(location.search);var o=q.get('personalise');if(L&&o==='off')L.setItem('yks_smart_off','1');if(L&&o==='on')L.removeItem('yks_smart_off');
if(q.get('yks_stats')==='me'&&L)L.setItem('yks_stats_me','1');if(q.get('yks_stats_test')&&S)S.setItem('yks_st_t','1');T=(L&&L.getItem('yks_stats_me'))||(S&&S.getItem('yks_st_t'))?1:0}catch(e){}
function off(){try{return n.doNotTrack==='1'||w.doNotTrack==='1'||n.globalPrivacyControl===true||(L&&L.getItem('yks_smart_off')==='1')}catch(e){return true}}
if(off()||/bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(n.userAgent)||!/yksproductions\.com$/.test(location.hostname)){w.YKSStats={track:function(){}};return}
var P=location.pathname.replace(/\/index\.html$/,'/').replace(/\.html$/,'')||'/';
function send(o){if(off())return;o.p=P;if(T)o.t=1;var b=JSON.stringify(o);try{if(n.sendBeacon&&n.sendBeacon(E,b))return}catch(e){}try{fetch(E,{method:'POST',body:b,keepalive:true,mode:'no-cors'})}catch(e){}}
var seen={};function ev(x,v,once){var k=x+'|'+(v||'');if(once&&seen[k])return;seen[k]=1;send({k:'ev',n:x,v:v})}
var r='';try{r=d.referrer?new URL(d.referrer).hostname:''}catch(e){}
var sw=screen.width||innerWidth,z='Other';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
z=/Kolkata|Calcutta/.test(z)?'India':/Dubai/.test(z)?'UAE':'Other';
var u=['utm_source','utm_medium','utm_campaign'].map(function(k){return q&&q.get(k)||''});
send({k:'pv',r:r,u:u[0]?u:0,s:sw<=480?'≤480':sw<=768?'481–768':sw<=1024?'769–1024':sw<=1440?'1025–1440':'>1440',l:(n.language||'').slice(0,5),z:z});
/* time on page (visible only) + scroll depth, sent each time the page is hidden */
var act=0,t0=d.hidden?0:Date.now(),mx=0;
function sc(){var h=d.documentElement,y=(scrollY||h.scrollTop)+innerHeight,H=Math.max(h.scrollHeight,1);mx=Math.max(mx,Math.min(100,Math.round(y/H*100)))}
addEventListener('scroll',sc,{passive:true});setTimeout(sc,800);
function hid(){if(t0){act+=Date.now()-t0;t0=0}if(act>=1000)send({k:'lv',d:act/1000,sc:mx});act=0}
d.addEventListener('visibilitychange',function(){d.hidden?hid():(t0=Date.now())});addEventListener('pagehide',function(){if(!d.hidden)hid()});
/* clicks */
var tab={tabReel:'instagram',tabFeed:'facebook',tabSearch:'google'},plat='instagram';
d.addEventListener('click',function(e){var t=e.target;if(!t||!t.closest)return;var a=t.closest('a[href]'),h=a?a.getAttribute('href')||'':'';
if(/wa\.me|whatsapp/i.test(h))ev('wa');else if(/^tel:/i.test(h))ev('call');else if(/^mailto:/i.test(h))ev('email');
var c=t.closest('[data-yks-sticky],[data-yks-rec],[data-yks-tuned] a');if(c)ev('cta',c.hasAttribute('data-yks-sticky')?'sticky':c.hasAttribute('data-yks-rec')?'rec':'hero');
if(t.closest('.yks-ex a'))ev('exit_click');
var b=t.closest('button');if(b&&tab[b.id]){plat=tab[b.id];ev('adsim',plat,1)}
if(t.closest('#ycSend')&&(d.getElementById('ycIn')||{}).value||t.closest('.yc-chip'))ev('chat_msg');
setTimeout(function(){if(d.querySelector('.yc-panel.on'))ev('chat_open','',1)},400)},true);
d.addEventListener('keydown',function(e){var t=e.target;if(e.key==='Enter'&&!e.shiftKey&&t&&t.id==='ycIn'&&t.value.trim())ev('chat_msg')},true);
d.addEventListener('input',function(e){var t=e.target;if(!t||!t.closest)return;if(t.closest('#adlook'))ev('adsim',plat,1);else if(t.closest('#plan'))ev('adsim','planner',1)},true);
/* forms: type only, never contents. Counted once actually sent, not on a failed check. */
d.addEventListener('submit',function(e){var f=e.target,id=(f.id||'')+' '+(f.className||'');
if(/waitlist/i.test(id))ev('form','waitlist');else if(/talForm|ta-form/.test(id)){var i=0,c=setInterval(function(){var x=d.getElementById('taDone');if(x&&!x.hidden){clearInterval(c);ev('form','talent',1)}if(++i>180)clearInterval(c)},1000)}},true);
addEventListener('yks:classified',function(e){var c=e.detail||{};ev('form',c.category==='talent'||c.route==='talent'?'talent_routed':'client')});
addEventListener('yks:search',function(){ev('search')});
addEventListener('yks:adsim',function(e){var x=e.detail||{};ev(x.brand?'adsim_brand':'adsim',x.platform||plat)});
try{new PerformanceObserver(function(l){l.getEntries().forEach(function(x){if(/\/adsim\b/.test(x.name))ev('adsim_brand',plat)})}).observe({type:'resource',buffered:true})}catch(e){}
function mo(){try{new MutationObserver(function(m){m.forEach(function(r){[].forEach.call(r.addedNodes,function(x){if(x.classList&&x.classList.contains('yks-ex'))ev('exit_shown')})})}).observe(d.body,{childList:true})}catch(e){}}
d.body?mo():d.addEventListener('DOMContentLoaded',mo);
w.YKSStats={track:function(x,v){ev(String(x),v==null?'':String(v))}};
})(window,document,navigator);
