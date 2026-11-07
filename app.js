const C=window.LEGION_CONFIG||{};
const CONFIG_OK=typeof supabase!=='undefined'&&!!C.SUPABASE_URL&&!!C.SUPABASE_ANON_KEY&&!/TU-PROYECTO|PEGA_AQUI/.test(C.SUPABASE_URL+C.SUPABASE_ANON_KEY);
const sb=CONFIG_OK?supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
const $=i=>document.getElementById(i),TT={chats:'Chats',estados:'Estados',mod:'Moderación',cfg:'Configuración'};
const BADGES={0:['👑','Creador','#ffd600'],1:['🛡️','Moderación','#ff3d5a'],2:['🎬','Creador de contenido','#40c4ff'],3:['💎','Patrocinador','#b388ff'],4:['💞','Parejas','#ff80ab'],5:['🎖️','Veterano','#ffab40'],6:['🚫','Baneado','#ff1744']};
const BGS={fuego:'Llamas de código',matriz:'Lluvia de código',sangre:'Sangre',abismo:'Abismo',negro:'Negro'};
const CH='{}<>/;=+01*#$&%:';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const tm=t=>new Date(t).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
const toast=m=>{const t=document.createElement('div');t.className='toastm';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2600)};
const av=(p,c)=>p&&p.photo?`<div class="av" style="background-image:url(${p.photo})"></div>`:`<div class="av" style="background-color:${c||'#555'}">${esc(((p&&p.name)||'?')[0]).toUpperCase()}</div>`;
const bdg=p=>(p.badges||[]).filter(i=>BADGES[i]).sort((a,b)=>a-b).map(i=>`<span class="bd" style="--bc:${BADGES[i][2]}" title="${BADGES[i][1]}">${BADGES[i][0]}</span>`).join('');
const mail=async u=>{const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(u));return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,40)+'@legion.app'};
const small=(f,max)=>new Promise(res=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.75))};im.src=r.result};r.readAsDataURL(f)});
let ME=null,CS=[],CUR=null,MSG=[],ST=[],TAB='chats',cmBg='fuego',CFG={maintenance:false,message:''};
const normPhone=s=>{const t=String(s||'').replace(/[\s\-().]/g,'');return /^\+\d{8,15}$/.test(t)?t:null};
const fail=m=>{const t=String((m&&m.message)||m);if($('login').classList.contains('hidden'))toast('Error: '+t);else $('lerr').textContent=t};
addEventListener('error',e=>fail(e.message));
addEventListener('unhandledrejection',e=>fail(e.reason));

/* ---------- Fondos animados ---------- */
const cv=$('bgc'),g=cv.getContext('2d'),PAL=[],SC=[[0,0,0],[110,0,0],[220,40,0],[255,120,0],[255,215,60],[255,255,200]];
for(let i=0;i<256;i++){const t=i/255*5,k=Math.min(4,t|0),f=t-k,a=SC[k],b=SC[k+1];PAL.push('rgb('+a.map((v,j)=>v+(b[j]-v)*f|0).join(',')+')')}
let FC=0,FR=0,FH=null,DR=[],run=false,ft=0,MODE='negro';
function setBg(k){
 const c=$('chat');c.classList.remove(...Object.keys(BGS).map(x=>'bg-'+x));c.classList.add('bg-'+k);
 MODE=k;const fx=k==='fuego'||k==='matriz',was=run;run=fx;cv.classList.toggle('hidden',!fx);
 if(fx){cv.width=c.clientWidth;cv.height=c.clientHeight;FC=Math.ceil(cv.width/9);FR=Math.ceil(cv.height/14);FH=new Uint8Array(FC*FR);DR=[];g.font='12px Consolas,monospace';if(!was)requestAnimationFrame(frame)}
}
function frame(){
 if(!run)return;requestAnimationFrame(frame);if(++ft&1)return;
 const W=cv.width,H=cv.height;g.fillStyle='#050505';g.fillRect(0,0,W,H);
 if(MODE==='fuego'){
  const C2=FC,R=FR,F=FH,dec=900/R;
  for(let x=0;x<C2;x++){F[(R-1)*C2+x]=Math.random()<.6?255:Math.random()*120|0;F[(R-2)*C2+x]=Math.random()<.5?255:Math.random()*160|0}
  for(let y=0;y<R-2;y++)for(let x=1;x<C2-1;x++){const j=(y+1)*C2+x;F[y*C2+x]=Math.max(0,(F[j-1]+F[j]+F[j+1]+F[j+C2])/4-dec*Math.random()*1.3)}
  for(let y=0;y<R;y++)for(let x=0;x<C2;x++){const v=F[y*C2+x];if(v>12){g.fillStyle=PAL[v];g.fillText(CH[Math.random()*CH.length|0],x*9,y*14)}}
 }else{
  if(DR.length!==FC)DR=Array.from({length:FC},()=>Math.random()*FR|0);
  DR.forEach((y,i)=>{g.fillStyle=Math.random()<.1?'#ffd6dc':'#ff3b4d';g.fillText(CH[Math.random()*CH.length|0],i*9,y*14);DR[i]=y*14>H&&Math.random()>.97?0:y+1});
 }
}

