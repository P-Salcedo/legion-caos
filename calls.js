/* Llamadas de voz y video (WebRTC). La señalización viaja por Supabase Realtime (canales "call-ID"). */
const ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}].concat(window.LEGION_CONFIG&&window.LEGION_CONFIG.TURN?[window.LEGION_CONFIG.TURN]:[]);
const TONES={clasico:[440,480],campana:[660,990],caos:[880,220],trueno:[120,90]};
const TONE_NAMES={clasico:'Clásico',campana:'Campana',caos:'Caos',trueno:'Trueno'};
let INBOX=null,CHS={},PC=null,LS=null,CALLP=null,INC=null,PENDING=[],RINGT=null,ACX=null,TMO=null,TIMER=null,T0=0;
const mmss=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function audioCtx(){if(!ACX)ACX=new (window.AudioContext||window.webkitAudioContext)();if(ACX.state==='suspended')ACX.resume();return ACX}
document.addEventListener('pointerdown',()=>{try{audioCtx()}catch(e){}},{once:true});
function note(ctx,freq,type,at){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;o.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(.2,at);g.gain.exponentialRampToValueAtTime(.001,at+.3);o.start(at);o.stop(at+.32)}
function stopRing(){if(RINGT)clearInterval(RINGT);RINGT=null}
function ring(t){
 stopRing();const ctx=audioCtx(),f=TONES[t]||TONES.clasico,ty=t==='trueno'?'sawtooth':'sine';
 const pulse=()=>{const n=ctx.currentTime;note(ctx,f[0],ty,n);note(ctx,f[1],ty,n+.35);if(navigator.vibrate)navigator.vibrate(200)};
 pulse();RINGT=setInterval(pulse,1500);
}
const playTone=t=>{ring(t);setTimeout(stopRing,1800)};
function chFor(id){
 if(!CHS[id])CHS[id]=new Promise(res=>{const ch=sb.channel('call-'+id);ch.subscribe(s=>{if(s==='SUBSCRIBED')res(ch)})});
 return CHS[id];
}
async function sendTo(id,p){const ch=await chFor(id);ch.send({type:'broadcast',event:'sig',payload:Object.assign({from:ME.id,to:id},p)})}
function initCalls(){if(INBOX)return;INBOX=sb.channel('call-'+ME.id).on('broadcast',{event:'sig'},({payload})=>onSig(payload)).subscribe()}
function flushIce(){PENDING.forEach(c=>PC&&PC.addIceCandidate(c).catch(()=>{}));PENDING=[]}
function onSig(p){
 if(!p||p.to!==ME.id)return;
 if(p.t==='offer'){if(PC||INC)return sendTo(p.from,{t:'busy'});INC=p;showInc(p);ring(ME.tono||'clasico');return}
 if(p.t==='answer'&&PC){PC.setRemoteDescription(p.sdp).then(flushIce).catch(()=>{});return}
 if(p.t==='ice'){if(PC&&PC.remoteDescription)PC.addIceCandidate(p.c).catch(()=>{});else PENDING.push(p.c);return}
 if(p.t==='end'||p.t==='decline'||p.t==='busy'){toast(p.t==='busy'?'Está en otra llamada':p.t==='decline'?'Rechazaron la llamada':'La llamada terminó');endCall(false)}
}
function showInc(p){
 const c=CS.find(x=>x.friend===p.from),nm=c?(c.nickname||c.p.name):(p.name||'Llamada');
 $('icn').textContent=nm;$('ict').textContent=p.video?'Videollamada entrante…':'Llamada entrante…';
 $('ica').innerHTML=av({name:nm,photo:c&&c.p.photo},'#8e24aa');$('inc').classList.remove('hidden');
}
function startTimer(){if(TIMER)return;T0=Date.now();TIMER=setInterval(()=>{$('cst').textContent='Conectado · '+mmss(Math.floor((Date.now()-T0)/1e3))},1e3)}
function setupPC(id,vid,st){
 CALLP=id;PC=new RTCPeerConnection({iceServers:ICE});
 if(LS)LS.getTracks().forEach(t=>PC.addTrack(t,LS));
 PC.onicecandidate=e=>{if(e.candidate)sendTo(id,{t:'ice',c:e.candidate.toJSON()})};
 PC.ontrack=e=>{const v=$('rv');v.srcObject=e.streams[0];v.classList.toggle('hidden',!vid);v.play().catch(()=>{})};
 PC.onconnectionstatechange=()=>{
  const s=PC&&PC.connectionState;
  if(s==='connected'){clearTimeout(TMO);$('cst').textContent='Conectado';startTimer()}
  else if(s==='failed'){toast('No se pudo conectar. Prueba en la misma red o configura TURN.');endCall(true)}
 };
 const c=CS.find(x=>x.friend===id),nm=c?(c.nickname||c.p.name):'Llamada';
 $('cn').textContent=nm;$('cst').textContent=st;$('cav').innerHTML=av({name:nm,photo:c&&c.p.photo},'#8e24aa');
 const lv=$('lv');lv.srcObject=LS&&vid?LS:null;lv.classList.toggle('hidden',!(LS&&vid));
 $('call').classList.remove('hidden');
}
async function startCall(id,vid){
 const c=CS.find(x=>x.friend===id);if(!c||PC||INC)return;
 try{LS=await navigator.mediaDevices.getUserMedia({audio:true,video:!!vid})}
 catch(e){return toast('Necesitas dar permiso de micrófono'+(vid?' y cámara':''))}
 setupPC(id,!!vid,'Llamando…');
 try{const o=await PC.createOffer();await PC.setLocalDescription(o);sendTo(id,{t:'offer',sdp:{type:o.type,sdp:o.sdp},name:ME.name,video:!!vid})}
 catch(e){toast('No se pudo llamar');endCall(false);return}
 TMO=setTimeout(()=>{if(PC&&PC.connectionState!=='connected'){toast('No contestó');endCall(true)}},45000);
}
async function acceptCall(){
 const p=INC;if(!p)return;INC=null;stopRing();$('inc').classList.add('hidden');
 try{LS=await navigator.mediaDevices.getUserMedia({audio:true,video:!!p.video})}
 catch(e){sendTo(p.from,{t:'decline'});return toast('Necesitas permiso de micrófono'+(p.video?' y cámara':''))}
 setupPC(p.from,!!p.video,'Conectando…');
 try{await PC.setRemoteDescription(p.sdp);flushIce();const a=await PC.createAnswer();await PC.setLocalDescription(a);sendTo(p.from,{t:'answer',sdp:{type:a.type,sdp:a.sdp}})}
 catch(e){toast('No se pudo contestar');endCall(true)}
}
function declineCall(){if(INC)sendTo(INC.from,{t:'decline'});INC=null;stopRing();$('inc').classList.add('hidden')}
function endCall(notify=true){
 if(notify&&CALLP)sendTo(CALLP,{t:'end'});
 if(notify&&INC)sendTo(INC.from,{t:'decline'});
 clearTimeout(TMO);clearInterval(TIMER);TIMER=null;
 if(PC){PC.close();PC=null}
 if(LS){LS.getTracks().forEach(t=>t.stop());LS=null}
 PENDING=[];CALLP=null;INC=null;stopRing();
 $('call').classList.add('hidden');$('inc').classList.add('hidden');$('lv').srcObject=null;$('rv').srcObject=null;
}
$('cend').onclick=()=>endCall(true);
$('iacc').onclick=acceptCall;
$('idec').onclick=declineCall;
$('cmute').onclick=()=>{if(!LS)return;const mute=LS.getAudioTracks().some(t=>t.enabled);LS.getAudioTracks().forEach(t=>t.enabled=!mute);$('cmute').classList.toggle('on',mute);$('cmute').textContent=mute?'🔇':'🎙️'};
$('acall').onclick=()=>{if(CUR)startCall(CUR.friend,false)};
$('vcall').onclick=()=>{if(CUR)startCall(CUR.friend,true)};
