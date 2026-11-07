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
  if(m.kind==='encuesta'){h+=`<div class="wide">${encCard(m)}</div>`;return}
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
 const{data:ms}=await sb.from('group_members').select('group_id,user_id');
 GMEM={};(ms||[]).forEach(r=>{(GMEM[r.group_id]=GMEM[r.group_id]||[]).push(r.user_id)});MEM={};Object.keys(GMEM).forEach(k=>{MEM[k]=GMEM[k].length});
 const{data:ps}=await sb.from('profiles').select('id,name,username,badges,photo,phone,about,created_at');
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
 GMSG=data||[];await loadEnc(g.id);initEncRT();drawMsgs();
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

/* ---- Información de grupo y contacto, encuesta de equipos ---- */
let GMEM={},ENC={},ERT=false;
const memberIds=gid=>GMEM[gid]||[];
const winOpen=m=>Date.now()<new Date(m.unido).getTime()+5*6e4;
const cuentaRegresiva=t=>{const left=new Date(t).getTime()+5*6e4-Date.now();return left<=0?'0:00':mmss(Math.ceil(left/1e3))};
const myTeam=eid=>{const e=ENC[eid];if(!e)return null;for(const t of e.teams){const x=t.m.find(z=>z.user_id===ME.id);if(x)return{tid:t.id,unido:x.unido_at}}return null};
setInterval(()=>document.querySelectorAll('[data-cdu]').forEach(el=>{el.textContent=cuentaRegresiva(el.dataset.cdu)}),1000);