/* ---------- Acceso ---------- */
$('lf').onsubmit=async e=>{
 e.preventDefault();$('lerr').textContent='';
 if(!sb)return $('lerr').textContent='Falta configurar config.js (URL y clave de Supabase). Mira el Paso 2 del README.';
 const raw=$('lu').value.trim(),u=raw.toLowerCase(),p=$('lp').value;
 if(u.length<3)return $('lerr').textContent='El usuario debe tener al menos 3 caracteres';
 if(p.length<6)return $('lerr').textContent='La contraseña debe tener al menos 6 caracteres';
 const email=await mail(u);
 const r=await sb.auth.signInWithPassword({email,password:p});
 if(r.error&&/confirm/i.test(r.error.message))return $('lerr').textContent='Desactiva "Confirm email" en Supabase (Authentication → Sign In / Providers → Email). Mira el Paso 1 del README.';
 if(r.error){
  const s=await sb.auth.signUp({email,password:p,options:{data:{username:u,name:raw}}});
  if(s.error){const m=s.error.message;return $('lerr').textContent=/already/i.test(m)?'Usuario o contraseña incorrectos':/database error/i.test(m)?'La base de datos no está lista: ejecuta supabase.sql y supabase-v2.sql en el SQL Editor':m}
  if(!s.data.session)return $('lerr').textContent='Cuenta creada, pero falta desactivar "Confirm email" en Supabase (Authentication → Sign In / Providers → Email). Mira el Paso 1 del README.';
 }
 await start();
};
async function loadCfg(){if(!sb)return;
 const{data}=await sb.from('app_config').select('maintenance,message').eq('id',1).single();
 if(data)CFG=data;
 const b=$('lmsg');
 if(CFG.maintenance){b.textContent='🛠️ En mantenimiento: '+(CFG.message||'Volvemos pronto.')+' Solo moderadores y el creador pueden entrar.';b.classList.remove('hidden')}
}
function overlay(kind,msg){
 const o=$(kind);o.querySelector('.msg').textContent=msg;o.classList.remove('hidden');
 o.querySelector('button').onclick=async()=>{await sb.auth.signOut();location.reload()};
}
async function setMt(on){
 const message=$('mtm').value.trim()||'Estamos en mantenimiento. Volvemos pronto.';
 const{error}=await sb.from('app_config').update({maintenance:on,message}).eq('id',1);
 if(error)return toast(error.message);
 CFG={maintenance:on,message};toast(on?'Mantenimiento activado':'Mantenimiento desactivado');cfg();
}
async function diag(){
 const L=[];
 if(!(window.crypto&&crypto.subtle))L.push('❌ Abre el link https de GitHub Pages: este navegador bloquea el cifrado en esta página.');
 if(!sb)L.push('❌ config.js: falta la URL o la clave, o no cargó Supabase (revisa tu conexión).');
 else{
  L.push('✅ config.js: URL y clave cargadas.');
  const{data,error}=await sb.from('app_config').select('id').eq('id',1);
  if(error){const m=error.message||'';L.push(/fetch/i.test(m)?'❌ No hay conexión con tu URL de Supabase (revisa config.js).':(/does not exist|schema cache|PGRST205/i.test(m)||error.code==='PGRST205'||error.code==='42P01')?'❌ Faltan tablas: ejecuta supabase.sql y luego supabase-v2.sql.':'❌ Base de datos: '+m)}
  else if(!data||!data.length)L.push('❌ Falta la fila de configuración: ejecuta supabase-v2.sql.');
  else L.push('✅ Base de datos: tablas listas.');
 }
 const d=$('diag');d.textContent=L.join('\n');d.classList.remove('hidden');
}
async function start(){
 const{data:{user}}=await sb.auth.getUser();if(!user)return;
 const pr=await sb.from('profiles').select('*').eq('id',user.id).single();
 if(pr.error||!pr.data)throw new Error('No se encontró tu perfil. Ejecuta supabase.sql y luego supabase-v2.sql en el SQL Editor de Supabase');
 ME=pr.data;
 $('login').classList.add('hidden');
 await loadCfg();
 const mod=(ME.badges||[]).some(b=>b===0||b===1);
 if((ME.badges||[]).includes(6))return overlay('ban',`Usted ha sido baneado por el administrador ${ME.banned_by||'(desconocido)'}.`);
 if(CFG.maintenance&&!mod)return overlay('mant',CFG.message||'Estamos en mantenimiento. Volvemos pronto.');
 $('app').classList.remove('hidden');
 $('navMod').classList.toggle('hidden',!(ME.badges||[]).some(b=>b===0||b===1));
 $('myAv').innerHTML=av(ME,'#ff1f3d');
 sb.channel('mensajes').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},p=>onMsg(p.new)).subscribe();
 await loadContacts();render();
}

