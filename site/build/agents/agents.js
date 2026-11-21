/* Agent pages (/chatgpt, /claude and the rest). Built by site/build/build_agents.py, which puts DATA (agents, logos,
   network logos) and the page's agent key in front of this file. The demo replays a real Blazed Kitty session. */
const {agents:AGENTS,logos:LOGOS,plat:PLAT}=DATA;
const AGP=document.getElementById('agp');
let agentKey=AGP.dataset.agent;

function applyAgent(key){
  agentKey=key; const A=AGENTS[key];
  const ink=A.ink==='ink'?'var(--ag-ink)':A.ink;AGP.style.setProperty('--ag-agent',ink);AGP.style.setProperty('--ag-agent-ink',ink);
  document.querySelectorAll('[data-ag="name"]').forEach(e=>{if(e.closest('h1,h2,h3')){e.classList.add('ag-agn');e.innerHTML='<span class="ag-agl">'+LOGOS[A.logo]+'</span>'+A.name}else e.textContent=A.name});
  document.querySelectorAll('[data-ag="logo"]').forEach(e=>{e.innerHTML=LOGOS[A.logo]});
  document.getElementById('chat').classList.toggle('ag-cli',A.cli);
  document.getElementById('field').dataset.ph=A.cli?'Type a request':'Ask anything';
}

/* the agent directory: one card per page, plus the general MCP page */
const grid=document.getElementById('agentsGrid');
Object.entries(AGENTS).forEach(([k,A])=>{const g=document.createElement('a');g.href=A.href||('/'+k);if(k===agentKey)g.setAttribute('aria-current','true');g.innerHTML='<span class="ag-ag-dot" style="color:'+(A.ink==='ink'?'var(--ag-ink)':A.ink)+'">'+LOGOS[A.logo]+'</span><span>'+A.name+'<small>capybaroar.com'+(A.href||('/'+k))+'</small></span>';grid.appendChild(g)});

/* hero mosaic: real Blazed Kitty photos */
(()=>{const c=document.getElementById('heroCal');for(let i=0;i<21;i++){const s=document.createElement('span');if(i>2){const im=document.createElement('img');im.src='/img/agents/p'+String((i*7)%40).padStart(2,'0')+'.jpg';im.alt='';im.loading='lazy';s.appendChild(im)}c.appendChild(s)}})();

/* copy buttons in the setup steps */
async function copyText(t,btn){try{await navigator.clipboard.writeText(t);if(btn){const o=btn.textContent;btn.textContent='Copied';setTimeout(()=>btn.textContent=o,1400)}return true}catch(e){return false}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b){copyText(b.dataset.copy,b)}});

/* channels */
const CH=[['Instagram','instagram','#FF0069'],['Pinterest','pinterest','#BD081C'],['TikTok','tiktok','#000000'],['X','x','#000000'],['LinkedIn','linkedin','#0A66C2'],['Facebook','facebook','#0866FF'],['Threads','threads','#000000'],['YouTube','youtube','#FF0000'],['Bluesky','bluesky','#0285FF']];
document.getElementById('chgrid').innerHTML=CH.map(([n,k,c])=>`<div class="ag-chn"><span class="ag-mk" style="color:${c}">${PLAT[k]}</span>${n}</div>`).join('');

/* prompts */
const PROMPTS=['Grab model photos from my store and keep the best ones','Look at my last 9 posts and write a month of posts the same way','Check next week for posts that will fail','Swap every scheduled post to photos from my new collection','Schedule 3 to 5 posts a day for the next month at random times','Copy the Instagram caption onto every Pinterest pin','How did last week do? What time worked best?','How many AI credits do I have left?'];
const CHECK='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 6.5 12 13 4.5"/></svg>';
const COPY='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="8.5" height="8.5" rx="2"/><path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5"/></svg>';
const pr=document.getElementById('prompts');
PROMPTS.forEach((p,i)=>{const li=document.createElement('li');li.innerHTML=`<span class="ag-pn">${String(i+1).padStart(2,'0')}</span><span class="ag-pt">${p}</span><button type="button" class="ag-pc" aria-label="Copy prompt">${COPY}<span>Copy</span></button>`;
  const b=li.querySelector('.ag-pc');b.addEventListener('click',async()=>{let ok=false;try{await navigator.clipboard.writeText(p);ok=true}catch(e){const r=document.createRange();r.selectNodeContents(li.querySelector('.ag-pt'));const sel=getSelection();sel.removeAllRanges();sel.addRange(r)}
    li.classList.remove('ag-flash');void li.offsetWidth;li.classList.add('ag-flash');b.classList.add('ag-ok');b.innerHTML=CHECK+'<span>'+(ok?'Copied':'Selected')+'</span>';clearTimeout(b._t);b._t=setTimeout(()=>{b.classList.remove('ag-ok');b.innerHTML=COPY+'<span>Copy</span>'},1800)});pr.appendChild(li)});