async function loadEnc(gid){
 const{data:es}=await sb.from('encuestas').select('*').eq('group_id',gid);
 ENC={};if(!es||!es.length)return;
 const ids=es.map(e=>e.id);
 const{data:ts}=await sb.from('escuadras').select('*').in('encuesta_id',ids).order('orden');
 const{data:ms}=await sb.from('escuadra_miembros').select('*').in('encuesta_id',ids);
 es.forEach(e=>{ENC[e.id]={texto:e.texto,cerrada:e.cerrada,teams:(ts||[]).filter(t=>t.encuesta_id===e.id).map(t=>({id:t.id,nombre:t.nombre,m:(ms||[]).filter(x=>x.escuadra_id===t.id)}))}});
}
function initEncRT(){
 if(ERT)return;ERT=true;
 const again=()=>{if(GCUR)loadEnc(GCUR.id).then(drawMsgs)};
 sb.channel('enc-rt')
  .on('postgres_changes',{event:'*',schema:'public',table:'escuadra_miembros'},again)
  .on('postgres_changes',{event:'*',schema:'public',table:'encuestas'},again)
  .subscribe();
}
function encCard(m){
 const e=ENC[m.id],staff=canAdmin(GCUR);
 if(!e)return '<div class="enc"><div class="skel"><div class="shim"></div></div></div>';
 const mine=myTeam(m.id);
 const teams=e.teams.map((t,i)=>{
  const isMine=!!mine&&mine.tid===t.id,full=t.m.length>=4;
  const slots=[0,1,2,3].map(s=>{const x=t.m[s];return x?`<div class="slot filled" style="--d:${s*70}ms" title="${esc(pname(x.user_id))}">${av(PROF[x.user_id]||{name:'?'},pcol(x.user_id))}${staff?`<button class="rm" data-mv="${m.id}:${x.user_id}" title="Mover o quitar">⋯</button>`:''}</div>`:'<div class="slot"></div>'}).join('');
  return `<div class="team${isMine?' mine':''}${full&&!isMine?' full':''}" data-tm="${m.id}:${t.id}" style="animation-delay:${i*70}ms"><div class="tt"><b>${esc(t.nombre)}</b><small>${t.m.length}/4</small></div><div class="slots">${slots}</div>${staff?`<button class="addt" data-addt="${m.id}:${t.id}">＋ Añadir</button>`:''}</div>`;
 }).join('');
 const hint=mine&&!staff&&!e.cerrada?`<div class="hint">${winOpen(mine)?`Puedes cambiar de equipo durante <span data-cdu="${mine.unido}">${cuentaRegresiva(mine.unido)}</span>`:'Ya no puedes cambiar de equipo'}</div>`:'';
 return `<div class="enc${e.cerrada?' closed':''}"><div class="eh"><span class="ei">📋</span><div><b>${esc(m.body||'Encuesta')}</b><small>${esc(e.texto||'')}</small></div><span class="${e.cerrada?'badge-c':'badge-o'}">${e.cerrada?'Cerrada':'Abierta'}</span></div>${hint}<div class="teams">${teams}</div>${staff?`<div class="ebtns"><button class="ghost" data-tog="${m.id}">${e.cerrada?'Reabrir':'Cerrar'} encuesta</button></div>`:''}</div>`;
}
async function joinTeam(eid,tid){
 const e=ENC[eid];if(!e)return;
 if(e.cerrada)return toast('La encuesta está cerrada');
 const mine=myTeam(eid),t=e.teams.find(x=>x.id===tid);
 if(mine&&mine.tid===tid)return;
 if(mine&&!winOpen(mine))return toast('Ya pasaron los 5 minutos: no puedes cambiar de equipo');
 if(t.m.length>=4)return toast('Este equipo ya está completo');
 const{error}=mine
  ?await sb.from('escuadra_miembros').update({escuadra_id:tid}).eq('encuesta_id',eid).eq('user_id',ME.id)
  :await sb.from('escuadra_miembros').insert({encuesta_id:eid,user_id:ME.id,escuadra_id:tid});
 if(error)return toast(error.message);
 await loadEnc(GCUR.id);drawMsgs();toast('Estás en '+t.nombre);
}
function openSheetTeam(eid,uid){
 const e=ENC[eid],p=PROF[uid]||{name:'Miembro',username:''};
 const cur=(e.teams.find(t=>t.m.some(x=>x.user_id===uid))||{}).id;
 $('msh').innerHTML=`<div class="sheet"><div class="grab"></div><div class="ah">${av(p,pcol(uid))}<div class="ri"><b class="nm">${esc(p.name)}</b><small>@${esc(p.username)}</small></div></div><p class="lbl">Mover a otro equipo</p><div class="chips">${e.teams.filter(t=>t.id!==cur).map(t=>`<button class="chip" data-a2="mv:${eid}:${uid}:${t.id}" ${t.m.length>=4?'disabled':''}>→ ${esc(t.nombre)} (${t.m.length}/4)</button>`).join('')}</div><div class="chips"><button class="chip danger" data-a2="rm:${eid}:${uid}:0">Quitar del equipo</button></div><button class="ghost" data-x>Cerrar</button></div>`;
 $('msh').classList.remove('hidden');
}
function openAddSheet(eid,tid){
 const e=ENC[eid],t=e.teams.find(x=>x.id===tid);
 const inE=new Set(e.teams.flatMap(x=>x.m.map(z=>z.user_id)));
 const cand=memberIds(GCUR.id).filter(u=>!inE.has(u));
 $('msh').innerHTML=`<div class="sheet"><div class="grab"></div><p class="lbl">Agregar a ${esc(t.nombre)} (${t.m.length}/4)</p><div class="chips">${cand.map(u=>`<button class="chip" data-a2="add:${eid}:${u}:${tid}" ${t.m.length>=4?'disabled':''}>${esc(pname(u))}</button>`).join('')||'<small>Todos ya tienen equipo</small>'}</div><button class="ghost" data-x>Cerrar</button></div>`;
 $('msh').classList.remove('hidden');
}
$('msh').addEventListener('click',async e=>{
 const b=e.target.closest('[data-a2]');if(!b)return;
 const[a,eid,uid,tid]=b.dataset.a2.split(':');
 let err=null;
 if(a==='mv'){({error:err}=await sb.from('escuadra_miembros').update({escuadra_id:+tid}).eq('encuesta_id',+eid).eq('user_id',uid))}
 else if(a==='rm'){({error:err}=await sb.from('escuadra_miembros').delete().eq('encuesta_id',+eid).eq('user_id',uid))}
 else if(a==='add'){({error:err}=await sb.from('escuadra_miembros').insert({encuesta_id:+eid,user_id:uid,escuadra_id:+tid}))}
 if(err)return toast(err.message);
 $('msh').classList.add('hidden');await loadEnc(GCUR.id);drawMsgs();
});
$('msgs').addEventListener('click',async e=>{
 const q=s=>e.target.closest(s);
 const tog=q('[data-tog]'),tm2=q('[data-tm]'),mv=q('[data-mv]'),at=q('[data-addt]');
 if(tog){const id=+tog.dataset.tog;const{error}=await sb.from('encuestas').update({cerrada:!ENC[id].cerrada}).eq('id',id);if(error)return toast(error.message);await loadEnc(GCUR.id);return drawMsgs()}
 if(mv){const[eid,uid]=mv.dataset.mv.split(':');return openSheetTeam(+eid,uid)}
 if(at){const[eid,tid]=at.dataset.addt.split(':').map(Number);return openAddSheet(eid,tid)}
 if(tm2&&!canAdmin(GCUR)){const[eid,tid]=tm2.dataset.tm.split(':').map(Number);return joinTeam(eid,tid)}
});
async function crearEncuesta(){
 const titulo=$('enti').value.trim()||'Equipos',texto=$('ente').value.trim();
 const nombres=$('entm').value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,8);
 if(nombres.length<2)return toast('Escribe al menos 2 equipos (uno por línea)');
 const{data:m,error}=await sb.from('group_messages').insert({group_id:GCUR.id,sender:ME.id,kind:'encuesta',body:titulo}).select().single();
 if(error)return toast(error.message);
 const r1=await sb.from('encuestas').insert({id:m.id,group_id:GCUR.id,texto});
 if(r1.error)return toast(r1.error.message);
 const r2=await sb.from('escuadras').insert(nombres.map((n,i)=>({encuesta_id:m.id,nombre:n,orden:i})));
 if(r2.error)return toast(r2.error.message);
 $('enc').classList.add('hidden');$('enti').value='';$('ente').value='';
 if(!GMSG.some(x=>x.id===m.id))GMSG.push(m);
 await loadEnc(GCUR.id);drawMsgs();toast('Encuesta publicada');
}
$('encreate').onclick=crearEncuesta;