/* ---------- Datos ---------- */
async function loadContacts(){
 const{data:cs}=await sb.from('contacts').select('*').eq('owner',ME.id);
 const list=cs||[],ids=list.map(c=>c.friend);
 const{data:ps}=ids.length?await sb.from('profiles').select('*').in('id',ids):{data:[]};
 CS=list.map(c=>Object.assign({},c,{p:(ps||[]).find(x=>x.id===c.friend)||{name:'?',badges:[]}}));
}
async function loadSt(){
 const{data}=await sb.from('statuses').select('*').order('created_at',{ascending:false});
 const now=Date.now(),v=(data||[]).filter(s=>new Date(s.expires_at)>now),ids=[...new Set(v.map(s=>s.author))];
 const{data:ps}=ids.length?await sb.from('profiles').select('*').in('id',ids):{data:[]};
 ST=v.map(s=>Object.assign({},s,{p:(ps||[]).find(x=>x.id===s.author)||{name:'?',badges:[]}}));
}
async function loadMod(){
 const{data}=await sb.from('profiles').select('*').order('name');
 const creator=(ME.badges||[]).includes(0);
 $('list').innerHTML=(data||[]).map(p=>`<div style="padding:10px 16px;border-bottom:1px solid var(--bd)"><div class="ri"><b>${esc(p.name)} ${bdg(p)}</b><small>@${esc(p.username)}</small></div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${Object.keys(BADGES).map(i=>{const on=(p.badges||[]).includes(+i),can=+i!==0&&!(p.badges||[]).includes(0)&&(creator||(+i>=2&&!(p.badges||[]).includes(1)));return `<button class="ghost" data-bd="${p.id}:${i}" style="padding:4px 9px;font-size:12px;${on?`background:${BADGES[i][2]};color:#000;border-color:transparent`:''}" ${can?'':'disabled'}>${BADGES[i][0]} ${BADGES[i][1]}</button>`}).join('')}</div></div>`).join('');
}