/* ===== DEMO ENGINE: one live flow ===== */
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const log=document.getElementById('log'), field=document.getElementById('field'), view=document.getElementById('view'), sub=document.getElementById('sub');
let run=0, paused=false, current=0, fastRun=-1;
const isFast=()=>fastRun===run;
function sleep(ms){const id=run;return new Promise((res,rej)=>{const tick=()=>{if(id!==run)return rej('stop');if(paused&&!isFast())return setTimeout(tick,120);res()};setTimeout(tick,(RM||isFast())?0:ms)})}
function scrollLog(){log.scrollTop=log.scrollHeight}
function setTab(v){document.querySelectorAll('#vt span').forEach(s=>s.classList.toggle('ag-on',s.dataset.v===v))}
function setSub(html){sub.innerHTML=html;view.scrollTop=0}
const ph=()=>field.dataset.ph||'Ask anything';
async function typeField(text){field.classList.remove('ag-empty');const step=(RM||isFast())?text.length:2;for(let i=1;i<=text.length;i+=step){field.innerHTML='';field.append(text.slice(0,i));const c=document.createElement('span');c.className='ag-caret';field.appendChild(c);await sleep(20)}
  await sleep(320);field.textContent=ph();field.classList.add('ag-empty');
  const m=document.createElement('div');m.className='ag-msg ag-user';m.textContent=text;log.appendChild(m);scrollLog()}
async function think(ms=650){const t=document.createElement('div');t.className='ag-think';t.innerHTML='<i></i><i></i><i></i>';log.appendChild(t);scrollLog();await sleep(ms);t.remove()}
function mkTool(label,args,ext){const t=document.createElement('div');t.className='ag-tool'+(ext?' ag-ext':'');t.innerHTML=`<span class="ag-ic"></span><div><div class="ag-nm">${label} <small>${args||''}</small></div><div class="ag-res"></div></div>`;log.appendChild(t);scrollLog();
  return{el:t,done:(res)=>{t.classList.add('ag-done');t.querySelector('.ag-res').innerHTML=res||'';scrollLog()},count:(n)=>{let c=t.querySelector('.ag-ct');if(!c){c=document.createElement('span');c.className='ag-ct';t.querySelector('.ag-nm').appendChild(c)}c.textContent='×'+n}}}
const tool=(n,a)=>mkTool('capybaroar.'+n,a,false);
const own=(n,a)=>mkTool(n,a,true);
async function say(text){const m=document.createElement('div');m.className='ag-msg ag-agent';log.appendChild(m);const words=text.split(' ');const step=(RM||isFast())?words.length:2;for(let i=1;i<=words.length;i+=step){m.textContent=words.slice(0,i).join(' ');scrollLog();await sleep(40)}m.textContent=text}
function clearAll(){log.innerHTML='';view.innerHTML='';setSub('');field.textContent=ph();field.classList.add('ag-empty')}
function rng(seed){return()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296}}
const bk=i=>'/img/agents/p'+String(((i%40)+40)%40).padStart(2,'0')+'.jpg';
const rj=i=>'/img/agents/r'+String(((i%16)+16)%16).padStart(2,'0')+'.jpg';
function tile(src){const d=document.createElement('div');d.className='ag-th';const im=document.createElement('img');im.src=src;im.alt='';d.appendChild(im);return d}
function setBrandBK(){document.querySelector('.ag-brandsel').innerHTML='<img src="/img/agents/bk.png" alt="" style="width:18px;height:18px;border-radius:50%;display:block">Blazed Kitty'}

