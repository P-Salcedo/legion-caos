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
 (GCUR?GMSG:MSG).forEach(m=>{
  const d=dayLbl(m.created_at);if(d!==day){day=d;h+=`<div class="day">${d}</div>`}
  const me=m.sender===ME.id,mt=`<small class="meta">${tm(m.created_at)}${me?' <b class="tk">✓✓</b>':''}</small>`;
  if(m.kind==='sticker'){
   const[em='',an='pop']=(m.body||'').split('|');
   h+=`<div class="sb${me?' me':''}">${m.img?`<img class="stkimg" src="${m.img}" alt="">`:`<span class="stk ${esc(an)}">${esc(em)}</span>`}${mt}</div>`;
  }else h+=`<div class="b${me?' me':''}">${GCUR&&!me?`<b class="gn" style="color:${pcol(m.sender)}">${esc(pname(m.sender))}</b>`:''}${m.img?`<img src="${m.img}" alt="">`:''}${m.body?esc(m.body):''}${mt}</div>`;
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

/* ---- Moderación en lista, insignias (el creador puede dar o quitar el rango) ---- */
let MODS=[];
const canSetB=(i,p)=>{const cr=(ME.badges||[]).includes(0),b=p.badges||[];if(cr)return !(i===0&&p.id===ME.id);return i>=2&&!b.includes(0)&&!b.includes(1)};
async function loadMod(){
 const{data,error}=await sb.from('profiles').select('*').order('name');
 if(error)return toast(error.message);
 MODS=data||[];
 $('list').innerHTML=`<div class="sec">Usuarios (${MODS.length})</div>`+MODS.map((p,i)=>`<div class="row mrow" data-m="${p.id}" style="animation-delay:${Math.min(i,20)*25}ms">${av(p,'#444')}<div class="ri"><b class="nm">${esc(p.name)}${bdg(p)}</b><small>@${esc(p.username)}</small></div><span class="chev">›</span></div>`).join('');
}
function openMsheet(id){
 const p=MODS.find(x=>x.id===id);if(!p)return;
 $('msh').innerHTML=`<div class="sheet"><div class="grab"></div><div class="ah">${av(p,'#444')}<div class="ri"><b class="nm">${esc(p.name)}</b><small>@${esc(p.username)}</small></div></div><p class="lbl">Insignias</p><div class="chips">${Object.keys(BADGES).map(i=>`<button class="chip${(p.badges||[]).includes(+i)?' on':''}" style="--bc:${BADGES[i][2]}" data-bd="${p.id}:${i}" ${canSetB(+i,p)?'':'disabled'}>${BADGES[i][0]} ${BADGES[i][1]}</button>`).join('')}</div><button class="ghost" data-x>Cerrar</button></div>`;
 $('msh').classList.remove('hidden');
}
async function setBadge(k){
 const[pid,bid]=k.split(':'),id=+bid;
 const{data:p,error:e1}=await sb.from('profiles').select('badges').eq('id',pid).single();
 if(e1)return toast(e1.message);
 const cur=p.badges||[],nb=cur.includes(id)?cur.filter(x=>x!==id):cur.concat([id]);
 const{error}=await sb.from('profiles').update({badges:nb}).eq('id',pid);
 if(error)return toast(error.message);
 toast('Insignia actualizada');await loadMod();openMsheet(pid);
}
$('list').addEventListener('click',e=>{const r=e.target.closest('[data-m]');if(r)openMsheet(r.dataset.m)});
$('msh').onclick=e=>{
 if(e.target.id==='msh'||e.target.closest('[data-x]')){$('msh').classList.add('hidden');return}
 const b=e.target.closest('[data-bd]');if(b&&!b.disabled)setBadge(b.dataset.bd);
};

/* ---- Tono de llamada en Ajustes ---- */
const _cfg=cfg;
cfg=function(){
 _cfg();if(!$('out'))return;
 $('out').insertAdjacentHTML('beforebegin',`<label class="copy" style="text-align:left">Tono de llamada entrante<select id="tono">${Object.keys(TONE_NAMES).map(k=>`<option value="${k}"${(ME.tono||'clasico')===k?' selected':''}>${TONE_NAMES[k]}</option>`).join('')}</select></label><button class="ghost" id="tprev" style="align-self:flex-start">▶ Probar tono</button>`);
 $('tono').onchange=async e=>{const{error}=await sb.from('profiles').update({tono:e.target.value}).eq('id',ME.id);if(error)return toast(error.message);ME.tono=e.target.value;toast('Tono guardado')};
 $('tprev').onclick=()=>playTone($('tono').value);
};

/* ---- Inicializar llamadas cuando hay sesión ---- */
const _render=render;
render=function(){
 if(ME&&!INBOX)initCalls();
 if(ME&&!GLOADED){GLOADED=true;loadGroups().then(()=>{initGroupRT();render()})}
 return _render();
};

/* ---- App instalable (PWA) ---- */
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

/* ---- Grupos y Clan Legión Caos ---- */
let GROUPS=[],GCUR=null,GMSG=[],MEM={},PROF={},GLOADED=false,GRT=false;
const COLS=['#8e24aa','#3949ab','#00897b','#f4511e','#6d4c41','#546e7a'];
const CATS={solo:'Grupo abierto',clan:'Clan oficial',creadores:'Creadores',moderadores:'Moderadores',patrocinador:'Patrocinador',creador_contenido:'Creador de contenido',veterano:'Veterano'};
const isStaff=()=>(ME.badges||[]).some(b=>b===0||b===1);
const canAdmin=g=>!!g&&(g.clan?isStaff():(g.owner===ME.id||isStaff()));
const canPostG=g=>canAdmin(g)||g.permiso_mensajes==='todos';
const pname=id=>(PROF[id]||{}).name||'Miembro';
const pcol=id=>{const b=((PROF[id]||{}).badges||[]).filter(i=>BADGES[i]);return b.length?BADGES[b[0]][2]:'#ffb3ba'};
const catName=g=>CATS[g.categoria]||'Grupo';
const gav=g=>`<div class="av gav" style="background-color:${g.color||'#8e24aa'}${(g.photo||g.clan)?`;background-image:url(${esc(g.photo||'icon-512.png')})`:''}">${(g.photo||g.clan)?'':esc(g.name[0]).toUpperCase()}</div>`;
const grow=(g,i)=>`<div class="row grow${g.clan?' clan':''}" data-g="${g.id}" style="animation-delay:${i*35}ms">${gav(g)}<div class="ri"><div class="rt"><b class="nm">${esc(g.name)}${g.clan?' <span class="tagclan">⚔ CLAN</span>':''}</b><small>${MEM[g.id]||0} 👤</small></div><div class="rs">${catName(g)}</div></div></div>`;
async function loadGroups(){
 const{data,error}=await sb.from('groups').select('*');
 if(error)toast(error.message);
 GROUPS=data||[];
 const{data:ms}=await sb.from('group_members').select('group_id');
 MEM={};(ms||[]).forEach(r=>{MEM[r.group_id]=(MEM[r.group_id]||0)+1});
 const{data:ps}=await sb.from('profiles').select('id,name,username,badges,photo');
 PROF={};(ps||[]).forEach(p=>{PROF[p.id]=p});
 if(GCUR)GCUR=GROUPS.find(x=>x.id===GCUR.id)||null;
 if(GCUR)drawMsgs();
}
function initGroupRT(){
 if(GRT)return;GRT=true;
 sb.channel('grupos-rt')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'group_messages'},p=>{const m=p.new;if(GCUR&&m.group_id===GCUR.id&&!GMSG.some(x=>x.id===m.id)){GMSG.push(m);drawMsgs()}})
  .on('postgres_changes',{event:'*',schema:'public',table:'groups'},()=>loadGroups().then(render))
  .subscribe();
}
const _chatRowsBase=chatRows;
chatRows=function(q){
 const gh=GROUPS.filter(g=>g.name.toLowerCase().includes(q)).sort((a,b)=>(b.clan?1:0)-(a.clan?1:0)||a.name.localeCompare(b.name)).map(grow).join('');
 const dm=CS.length?_chatRowsBase(q):'';
 return gh+dm||'<p class="empty">Aún no tienes chats. Toca ＋ para agregar a alguien.</p>';
};
$('list').addEventListener('click',e=>{const r=e.target.closest('[data-g]');if(r)openGroup(r.dataset.g)});
async function openGroup(id){
 const g=GROUPS.find(x=>x.id===id);if(!g)return;
 GCUR=g;CUR=null;
 $('pane').classList.add('open');$('empty').classList.add('hidden');$('chat').classList.remove('hidden');
 $('cAv').innerHTML=gav(g);$('cName').textContent=g.name;$('cSub').textContent=catName(g)+' · '+(MEM[g.id]||0)+' miembros';
 setBg(g.clan?'sangre':'negro');
 ['acall','vcall','stkb'].forEach(i=>$(i).classList.add('hidden'));$('tray').classList.add('hidden');
 $('cin').classList.toggle('hidden',!canPostG(g));
 const{data,error}=await sb.from('group_messages').select('*').eq('group_id',g.id).order('created_at').limit(300);
 if(error)toast(error.message);
 GMSG=data||[];drawMsgs();
}
const _openChat=openChat;
openChat=function(f){GCUR=null;['stkb','acall','vcall'].forEach(i=>$(i).classList.remove('hidden'));return _openChat(f)};
const _back=$('back').onclick;
$('back').onclick=()=>{GCUR=null;_back()};
const _sendDM=$('cin').onsubmit;
$('cin').onsubmit=async e=>{
 if(!GCUR)return _sendDM(e);
 e.preventDefault();const t=$('txt').value.trim();if(!t)return;$('txt').value='';
 const{data,error}=await sb.from('group_messages').insert({group_id:GCUR.id,sender:ME.id,body:t}).select().single();
 if(error)return toast(error.message);
 if(!GMSG.some(x=>x.id===data.id)){GMSG.push(data);drawMsgs()}
};
function openGset(){
 const g=GCUR,adm=canAdmin(g),opt=(v,cur,l)=>`<option value="${v}"${cur===v?' selected':''}>${l}</option>`;
 $('msh').innerHTML=`<div class="sheet"><div class="grab"></div><div class="ah">${gav(g)}<div class="ri"><b class="nm">${esc(g.name)}</b><small>${catName(g)} · ${MEM[g.id]||0} miembros</small></div></div>
 <label class="copy" style="text-align:left">Nombre del grupo<input id="gn" maxlength="30" value="${esc(g.name)}" ${adm||g.permiso_nombre==='todos'?'':'disabled'}></label>
 <label class="copy" style="text-align:left">Foto del grupo<input id="gp" type="file" accept="image/*" ${adm||g.permiso_foto==='todos'?'':'disabled'}></label>
 ${adm?`<label class="copy" style="text-align:left">¿Quién puede mandar mensajes?<select id="gpm">${opt('todos',g.permiso_mensajes,'Todos los miembros')}${opt('admins',g.permiso_mensajes,'Solo administradores')}</select></label>
 <label class="copy" style="text-align:left">¿Quién puede editar el nombre?<select id="gpn">${opt('admins',g.permiso_nombre,'Solo administradores')}${opt('todos',g.permiso_nombre,'Todos los miembros')}</select></label>
 <label class="copy" style="text-align:left">¿Quién puede cambiar la foto?<select id="gpf">${opt('admins',g.permiso_foto,'Solo administradores')}${opt('todos',g.permiso_foto,'Todos los miembros')}</select></label>`:''}
 ${adm&&g.categoria==='solo'?'<label class="copy" style="text-align:left">Agregar miembro (usuario)<input id="gadd" placeholder="usuario"></label>':''}
 <div class="btns"><button class="ghost" data-x>Cerrar</button><button class="btn" id="gsave">Guardar</button></div></div>`;
 $('msh').classList.remove('hidden');
 $('gsave').onclick=saveG;
 $('gp').onchange=async e=>{const f=e.target.files[0];if(!f)return;const photo=await small(f,256);const{error}=await sb.from('groups').update({photo}).eq('id',g.id);if(error)return toast(error.message);g.photo=photo;toast('Foto actualizada');render();openGset()};
}
async function saveG(){
 const g=GCUR,adm=canAdmin(g),up={};
 const nm=$('gn').value.trim();if(nm&&nm!==g.name&&!$('gn').disabled)up.name=nm;
 if(adm){up.permiso_mensajes=$('gpm').value;up.permiso_nombre=$('gpn').value;up.permiso_foto=$('gpf').value}
 if(Object.keys(up).length){const{error}=await sb.from('groups').update(up).eq('id',g.id);if(error)return toast(error.message);Object.assign(g,up)}
 const add=$('gadd')?$('gadd').value.trim():'';
 if(add)await addMember(g,add);
 $('msh').classList.add('hidden');$('cName').textContent=g.name;toast('Grupo guardado');render();
}
async function addMember(g,u){
 const{data:p}=await sb.from('profiles').select('id,name').eq('username',u.toLowerCase()).maybeSingle();
 if(!p)return toast('No existe ese usuario');
 const{error}=await sb.from('group_members').insert({group_id:g.id,user_id:p.id});
 if(error)return toast(error.message);
 MEM[g.id]=(MEM[g.id]||0)+1;toast(p.name+' agregado');
}
const _cset=$('cset').onclick;
$('cset').onclick=()=>GCUR?openGset():_cset();
$('gb').onclick=()=>$('gm').classList.remove('hidden');
$('gcreate').onclick=async()=>{
 const name=$('gmn').value.trim();if(!name)return toast('Escribe un nombre para el grupo');
 const{error}=await sb.from('groups').insert({name,categoria:$('gmc').value,owner:ME.id,color:COLS[Math.random()*COLS.length|0]});
 if(error)return toast(error.message);
 $('gm').classList.add('hidden');$('gmn').value='';await loadGroups();render();toast('Grupo creado');
};

/* ---- Fondo: partículas de brasas ---- */
(function(){
 const c=$('bgfx'),x=c.getContext('2d');let P=[];
 const R=()=>{c.width=innerWidth;c.height=innerHeight;P=Array.from({length:Math.min(60,innerWidth/16|0)},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*2+.6,v:Math.random()*.4+.15,s:Math.random()*6.28,c:Math.random()<.7?'#ff3b4d':'#ffcf5a'}))};
 R();addEventListener('resize',R);
 const f=()=>{x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.y-=p.v;p.s+=.01;p.x+=Math.sin(p.s)*.3;if(p.y<-5){p.y=c.height+5;p.x=Math.random()*c.width}x.globalAlpha=.25+.35*Math.abs(Math.sin(p.s));x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);x.fill()});x.globalAlpha=1;requestAnimationFrame(f)};
 requestAnimationFrame(f);
})();