/* ---------- Vistas ---------- */
function render(){
 $('stitle').textContent=TT[TAB];$('addb').classList.toggle('hidden',TAB!=='chats'&&TAB!=='estados');
 if(TAB==='chats')$('list').innerHTML=CS.map(c=>`<div class="row" data-f="${c.friend}">${av(c.p,'#8e24aa')}<div class="ri"><b>${esc(c.nickname||c.p.name)}${bdg(c.p)}</b><small>${esc(c.p.name)} · @${esc(c.p.username)}</small></div></div>`).join('')||'<p class="empty">Aún no tienes chats. Toca ＋ para agregar a alguien.</p>';
 else if(TAB==='estados')$('list').innerHTML=`<div class="row" data-new="1">${av(ME,'#ff1f3d')}<div class="ri"><b>Publicar estado</b><small>Visible 24 h</small></div></div>`+(ST.map(s=>`<div class="row">${av(s.p,'#7a0010')}<div class="ri"><b>${esc(s.p.name)}${bdg(s.p)}</b><small>${esc(s.body)} · ${Math.max(1,Math.ceil((new Date(s.expires_at)-Date.now())/36e5))} h restantes</small></div>${s.author===ME.id?`<button class="ic" data-del="${s.id}">🗑️</button>`:''}</div>`).join('')||'<p class="empty">Sin estados activos</p>');
 else if(TAB==='cfg')cfg();
 else loadMod();
}
function cfg(){
 $('list').innerHTML=`<div style="padding:16px 18px;display:flex;flex-direction:column;gap:12px">
<div class="av" style="width:72px;height:72px;font-size:28px;background-color:#ff1f3d${ME.photo?';background-image:url('+ME.photo+')':''}">${ME.photo?'':esc((ME.name||'?')[0]).toUpperCase()}</div>
<label class="copy" style="text-align:left">Nombre<input id="cfgn" maxlength="24" value="${esc(ME.name)}"></label>
<label class="copy" style="text-align:left">Info<input id="cfga" maxlength="60" value="${esc(ME.about||'')}"></label>
<label class="copy" style="text-align:left">Número de teléfono<input id="cfgph" value="${esc(ME.phone||'')}" placeholder="+52 55 1234 5678" maxlength="20"></label>
<label class="copy" style="text-align:left">Foto de perfil<input type="file" id="cfgp" accept="image/*"></label>
<div>${bdg(ME)||'<small class="copy">Sin insignias</small>'}</div>
${(ME.badges||[]).includes(0)?`<div class="sec" style="padding:8px 0">Creador · Mantenimiento</div><p class="copy" style="text-align:left">Estado: <b style="color:${CFG.maintenance?'#ff6b6b':'#7cfc9a'}">${CFG.maintenance?'EN MANTENIMIENTO':'ACTIVO'}</b></p><textarea id="mtm" rows="2" maxlength="200" placeholder="Mensaje para los usuarios">${esc(CFG.message)}</textarea><button class="btn" id="mton" style="background:#ff1744;color:#fff">🛠️ Activar mantenimiento</button><button class="ghost" id="mtoff">✅ Quitar mantenimiento</button>`:''}
<button class="ghost" id="out" style="align-self:flex-start">Cerrar sesión</button></div>`;
 $('cfgn').onchange=async e=>{const v=e.target.value.trim()||ME.name;const{error}=await sb.from('profiles').update({name:v}).eq('id',ME.id);if(error)return toast(error.message);ME.name=v;$('myAv').innerHTML=av(ME,'#ff1f3d')};
 $('cfga').onchange=e=>sb.from('profiles').update({about:e.target.value.trim()}).eq('id',ME.id);
 $('cfgp').onchange=async e=>{const f=e.target.files[0];if(!f)return;const photo=await small(f,256);const{error}=await sb.from('profiles').update({photo}).eq('id',ME.id);if(error)return toast(error.message);ME.photo=photo;$('myAv').innerHTML=av(ME,'#ff1f3d');cfg()};
 $('out').onclick=async()=>{await sb.auth.signOut();location.reload()};
 $('cfgph').onchange=async e=>{
  const raw=e.target.value.trim(),v=raw?normPhone(raw):null;
  if(raw&&!v)return toast('Escribe el número con código de país, ej. +52 55 1234 5678');
  const{error}=await sb.from('profiles').update({phone:v}).eq('id',ME.id);
  if(error)return toast(/unique|duplicate/i.test(error.message)?'Ese número ya está registrado':error.message);
  ME.phone=v;toast('Número guardado');
 };
 if($('mton')){$('mton').onclick=()=>setMt(true);$('mtoff').onclick=()=>setMt(false)}
}
function drawMsgs(){const el=$('msgs');el.innerHTML=MSG.map(m=>`<div class="b${m.sender===ME.id?' me':''}">${m.img?`<img src="${m.img}" alt="">`:''}${m.body?esc(m.body):''}<small>${tm(m.created_at)}</small></div>`).join('');el.scrollTop=el.scrollHeight}
async function openChat(f){
 CUR=CS.find(c=>c.friend===f);if(!CUR)return;
 $('pane').classList.add('open');$('empty').classList.add('hidden');$('chat').classList.remove('hidden');
 $('cAv').innerHTML=av(CUR.p,'#8e24aa');$('cName').textContent=CUR.nickname||CUR.p.name;$('cSub').textContent=CUR.p.name+' · @'+CUR.p.username;
 setBg(CUR.bg||'fuego');
 const{data}=await sb.from('messages').select('*').or(`and(sender.eq.${ME.id},receiver.eq.${f}),and(sender.eq.${f},receiver.eq.${ME.id})`).order('created_at').limit(300);
 MSG=data||[];drawMsgs();
}
function onMsg(m){
 const mine=m.sender===ME.id;
 if(!mine&&!CS.some(c=>c.friend===m.sender))loadContacts().then(render);
 if(CUR&&((m.sender===CUR.friend&&m.receiver===ME.id)||(m.sender===ME.id&&m.receiver===CUR.friend))){
  if(!MSG.some(x=>x.id===m.id)){MSG.push(m);drawMsgs()}
 }else if(!mine){const c=CS.find(x=>x.friend===m.sender);toast('Nuevo mensaje de '+(c?(c.nickname||c.p.name):'alguien'))}
}