/* scraped grid: 24 keepers + 16 product-only shots, fixed shuffle */
const GRID=(()=>{const r=rng(3);const a=[...Array(24)].map((_,i)=>({src:bk(i),keep:true})).concat([...Array(16)].map((_,i)=>({src:rj(i),keep:false})));for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a})();
function scrapeView(){const g=document.createElement('div');g.className='ag-scrape';const cells=GRID.map(x=>{const c=document.createElement('div');c.className='ag-sc';c.appendChild(tile(x.src));c.style.visibility='hidden';g.appendChild(c);return c});view.innerHTML='';view.appendChild(g);return cells}
function calView(){
  const g=document.createElement('div');g.className='ag-cal';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>{const e=document.createElement('div');e.className='ag-dow';e.textContent=d;g.appendChild(e)});
  const start=new Date(2026,10,22);const cells=[];
  for(let i=0;i<35;i++){const dt=new Date(start);dt.setDate(start.getDate()+i);const c=document.createElement('div');c.className='ag-day';
    const lbl=(dt.getDate()===1||i===0)?dt.toLocaleString('en',{month:'short'})+' '+dt.getDate():dt.getDate();
    c.innerHTML=`<span class="ag-d">${lbl}</span><div class="ag-ps"></div>`;if(i>=30)c.style.opacity='.35';g.appendChild(c);cells.push(c)}
  view.innerHTML='';view.appendChild(g);return cells.slice(0,30)}
const cnt=()=>document.getElementById('cnt')||{};