/* ---- Panel de información del grupo ---- */
function openGInfo(){
 const g=GCUR;if(!g)return;
 const adm=canAdmin(g),ids=memberIds(g.id),opt=(v,cur,l)=>`<option value="${v}"${cur===v?' selected':''}>${l}</option>`;
 const rows=ids.map((uid,i)=>{const p=PROF[uid]||{name:'Miembro',username:'?'};return `<div class="mrow2" data-pf="${uid}" style="animation-delay:${Math.min(i,15)*40}ms">${av(p,pcol(uid))}<div class="ri"><b class="nm">${esc(p.name)}${bdg(p)}${g.owner===uid?'<span class="own">Dueño</span>':''}</b><small>@${esc(p.username)}</small></div>${adm&&!g.clan&&uid!==ME.id?`<button class="ic" data-rmm="${uid}" title="Quitar del grupo">✕</button>`:''}</div>`}).join('');
 $('ginfo').innerHTML=`<div class="pwrap">
  <header class="phead"><button class="ic" data-close2>←</button><b>Info del grupo</b><span></span></header>
  <div class="hero${g.clan?' clanhero':''}">${gav(g)}<h2>${esc(g.name)}</h2><p>${catName(g)} · ${ids.length} miembros</p>${g.clan?'<span class="tagclan">⚔ CLAN OFICIAL</span>':''}</div>
  <div class="card2"><div class="sec">Miembros</div>${rows||'<p class="empty">Sin miembros</p>'}</div>
  ${adm?`<div class="card2"><div class="sec">Configuración</div>
   <label class="lab">Nombre<input id="gn2" maxlength="30" value="${esc(g.name)}"></label>
   <label class="lab">Foto del grupo<input id="gp2" type="file" accept="image/*"></label>
   <label class="lab">¿Quién puede mandar mensajes?<select id="gpm2">${opt('todos',g.permiso_mensajes,'Todos los miembros')}${opt('admins',g.permiso_mensajes,'Solo administradores')}</select></label>
   <label class="lab">¿Quién puede editar el nombre?<select id="gpn2">${opt('admins',g.permiso_nombre,'Solo administradores')}${opt('todos',g.permiso_nombre,'Todos los miembros')}</select></label>
   <label class="lab">¿Quién puede cambiar la foto?<select id="gpf2">${opt('admins',g.permiso_foto,'Solo administradores')}${opt('todos',g.permiso_foto,'Todos los miembros')}</select></label>
   ${g.categoria==='solo'?'<label class="lab">Agregar miembro por usuario<input id="gadd2" placeholder="usuario"></label>':''}
   <div class="rowbtns"><button class="btn" id="gsave2">Guardar cambios</button><button class="btn alt" id="genc">📋 Encuesta de equipos</button></div></div>`:''}
  ${!adm&&!g.clan?'<div class="card2"><button class="ghost danger" id="gleave">Salir del grupo</button></div>':''}
 </div>`;
 $('ginfo').classList.add('show');
}
async function saveGInfo(){
 const g=GCUR,up={permiso_mensajes:$('gpm2').value,permiso_nombre:$('gpn2').value,permiso_foto:$('gpf2').value};
 const nm=$('gn2').value.trim();if(nm&&nm!==g.name)up.name=nm;
 const{error}=await sb.from('groups').update(up).eq('id',g.id);
 if(error)return toast(error.message);
 const add=$('gadd2')?$('gadd2').value.trim():'';
 if(add)await addMember(g,add);
 await loadGroups();$('cName').textContent=(GCUR||g).name;openGInfo();render();toast('Cambios guardados');
}
$('ginfo').addEventListener('click',async e=>{
 const q=s=>e.target.closest(s),g=GCUR;
 if(q('[data-close2]'))return $('ginfo').classList.remove('show');
 const rm=q('[data-rmm]');
 if(rm){const{error}=await sb.from('group_members').delete().eq('group_id',g.id).eq('user_id',rm.dataset.rmm);if(error)return toast(error.message);await loadGroups();return openGInfo()}
 const pf=q('[data-pf]');if(pf)return openProfile(pf.dataset.pf);
 if(q('#gsave2'))return saveGInfo();
 if(q('#genc'))return $('enc').classList.remove('hidden');
 if(q('#gleave')){
  const{error}=await sb.from('group_members').delete().eq('group_id',g.id).eq('user_id',ME.id);
  if(error)return toast(error.message);
  $('ginfo').classList.remove('show');GCUR=null;$('chat').classList.add('hidden');$('empty').classList.remove('hidden');
  await loadGroups();render();
 }
});
$('ginfo').addEventListener('change',async e=>{
 if(e.target.id!=='gp2')return;
 const f=e.target.files[0];if(!f||!GCUR)return;
 const photo=await small(f,256);
 const{error}=await sb.from('groups').update({photo}).eq('id',GCUR.id);
 if(error)return toast(error.message);
 toast('Foto actualizada');await loadGroups();openGInfo();
});