/* ---------- Acciones ---------- */
$('cin').onsubmit=async e=>{
 e.preventDefault();const t=$('txt').value.trim();if(!t||!CUR)return;$('txt').value='';
 const{data,error}=await sb.from('messages').insert({sender:ME.id,receiver:CUR.friend,body:t}).select().single();
 if(error)return toast(error.message);
 if(!MSG.some(x=>x.id===data.id)){MSG.push(data);drawMsgs()}
};
$('addb').onclick=()=>$(TAB==='chats'?'am':'pm').classList.remove('hidden');
$('ago').onclick=async()=>{
 const raw=$('au').value.trim();$('aerr').textContent='';
 if(!raw)return $('aerr').textContent='Escribe el usuario o el número de teléfono';
 const n=normPhone(raw),isPh=raw[0]==='+';
 const r=isPh?await sb.from('profiles').select('*').eq('phone',n||'').maybeSingle():await sb.from('profiles').select('*').eq('username',raw.toLowerCase()).maybeSingle();
 const p=r.data;
 
 if(!p)return $('aerr').textContent=isPh?(n?'No existe ningún usuario con ese número':'Número inválido. Incluye el código de país (ej. +52 55 1234 5678)'):'No existe ese usuario. Si es un número, escríbelo con código de país (ej. +52...)';
 if(p.id===ME.id)return $('aerr').textContent='Ese eres tú';
 const{error}=await sb.from('contacts').upsert({owner:ME.id,friend:p.id,nickname:($('an').value.trim()||p.name),bg:'fuego'},{onConflict:'owner,friend',ignoreDuplicates:true});
 if(error)return $('aerr').textContent=error.message;
 $('am').classList.add('hidden');$('au').value='';$('an').value='';await loadContacts();render();
};
$('bgs').innerHTML=Object.keys(BGS).map(k=>`<button data-bg="${k}" class="bg-${k}">${BGS[k]}</button>`).join('');
function pick(k){cmBg=k;document.querySelectorAll('#bgs button').forEach(b=>b.classList.toggle('on',b.dataset.bg===k))}
$('bgs').onclick=e=>{const b=e.target.closest('button');if(b)pick(b.dataset.bg)};
$('cset').onclick=()=>{$('cnick').value=CUR.nickname||'';$('cnick').placeholder=CUR.p.name;pick(CUR.bg||'fuego');$('cm').classList.remove('hidden')};
$('csave').onclick=async()=>{
 const nickname=$('cnick').value.trim()||null;
 const{error}=await sb.from('contacts').update({nickname,bg:cmBg}).eq('owner',ME.id).eq('friend',CUR.friend);
 if(error)return toast(error.message);
 Object.assign(CUR,{nickname,bg:cmBg});$('cm').classList.add('hidden');$('cName').textContent=nickname||CUR.p.name;setBg(cmBg);render();
};
$('cdel').onclick=async()=>{
 await sb.from('contacts').delete().eq('owner',ME.id).eq('friend',CUR.friend);
 $('cm').classList.add('hidden');$('chat').classList.add('hidden');$('empty').classList.remove('hidden');
 CUR=null;run=false;await loadContacts();render();
};
$('sto').onclick=async()=>{
 const body=$('stx').value.trim();if(!body)return;
 const{error}=await sb.from('statuses').insert({author:ME.id,body});
 if(error)return toast(error.message);
 $('pm').classList.add('hidden');$('stx').value='';await loadSt();render();
};
$('list').onclick=async e=>{
 const t=e.target.closest('[data-f],[data-new],[data-del],[data-bd]');if(!t)return;
 if(t.dataset.f)return openChat(t.dataset.f);
 if(t.dataset.new)return $('pm').classList.remove('hidden');
 if(t.dataset.del){await sb.from('statuses').delete().eq('id',t.dataset.del);await loadSt();return render()}
 if(t.dataset.bd){
  const[pid,bid]=t.dataset.bd.split(':'),id=+bid;
  const{data:p}=await sb.from('profiles').select('badges').eq('id',pid).single();
  const cur=p.badges||[],nb=cur.includes(id)?cur.filter(x=>x!==id):cur.concat([id]);
  const{error}=await sb.from('profiles').update({badges:nb}).eq('id',pid);
  if(error)toast(error.message);
  return loadMod();
 }
};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('.modal').classList.add('hidden'));
document.querySelectorAll('#nav [data-tab]').forEach(b=>b.onclick=async()=>{
 TAB=b.dataset.tab;document.querySelectorAll('#nav [data-tab]').forEach(x=>x.classList.toggle('on',x===b));
 if(TAB==='estados')await loadSt();
 render();
});
$('myAv').onclick=()=>document.querySelector('#nav [data-tab="cfg"]').click();
$('back').onclick=()=>{$('pane').classList.remove('open');run=false};
loadCfg();
$('dg').onclick=diag;
if(sb)sb.auth.getSession().then(({data})=>{if(data.session)start()});
else $('lerr').textContent='Falta configurar config.js. Mira el Paso 2 del README.';