const STAGES=[
 {label:'Scrape your store',async run(first){
   setTab('media');setSub('<span>Import</span><span><b id="cnt">0</b> photos found</span><span class="ag-chip">blazedkitty.com</span>');
   const cells=scrapeView();
   if(first){await typeField('Grab model photos from blazedkitty.com, keep the best Y2K ones, match how we post, check for problems, then schedule 3 to 5 posts a day for the next month.');await think();
     await say('On it. Starting with your store.');}
   const t=own('web.fetch','blazedkitty.com/collections/y2k-tops/womens');
   for(let i=0;i<cells.length;i++){cells[i].style.visibility='visible';cnt().textContent=Math.round((i+1)/cells.length*479);await sleep(45)}
   t.done('8 pages · 479 products · first photo of each');
 }},
 {label:'Find the best photos',async run(){
   setTab('media');setSub('<span>Review</span><span><b id="cnt">0</b> kept of 479</span><span class="ag-chip">Full body · Japanese Y2K</span>');
   const cells=scrapeView();cells.forEach(c=>c.style.visibility='visible');
   const t=own('vision.review','479 photos');let kept=0;
   for(let i=0;i<cells.length;i++){const x=GRID[i];cells[i].classList.add(x.keep?'ag-yes':'ag-no');if(x.keep)kept++;cnt().textContent=Math.round(kept/24*116);await sleep(70)}
   t.done('116 kept · skipped product-only shots, collages and text');
   await say('Kept 116 photos. I skipped clothes-only shots and anything with text, and kept full-body Japanese street photos.');
 }},
 {label:'Match your style',async run(){
   setTab('calendar');setSub('<span>Style check</span><span>@blazed_kitty_official</span><span class="ag-chip">Instagram</span>');
   const w=document.createElement('div');w.className='ag-style';
   w.innerHTML='<div class="ag-feed"><div class="ag-fh"><img src="/img/agents/bk.png" alt=""><b>blazed_kitty_official</b><span>last 9 posts</span></div><div class="ag-fg"></div></div><div class="ag-notes"><div class="ag-eyebrow" style="color:var(--ag-muted)">What I learned</div><ul></ul><div class="ag-drafts"><b id="cnt">0</b> drafts written</div></div>';
   view.innerHTML='';view.appendChild(w);const fg=w.querySelector('.ag-fg');for(let i=0;i<9;i++)fg.appendChild(tile(bk(i+24)));
   let t=tool('list_brands');await sleep(400);t.done('Blazed Kitty');
   t=tool('list_posts','last 9 posts');await sleep(600);t.done('9 posts · photo only · no captions');
   const notes=['Full-body model photo','Japanese Y2K street look','No caption, the photo does the talking','4:5 crop for Instagram','Each pin links to its product'];
   const ul=w.querySelector('ul');for(const n of notes){const li=document.createElement('li');li.textContent=n;ul.appendChild(li);await sleep(260)}
   t=tool('list_channels');await sleep(400);t.done('Instagram · Pinterest');
   t=tool('upload_media');for(let i=6;i<=108;i+=6){t.count(i);await sleep(25)}t.done('108 photos cropped to 4:5');
   for(let b=0;b<5;b++){const size=b<4?25:8;const c=tool('create_posts',`mode: draft · ${size} posts`);for(let j=0;j<size;j+=5){cnt().textContent=Math.min(b*25+j+5,b*25+size);await sleep(30)}cnt().textContent=b*25+size;c.done(size+' drafts');await sleep(80)}
   await say('Your feed is photo-only, so all 108 drafts have no caption. Each pin links to its product page.');
 }},
 {label:'Catch problems',async run(){
   setTab('calendar');setSub('<span>Preflight · Nov 22 – Nov 28</span><span><b id="cnt">7</b> posts</span><span class="ag-chip">Before anything goes out</span>');
   const days=['Sun 22','Mon 23','Tue 24','Wed 25','Thu 26','Fri 27','Sat 28'];
   const issue=[ 'pin','crop','ok','pin','ok','crop','pin'];
   const wrap=document.createElement('div');wrap.className='ag-rows';const rows=days.map((d,i)=>{const r=document.createElement('div');r.className='ag-row';
     r.innerHTML=`<span class="ag-when">${d}</span><span class="ag-ths"></span><span class="ag-chs"><span class="ag-pill ag-ig">Instagram</span><span class="ag-pill ag-pin">Pinterest</span></span><span class="ag-st">Draft</span>`;
     const ts=r.querySelector('.ag-ths');ts.appendChild(tile(bk(i*2)));if(issue[i]==='pin')ts.appendChild(tile(bk(i*2+1)));wrap.appendChild(r);return r});
   view.innerHTML='';view.appendChild(wrap);
   let t=tool('list_channels','posting rules');await sleep(500);t.done('Instagram 4:5 to 1.91:1 · Pinterest 1 photo per pin');
   for(let i=0;i<7;i++){const r=rows[i];if(issue[i]==='pin'){r.classList.add('ag-warn');r.querySelector('.ag-st').textContent='Pinterest takes 1 photo'}else if(issue[i]==='crop'){r.classList.add('ag-warn');r.querySelector('.ag-st').textContent='3:4 photo, needs 4:5'}else{r.classList.add('ag-ok');r.querySelector('.ag-st').textContent='Ready'}await sleep(140)}
   await say('3 posts have 2 photos, which Pinterest rejects, and 2 photos are too tall for Instagram. Fixing both.');
   const tc=tool('upload_media','re-crop to 4:5'),t1=tool('update_post','carousels → Instagram only'),t2=tool('create_posts','Pinterest · 1 photo each');let n=7,a=0,b=0;
   for(let i=0;i<7;i++){const r=rows[i];if(issue[i]==='ok')continue;r.classList.remove('ag-warn');r.classList.add('ag-ok');r.querySelector('.ag-st').textContent='Ready';
     if(issue[i]==='crop'){tc.count(++a)}else{t1.count(++b);t2.count(b);r.querySelector('.ag-chs').innerHTML='<span class="ag-pill ag-ig">Instagram</span>';const s=document.createElement('div');s.className='ag-row ag-ok ag-split';s.innerHTML='<span class="ag-when"></span><span class="ag-ths"></span><span class="ag-chs"><span class="ag-pill ag-pin">Pinterest</span></span><span class="ag-st">Ready</span>';s.querySelector('.ag-ths').appendChild(tile(bk(i*2)));r.after(s);cnt().textContent=++n;view.scrollTop=s.offsetTop-140}
     await sleep(260)}
   tc.done('2 photos re-cropped');t1.done('3 now Instagram only');t2.done('3 pins added');
 }},
 {label:'Bulk edit',async run(){
   setTab('calendar');setSub('<span>All drafts</span><span><b id="cnt">0</b> / 108 updated</span><span class="ag-chip">Bulk edit</span>');
   const g=document.createElement('div');g.className='ag-bulk';const cards=[];
   for(let i=0;i<24;i++){const c=document.createElement('div');c.className='ag-bcard';const t0=tile(i%3===0?rj(i):bk(i+8));t0.style.filter='grayscale(1) contrast(.85)';c.appendChild(t0);const cp=document.createElement('div');cp.className='ag-cap';cp.textContent=i%3===0?'western look':'old photo';c.appendChild(cp);g.appendChild(c);cards.push(c)}
   view.innerHTML='';view.appendChild(g);
   await typeField('some of these feel too western. stick to Japanese Y2K from the tops collection.');await think();
   let t=own('vision.review','Y2K Tops · 479 photos');await sleep(700);t.done('108 Japanese street photos picked');
   t=tool('upload_media');for(let i=9;i<=108;i+=9){t.count(i);await sleep(25)}t.done('108 photos · 4:5');
   t=tool('update_post','new photo · no caption');
   for(let i=1;i<=108;i++){t.count(i);cnt().textContent=i;const ci=Math.floor((i-1)/108*24);const c=cards[ci];if(!c.classList.contains('ag-swapped')){c.classList.add('ag-swapped');c.replaceChild(tile(bk(ci+12)),c.firstChild);c.querySelector('.ag-cap').textContent='Japanese Y2K'}if(i%3===0)await sleep(20)}
   t.done('108 updated');
   await say('Swapped all 108 to Japanese Y2K street photos from Y2K Tops.');
 }},
 {label:'Bulk schedule',async run(){
   setTab('calendar');const cells=calView();setSub('<span>Nov 22 – Dec 21</span><span><b id="cnt">0</b> scheduled</span><span class="ag-chip">Instagram · Pinterest</span>');
   const r=rng(7);const per=cells.map(()=>3+Math.floor(r()*3));let tot=per.reduce((a,b)=>a+b,0);let k=0;while(tot>108){if(per[k%30]>3){per[k%30]--;tot--}k++}
   const slots=[];per.forEach((n,i)=>{for(let j=0;j<n;j++)slots.push(i)});
   const t=tool('update_post','mode: schedule · random times 8am–11:30pm');
   for(let i=0;i<108;i++){const c=cells[slots[i]];c.querySelector('.ag-ps').appendChild(tile(bk(i)));c.classList.add('ag-lit');t.count(i+1);cnt().textContent=i+1;if(i%2===0)await sleep(28)}
   t.done('108 scheduled · 3 to 5 a day');await think(400);
   await say('Done. 108 posts are scheduled from Nov 22 to Dec 21, 3 to 5 a day at random times between 8am and 11:30pm. You still have every AI credit.');
 }}
];
const rail=document.getElementById('rail');
STAGES.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.innerHTML=`<span class="ag-n">${i+1}</span><span>${s.label}</span>`;b.addEventListener('click',()=>{paused=false;document.getElementById('playBtn').textContent='Pause';play(i)});rail.appendChild(b)});
function markRail(i){[...rail.children].forEach((b,j)=>{b.className=j<i?'ag-done':j===i?'ag-on':''})}
async function play(from){
  const id=++run;current=from;clearAll();setBrandBK();
  try{
    if(from>0){fastRun=id;markRail(from);await typeField('Grab model photos from blazedkitty.com, keep the best Y2K ones, match how we post, check for problems, then schedule 3 to 5 posts a day for the next month.');for(let i=0;i<from;i++)await STAGES[i].run(false);fastRun=-1}
    for(let i=from;i<STAGES.length;i++){if(id!==run)return;current=i;markRail(i);await STAGES[i].run(i===0);await sleep(900)}
    markRail(STAGES.length);await sleep(5000);if(id===run)play(0)
  }catch(e){}
}
document.getElementById('playBtn').addEventListener('click',e=>{paused=!paused;e.target.textContent=paused?'Play':'Pause'});
document.getElementById('replayBtn').addEventListener('click',()=>{paused=false;document.getElementById('playBtn').textContent='Pause';play(0)});

applyAgent(agentKey);
/* start the demo when it scrolls near the screen, so it plays from the first step */
(()=>{const d=document.getElementById('demo');if(!('IntersectionObserver' in window)){play(0);return}
  const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();play(0)}},{rootMargin:'200px'});io.observe(d)})();
