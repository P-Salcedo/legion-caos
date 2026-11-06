/* Diseño tipo WhatsApp y stickers. Se carga después de app.js y reemplaza solo la parte visual. */
let LAST={},LASTOK=false;
const STK=[['🔥','bounce'],['💀','wiggle'],['😈','pulse'],['⚔️','spin'],['👑','pop'],['🩸','pulse'],['🐉','wiggle'],['🌑','spin'],['🖤','pop'],['😂','bounce'],['🤘','wiggle'],['💥','pop'],['🦂','wiggle'],['👀','pop'],['🎯','spin'],['😎','bounce']];
const dayLbl=t=>{const d=new Date(t),n=new Date(),y=new Date(n-864e5);return d.toDateString()===n.toDateString()?'Hoy':d.toDateString()===y.toDateString()?'Ayer':d.toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'})};
const prevTxt=m=>m.kind==='sticker'?'🏷️ Sticker':esc(m.body||'📷 Foto');
const pngSmall=(f,max)=>new Promise(res=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/png'))};im.src=r.result};r.readAsDataURL(f)});
async function loadLast(){
 const{data}=await sb.from('messages').select('sender,receiver,body,kind,created_at').order('created_at',{ascending:false}).limit(500);
 LAST={};(data||[]).forEach(m=>{const f=m.sender===ME.id?m.receiver:m.sender;if(!LAST[f])LAST[f]=m});
}
function chatRows(q){
 const rows=CS.filter(c=>(c.nickname||c.p.name).toLowerCase().includes(q))
  .sort((a,b)=>(LAST[b.friend]?new Date(LAST[b.friend].created_at):0)-(LAST[a.friend]?new Date(LAST[a.friend].created_at):0));
 return rows.map((c,i)=>{const L=LAST[c.friend];return `<div class="row" data-f="${c.friend}" style="animation-delay:${i*35}ms">${av(c.p,'#8e24aa')}<div class="ri"><div class="rt"><b class="nm">${esc(c.nickname||c.p.name)}${bdg(c.p)}</b><small>${L?tm(L.created_at):''}</small></div><div class="rs">${L&&L.sender===ME.id?'<span class="tk">✓✓</span> ':''}${L?prevTxt(L):'@'+esc(c.p.username)}</div></div></div>`}).join('')
  ||'<p class="empty">Aún no tienes chats. Toca ＋ para agregar a alguien.</p>';
}
function stRows(){
 const mine=`<div class="row" data-new="1">${av(ME,'#ff1f3d')}<div class="ri"><b class="nm">Publicar estado</b><small>Visible 24 h</small></div></div><div class="sec">Recientes</div>`;
 return mine+(ST.map((s,i)=>`<div class="row" style="animation-delay:${i*40}ms">${av(s.p,'#7a0010')}<div class="ri"><b class="nm">${esc(s.p.name)}${bdg(s.p)}</b><small>${esc(s.body)} · ${Math.max(1,Math.ceil((new Date(s.expires_at)-Date.now())/36e5))} h restantes</small></div>${s.author===ME.id?`<button class="ic" data-del="${s.id}">🗑️</button>`:''}</div>`).join('')||'<p class="empty">Sin estados activos</p>');
}
function render(){
 if(!LASTOK&&ME){LASTOK=true;loadLast().then(render)}
 const q=$('q').value.toLowerCase();
 $('stitle').textContent=TT[TAB];
 $('addb').classList.toggle('hidden',TAB!=='chats'&&TAB!=='estados');
 $('q').closest('.srch').classList.toggle('hidden',TAB!=='chats');
 if(TAB==='cfg')return cfg();
 if(TAB==='mod')return loadMod();
 $('list').innerHTML=TAB==='chats'?chatRows(q):stRows();
}
function drawMsgs(){
 const el=$('msgs');let h='',day='';
 MSG.forEach(m=>{
  const d=dayLbl(m.created_at);if(d!==day){day=d;h+=`<div class="day">${d}</div>`}
  const me=m.sender===ME.id,mt=`<small class="meta">${tm(m.created_at)}${me?' <b class="tk">✓✓</b>':''}</small>`;
  if(m.kind==='sticker'){
   const[em='',an='pop']=(m.body||'').split('|');
   h+=`<div class="sb${me?' me':''}">${m.img?`<img class="stkimg" src="${m.img}" alt="">`:`<span class="stk ${esc(an)}">${esc(em)}</span>`}${mt}</div>`;
  }else h+=`<div class="b${me?' me':''}">${m.img?`<img src="${m.img}" alt="">`:''}${m.body?esc(m.body):''}${mt}</div>`;
 });
 el.innerHTML=h;el.scrollTop=el.scrollHeight;
 if(MSG.length&&CUR)LAST[CUR.friend]=MSG[MSG.length-1];
}
async function sendStk(body,img){
 if(!CUR)return;
 const{data,error}=await sb.from('messages').insert({sender:ME.id,receiver:CUR.friend,body:body||null,img:img||null,kind:'sticker'}).select().single();
 if(error)return toast(error.message);
 if(!MSG.some(x=>x.id===data.id)){MSG.push(data);drawMsgs()}
 $('tray').classList.add('hidden');
}
$('tray').innerHTML=STK.map(([e,a])=>`<button data-stk="${e}|${a}">${e}</button>`).join('')+'<label class="up">📁 Subir sticker<input type="file" accept="image/*" hidden></label>';
$('tray').onclick=e=>{const b=e.target.closest('[data-stk]');if(b)sendStk(b.dataset.stk,null)};
$('tray').onchange=async e=>{const f=e.target.files[0];if(f)sendStk('',await pngSmall(f,256))};
$('stkb').onclick=()=>$('tray').classList.toggle('hidden');
$('q').oninput=render;
const _onMsg=onMsg;
onMsg=m=>{_onMsg(m);const f=m.sender===ME.id?m.receiver:m.sender;if(!LAST[f]||new Date(m.created_at)>=new Date(LAST[f].created_at))LAST[f]=m;if(TAB==='chats')render()};
