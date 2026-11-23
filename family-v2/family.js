/* Family games 2.0.0 — classic, local and Chrome 95 compatible. */
(function () {
  'use strict';
  if (window.FamilyV2) return;
  window.FAMILY_V2_SYLLABLES = {
  a: ['a'], abrir: ['a', 'brir'], adultos: ['a', 'dul', 'tos'],
  al: ['al'], aleatorias: ['a', 'le', 'a', 'to', 'rias'],
  ana: ['a', 'na'], animaciones: ['a', 'ni', 'ma', 'cio', 'nes'],
  anuncios: ['a', 'nun', 'cios'], aspecto: ['as', 'pec', 'to'],
  atrás: ['a', 'trás'], aventura: ['a', 'ven', 'tu', 'ra'],
  bien: ['bien'], cada: ['ca', 'da'], calculamos: ['cal', 'cu', 'la', 'mos'],
  cantidades: ['can', 'ti', 'da', 'des'], cantidad: ['can', 'ti', 'dad'],
  casa: ['ca', 'sa'], cero: ['ce', 'ro'], cerrada: ['ce', 'rra', 'da'],
  cerrar: ['ce', 'rrar'], círculo: ['cír', 'cu', 'lo'], cole: ['co', 'le'],
  cometa: ['co', 'me', 'ta'], compara: ['com', 'pa', 'ra'],
  confirmar: ['con', 'fir', 'mar'], con: ['con'], contamos: ['con', 'ta', 'mos'], contar: ['con', 'tar'],
  controles: ['con', 'tro', 'les'], cortos: ['cor', 'tos'],
  cuadrado: ['cua', 'dra', 'do'], cuál: ['cuál'], cuántas: ['cuán', 'tas'],
  cuántos: ['cuán', 'tos'], cuatro: ['cua', 'tro'], cuenta: ['cuen', 'ta'],
  cuentas: ['cuen', 'tas'], cuentos: ['cuen', 'tos'], curva: ['cur', 'va'],
  de: ['de'], del: ['del'], descubre: ['des', 'cu', 'bre'],
  descubrimos: ['des', 'cu', 'bri', 'mos'], día: ['dí', 'a'],
  dibujos: ['di', 'bu', 'jos'], donde: ['don', 'de'], dos: ['dos'],
  el: ['el'], elemento: ['e', 'le', 'men', 'to'], elige: ['e', 'li', 'ge'],
  empieza: ['em', 'pie', 'za'], en: ['en'], entrar: ['en', 'trar'],
  es: ['es'], esquinas: ['es', 'qui', 'nas'], esta: ['es', 'ta'],
  está: ['es', 'tá'], eva: ['e', 'va'], fíjate: ['fí', 'ja', 'te'],
  figuras: ['fi', 'gu', 'ras'], formas: ['for', 'mas'],
  geométricas: ['ge', 'o', 'mé', 'tri', 'cas'], grupo: ['gru', 'po'],
  ha: ['ha'], hacia: ['ha', 'cia'], hasta: ['has', 'ta'], hay: ['hay'],
  historias: ['his', 'to', 'rias'], hugo: ['hu', 'go'],
  iguales: ['i', 'gua', 'les'], inicio: ['i', 'ni', 'cio'],
  inténtalo: ['in', 'tén', 'ta', 'lo'], juego: ['jue', 'go'],
  junta: ['jun', 'ta'], juntar: ['jun', 'tar'], la: ['la'], lados: ['la', 'dos'],
  largos: ['lar', 'gos'], leo: ['le', 'o'], línea: ['lí', 'ne', 'a'],
  llegamos: ['lle', 'ga', 'mos'], lola: ['lo', 'la'], lolo: ['lo', 'lo'],
  los: ['los'], luna: ['lu', 'na'], más: ['más'],
  matemáticas: ['ma', 'te', 'má', 'ti', 'cas'], mayor: ['ma', 'yor'],
  menor: ['me', 'nor'], menos: ['me', 'nos'], mientras: ['mien', 'tras'],
  mira: ['mi', 'ra'], multiplicación: ['mul', 'ti', 'pli', 'ca', 'ción'],
  mundo: ['mun', 'do'], muñeca: ['mu', 'ñe', 'ca'], ni: ['ni'],
  ninguno: ['nin', 'gu', 'no'], no: ['no'], noche: ['no', 'che'],
  nuevo: ['nue', 'vo'], números: ['nú', 'me', 'ros'], o: ['o'],
  objeto: ['ob', 'je', 'to'], objetos: ['ob', 'je', 'tos'],
  operación: ['o', 'pe', 'ra', 'ción'], otro: ['o', 'tro'],
  página: ['pá', 'gi', 'na'], paloma: ['pa', 'lo', 'ma'], para: ['pa', 'ra'],
  parque: ['par', 'que'], patio: ['pa', 'tio'], pelota: ['pe', 'lo', 'ta'],
  pepe: ['pe', 'pe'], pequeño: ['pe', 'que', 'ño'], pequeños: ['pe', 'que', 'ños'],
  plaza: ['pla', 'za'], podido: ['po', 'di', 'do'],
  pregunta: ['pre', 'gun', 'ta'], preparando: ['pre', 'pa', 'ran', 'do'],
  primaria: ['pri', 'ma', 'ria'], primer: ['pri', 'mer'], primero: ['pri', 'me', 'ro'],
  problemas: ['pro', 'ble', 'mas'], puntos: ['pun', 'tos'], qué: ['qué'],
  que: ['que'], quedan: ['que', 'dan'], quitamos: ['qui', 'ta', 'mos'],
  quitar: ['qui', 'tar'], recibe: ['re', 'ci', 'be'],
  reconoce: ['re', 'co', 'no', 'ce'], recta: ['rec', 'ta'],
  rectángulo: ['rec', 'tán', 'gu', 'lo'], rectas: ['rec', 'tas'],
  rectos: ['rec', 'tos'], redondo: ['re', 'don', 'do'], regala: ['re', 'ga', 'la'],
  reinicio: ['rei', 'ni', 'cio'], reiniciar: ['rei', 'ni', 'ciar'], reintentar: ['rein', 'ten', 'tar'],
  representa: ['re', 'pre', 'sen', 'ta'], respuesta: ['res', 'pues', 'ta'],
  restas: ['res', 'tas'], resultado: ['re', 'sul', 'ta', 'do'],
  resuelto: ['re', 'suel', 'to'], resuelve: ['re', 'suel', 've'], reto: ['re', 'to'],
  saltos: ['sal', 'tos'], se: ['se'], segundo: ['se', 'gun', 'do'],
  señala: ['se', 'ña', 'la'], sesión: ['se', 'sión'], sigue: ['si', 'gue'],
  siguiente: ['si', 'guien', 'te'], sin: ['sin'], sistema: ['sis', 'te', 'ma'],
  sola: ['so', 'la'], sonidos: ['so', 'ni', 'dos'], sorpresa: ['sor', 'pre', 'sa'],
  sumas: ['su', 'mas'], sus: ['sus'], tachados: ['ta', 'cha', 'dos'],
  tiene: ['tie', 'ne'], toca: ['to', 'ca'], tres: ['tres'],
  triángulo: ['trián', 'gu', 'lo'], tu: ['tu'], un: ['un'], una: ['u', 'na'],
  uno: ['u', 'no'], ve: ['ve'], vez: ['vez'], visuales: ['vi', 'sua', 'les'],
  voz: ['voz'], y: ['y'], jardín: ['jar', 'dín'], crecen: ['cre', 'cen'],
};
  var script = document.currentScript, base = new URL('./', script.src).href;
  var game = script.getAttribute('data-game') || location.pathname.replace(/\W+/g, '-');
  var root = document.documentElement, callbacks = {}, frozen = false, hiddenFrozen = false;
  var media = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  var reducedMotion = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  var mode = 'system', motion = true, lastChallenge = '', allowed = false, nonce = 0;
  var runId=Date.now().toString(36)+'-'+Math.floor(Math.random()*1679616).toString(36);
  var key = 'family-v2-session-' + game, session, storageOK = false, cookieAuthority = false, lastActivityWrite = 0, ids = [], awardedMemory = {};
  var settings = [], shadow, dialog, host, observer;
  root.classList.add('family-v2');
  function safeRead(name) { try { return localStorage.getItem(name); } catch (_) { return null; } }
  function safeWrite(name,value) { try { localStorage.setItem(name,value); return localStorage.getItem(name) === value; } catch (_) { return false; } }
  function cookieRead() { try { var item=document.cookie.split(';').map(function(s){return s.trim();}).filter(function(s){return s.indexOf(key+'=')===0;})[0];return item ? decodeURIComponent(item.slice(key.length+1)) : null; }catch(_){return null;} }
  function valid(raw,now) { try { var v=JSON.parse(raw);return v && typeof v.id==='string' && Number.isSafeInteger(v.points) && v.points>=0 && Number.isSafeInteger(v.lastActive) && v.lastActive>=0 && v.lastActive<=now && Array.isArray(v.ids) && v.ids.length<=64 ? v : null; }catch(_){return null;} }
  function store() { var raw=JSON.stringify(session); storageOK=safeWrite(key,raw);cookieAuthority=!storageOK; if(!storageOK)try{document.cookie=key+'='+encodeURIComponent(raw)+'; Path='+new URL('../',base).pathname+'; Max-Age=604800; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');storageOK=cookieRead()===raw;}catch(_){} }
  function reconcile(touch) { var now=Date.now(), saved=cookieAuthority?(valid(cookieRead(),now)||null):(valid(safeRead(key),now)||valid(cookieRead(),now));if(saved)session=saved;if(!session||now<session.lastActive||now-session.lastActive>3600000){session={id:now+'-'+(++nonce),points:0,lastActive:now,ids:[]};awardedMemory={};store();}if(touch){session.lastActive=now;store();}return session; }
  function applyTheme(next) { if(['system','light','dark'].indexOf(next)<0)next='system';mode=next;root.setAttribute('data-family-theme',mode==='system'?(media&&media.matches?'dark':'light'):mode);safeWrite('family-v2-theme',mode);if(shadow){shadow.host.setAttribute('data-theme',root.getAttribute('data-family-theme'));shadow.querySelector('#theme').value=mode;} appearance(); }
  function motionAllowed() { return motion && !(reducedMotion && reducedMotion.matches); }
  function appearance() { window.dispatchEvent(new CustomEvent('familyv2:appearance',{detail:{theme:root.getAttribute('data-family-theme') || 'light',motion:motionAllowed()}})); }
  function viewport() { var visible=window.visualViewport;var height=Math.floor(Math.min(innerHeight,visible&&visible.scale===1?visible.height:innerHeight));root.style.setProperty('--family-height',height+'px');root.style.setProperty('--family-width',innerWidth+'px'); }
  function emit(type) { window.dispatchEvent(new CustomEvent('familyv2:'+type,{detail:{gameId:game}})); }
  function freeze() { if(frozen)return;frozen=true;try{if(callbacks.pause)callbacks.pause();}finally{emit('pause');} }
  function thaw() { if(!frozen||document.hidden||(dialog&&dialog.open))return;frozen=false;try{if(callbacks.resume)callbacks.resume();}finally{emit('resume');} }
  function paintScore() { if(!shadow)return;var score=reconcile(false);shadow.querySelector('#points').textContent=score.points;shadow.querySelector('#score').setAttribute('aria-label',score.points+' puntos'); }
  function moveSettings() { document.querySelectorAll('[data-family-setting]').forEach(function(node){if(settings.indexOf(node)>=0)return;settings.push(node);node.setAttribute('slot','family-settings');host.appendChild(node);}); }
  function challenge() { var a=2+Math.floor(Math.random()*8),b=2+Math.floor(Math.random()*8);if(a+'x'+b===lastChallenge)b=b===9?2:b+1;lastChallenge=a+'x'+b;return{a:a,b:b}; }
  function openAdults() { freeze();allowed=false;moveSettings();var q=challenge();shadow.querySelector('#gate-label').textContent=q.a+' × '+q.b+' = ?';shadow.querySelector('#gate').hidden=false;shadow.querySelector('#adult-settings').hidden=true;shadow.querySelector('#gate-error').textContent='';var input=shadow.querySelector('#answer');input.value='';dialog.showModal();shadow.querySelector('#gate').onsubmit=function(e){e.preventDefault();if(!/^\d+$/.test(input.value.trim())||Number(input.value)!==q.a*q.b){shadow.querySelector('#gate-error').textContent='↻';input.value='';input.focus();return;}allowed=true;shadow.querySelector('#gate').hidden=true;shadow.querySelector('#adult-settings').hidden=false;shadow.querySelector('#motion').focus();}; }
  function decorate() { if(!window.FAMILY_V2_SYLLABLES)return;var lex=window.FAMILY_V2_SYLLABLES,walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode()){var n=walker.currentNode,p=n.parentElement;if(!p||p.closest('script,style,textarea,svg,[aria-hidden="true"],.family-syllabic,family-v2-shell'))continue;if((n.textContent.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)||[]).some(function(w){return lex[w.toLowerCase()];}))nodes.push(n);}nodes.forEach(function(n){var frag=document.createDocumentFragment();n.textContent.split(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/g).forEach(function(w){var parts=lex[w.toLowerCase()];if(!parts){frag.appendChild(document.createTextNode(w));return;}var span=document.createElement('span'),offset=0,stops=[];span.className='family-syllabic';span.textContent=w;parts.forEach(function(part){var start=offset/w.length*100;offset+=part.length;var end=offset/w.length*100;stops.push('currentColor '+start+'% '+Math.max(start,end-2)+'%','transparent '+Math.max(start,end-2)+'% '+end+'%');});span.style.backgroundImage='linear-gradient(to right,'+stops.join(',')+')';frag.appendChild(span);});n.replaceWith(frag);}); }
  function mount() {
    window.addEventListener('learninggate:lock',function(){if(dialog&&dialog.open){dialog.close();allowed=false;} });
    host=document.createElement('family-v2-shell');host.setAttribute('data-version','2.0.0');
    var slot=document.querySelector('[data-family-slot]');(slot||document.body).appendChild(host);if(!slot){host.style.cssText='position:fixed;bottom:8px;right:8px;z-index:9990';}
    shadow=host.attachShadow({mode:'open'});
    shadow.innerHTML='<style>@font-face{font-family:School;src:url("'+base+'playwrite-es.ttf")} :host{--page:#f3f6fc;--ink:#233e61;--panel:#e5ecff;font-family:School,cursive;color:var(--ink);display:inline-block;line-height:1.35}:host([data-theme=dark]){--page:#141e30;--ink:#edf2ff;--panel:#30415f}*{box-sizing:border-box;font-family:inherit}button,select,input{color:var(--ink);font:inherit;border:0;border-radius:12px;background:var(--panel);min-height:44px;padding:7px;cursor:pointer}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #b08025;outline-offset:2px}.bar{display:flex;gap:5px;align-items:center;padding:4px;border-radius:16px;background:var(--page);box-shadow:0 2px 8px #0002}#score{font-size:16px;white-space:nowrap}#score span{color:#a06a08}#home,#adults{width:44px;height:44px;font-size:22px;display:grid;place-items:center;text-decoration:none;color:inherit;border-radius:12px;background:var(--panel)}#theme{width:45px;font-size:20px}dialog{margin:auto;border:0;border-radius:22px;max-width:calc(100vw - 24px);max-height:calc(var(--family-height,100vh) - 20px);width:360px;padding:18px;color:var(--ink);background:var(--page)}dialog::backdrop{background:#14263b99}.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.head strong{font-size:19px}.close{width:44px;font-size:25px}form{display:grid;grid-template-columns:1fr 50px;gap:10px}label{grid-column:1/-1;text-align:center;font-size:29px}input{min-width:0;width:100%;background:var(--panel);font-size:25px}#gate-error{grid-column:1/-1;text-align:center}.settings{display:grid;gap:8px}.settings>button{min-height:44px}#native-settings{display:flex;flex-wrap:wrap;gap:8px}::slotted([data-family-setting]){position:static!important;margin:0!important;transform:none!important;min-width:44px!important;min-height:44px!important} [hidden]{display:none!important}.note{font-size:11px;line-height:1.5;margin:8px 0 0}svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2}@media(max-width:500px){.bar{gap:3px}#score{font-size:14px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}</style><div class="bar"><span id="score" role="status" aria-live="polite"><span aria-hidden="true">★</span> <b id="points">0</b></span><button id="home" aria-label="Inicio del juego" title="Inicio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/></svg></button><select id="theme" aria-label="Aspecto"><option value="system" aria-label="Sistema">◐</option><option value="light" aria-label="Día">☀</option><option value="dark" aria-label="Noche">☾</option></select><button id="adults" aria-label="Para adultos" title="Adultos"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></svg></button></div><dialog aria-label="Adultos"><div class="head"><strong>Adultos · 2.0</strong><button class="close" id="close" aria-label="Cerrar">×</button></div><form id="gate"><label id="gate-label" for="answer"></label><input id="answer" inputmode="numeric" autocomplete="off" aria-label="Resultado de la multiplicación" required pattern="[0-9]+"><button aria-label="Entrar">→</button><span id="gate-error" role="status"></span></form><div id="adult-settings" class="settings" hidden><div id="native-settings"><slot name="family-settings"></slot></div><a id="catalogue" href="https://cmlozanos.github.io/games/">Todos los juegos ↗</a><button id="motion" aria-pressed="true">✦ Animaciones</button><button id="reset">☆ Reiniciar puntos</button><span id="storage-note" class="note" hidden>Guardado temporal</span></div></dialog>';
    shadow.addEventListener('keydown',function(e){e.stopPropagation();});shadow.addEventListener('keyup',function(e){e.stopPropagation();});
    dialog=shadow.querySelector('dialog');dialog.addEventListener('close',function(){allowed=false;shadow.querySelector('#adult-settings').hidden=true;shadow.querySelector('#gate').hidden=false;thaw();});
    shadow.querySelector('#adults').onclick=openAdults;
    shadow.querySelector('#home').onclick=function(){if(callbacks.home){callbacks.home();}else{emit('home');} };
    document.querySelectorAll('[data-family-home]').forEach(function(node){node.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();if(callbacks.home)callbacks.home();else emit('home');});});
    shadow.querySelector('#close').onclick=function(){dialog.close();};
    shadow.querySelector('#theme').onchange=function(e){applyTheme(e.target.value);};
    shadow.querySelector('#motion').onclick=function(){if(!allowed)return;motion=!motion;root.classList.toggle('family-no-motion',!motion);this.setAttribute('aria-pressed',String(motion));appearance();};
    shadow.querySelector('#reset').onclick=function(){if(!allowed)return;if(this.getAttribute('data-confirm')!=='true'){this.setAttribute('data-confirm','true');this.textContent='¿Confirmar reinicio?';return;}session={id:Date.now()+'-'+(++nonce),points:0,lastActive:Date.now(),ids:[]};awardedMemory={};store();paintScore();this.removeAttribute('data-confirm');this.textContent='☆ Reiniciar puntos';};
    moveSettings();applyTheme(safeRead('family-v2-theme')||'system');paintScore();shadow.querySelector('#storage-note').hidden=storageOK;
    if(media){var onTheme=function(){if(mode==='system')applyTheme(mode);};if(media.addEventListener)media.addEventListener('change',onTheme);else if(media.addListener)media.addListener(onTheme);}
    decorate();observer=new MutationObserver(function(){observer.disconnect();moveSettings();decorate();observer.observe(document.body,{childList:true,subtree:true});});observer.observe(document.body,{childList:true,subtree:true});
  }
  var api={version:'2.0.0',theme:function(){return root.getAttribute('data-family-theme') || 'light';},motionAllowed:motionAllowed,fontFamily:'Family School',fontReady:document.fonts?document.fonts.load('20px "Family School"'):Promise.resolve(),register:function(value){callbacks=value||{};if(frozen&&callbacks.pause)callbacks.pause();},touch:function(){reconcile(true);paintScore();},award:function(id,points){var current=reconcile(true);id=runId+':'+String(id);if(awardedMemory[id]||current.ids.indexOf(id)>=0)return current.points;points=points===undefined?1:points;if(!Number.isSafeInteger(points)||points<1)return current.points;awardedMemory[id]=true;current.points=Math.min(Number.MAX_SAFE_INTEGER,current.points+points);current.ids=current.ids.concat([id]).slice(-64);store();paintScore();return current.points;},read:function(){return Object.assign({},reconcile(false));}};
  window.FamilyV2=api;if(reducedMotion){if(reducedMotion.addEventListener)reducedMotion.addEventListener('change',appearance);else if(reducedMotion.addListener)reducedMotion.addListener(appearance);}viewport();window.addEventListener('resize',viewport);window.addEventListener('orientationchange',viewport);if(window.visualViewport)visualViewport.addEventListener('resize',viewport);
  document.addEventListener('visibilitychange',function(){if(document.hidden){hiddenFrozen=true;freeze();}else{viewport();paintScore();if(hiddenFrozen){hiddenFrozen=false;thaw();}}});
  function realActivity(e){if(e.target===host||(e.target.closest&&e.target.closest('family-v2-shell')))return;var now=Date.now();if(now-lastActivityWrite>=1000){lastActivityWrite=now;reconcile(true);}}
  document.addEventListener('keydown',realActivity,{passive:true});
  document.addEventListener('pointermove',function(e){if(e.buttons)realActivity(e);},{passive:true});
  document.addEventListener('pointerdown',function(e){if(e.target===host||e.target.closest('family-v2-shell'))return;reconcile(true);}, {passive:true});
  window.addEventListener('storage',function(e){if(e.key===key)paintScore();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
}());