/* ---- Información de contacto ---- */
function openProfile(uid){
 const p=PROF[uid];if(!p)return toast('Perfil no disponible');
 const c=CS.find(x=>x.friend===uid);
 const reg=p.created_at?new Date(p.created_at).toLocaleDateString('es',{day:'numeric',month:'long',year:'numeric'}):'Desconocida';
 const dias=p.created_at?Math.floor((Date.now()-new Date(p.created_at).getTime())/864e5):null;
 $('cinfo').innerHTML=`<div class="pwrap">
  <header class="phead"><button class="ic" data-close2>←</button><b>Info del contacto</b><span></span></header>
  <div class="hero">${av(p,pcol(uid))}<h2>${esc((c&&c.nickname)||p.name)}</h2><p>@${esc(p.username)}</p><div class="bds">${bdg(p)}</div></div>
  <div class="card2 info">
   <div class="ir"><span>📞</span><div><small>Número</small><b>${p.phone?esc(p.phone):'No compartido'}</b></div></div>
   <div class="ir"><span>📅</span><div><small>Se registró el</small><b>${reg}</b>${dias!==null?`<em>hace ${dias} días</em>`:''}</div></div>
   <div class="ir"><span>ℹ️</span><div><small>Info</small><b>${esc(p.about||'Sin info')}</b></div></div>
   ${c&&c.nickname&&c.nickname!==p.name?`<div class="ir"><span>🏷️</span><div><small>Nombre real</small><b>${esc(p.name)}</b></div></div>`:''}
  </div>
  <div class="rowbtns">${c?`<button class="btn" data-pm="${uid}">💬 Mensaje</button><button class="btn alt" data-pc="${uid}">📞 Llamar</button>`:`<button class="btn" data-padd="${uid}">＋ Agregar a mis chats</button>`}</div>
 </div>`;
 $('cinfo').classList.add('show');
}
$('cinfo').addEventListener('click',async e=>{
 const q=s=>e.target.closest(s);
 if(q('[data-close2]'))return $('cinfo').classList.remove('show');
 const pm=q('[data-pm]'),pc=q('[data-pc]'),pa=q('[data-padd]');
 if(pm){$('cinfo').classList.remove('show');return openChat(pm.dataset.pm)}
 if(pc){$('cinfo').classList.remove('show');return startCall(pc.dataset.pc,false)}
 if(pa){
  const p=PROF[pa.dataset.padd];
  const{error}=await sb.from('contacts').upsert({owner:ME.id,friend:p.id,nickname:p.name,bg:'fuego'},{onConflict:'owner,friend',ignoreDuplicates:true});
  if(error)return toast(error.message);
  await loadContacts();render();openProfile(p.id);toast('Agregado a tus chats');
 }
});

/* ---- Abrir la información tocando el nombre ---- */
$('cName').onclick=()=>GCUR?openGInfo():(CUR&&openProfile(CUR.friend));
$('cAv').onclick=$('cName').onclick;
$('cset').onclick=()=>GCUR?openGInfo():_cset();
