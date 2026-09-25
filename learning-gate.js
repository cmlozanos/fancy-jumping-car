/* Original educational gate. No third-party assets. Shared source for every game. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LearningGate = api;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var INTERVAL = 10 * 60 * 1000;
  function line() { return Array.prototype.slice.call(arguments); }
  function arc(cx, cy, rx, ry, from, to, count) {
    var out = [], n = count || 28;
    for (var i = 0; i <= n; i++) {
      var a = (from + (to - from) * i / n) * Math.PI / 180;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  }
  function join(a, b) { return a.concat(b); }
  var glyphs = {
    A: [line([20,85],[50,15],[80,85]), line([32,58],[68,58])],
    B: [line([25,85],[25,15]), join(arc(25,33,45,18,-90,90),arc(25,67,48,18,-90,90))],
    C: [arc(52,50,32,36,-45,-315)],
    D: [line([25,85],[25,15]), arc(25,50,50,35,-90,90)],
    E: [line([76,15],[25,15],[25,85],[76,85]),line([25,50],[65,50])],
    F: [line([25,85],[25,15],[76,15]),line([25,50],[65,50])],
    G: [join(arc(51,50,32,36,-45,-315),line([80,53],[55,53]))],
    H: [line([25,15],[25,85]),line([75,15],[75,85]),line([25,50],[75,50])],
    I: [line([30,15],[70,15]),line([50,15],[50,85]),line([30,85],[70,85])],
    J: [join(line([75,15],[75,65]),arc(50,65,25,20,0,180))],
    K: [line([25,15],[25,85]),line([76,15],[25,52],[78,85])],
    L: [line([25,15],[25,85],[77,85])],
    M: [line([17,85],[17,15],[50,57],[83,15],[83,85])],
    N: [line([24,85],[24,15],[76,85],[76,15])],
    O: [arc(50,50,31,36,-90,-450)],
    P: [line([25,85],[25,15]),arc(25,36,48,21,-90,90)],
    Q: [arc(48,48,30,33,-90,-450),line([55,62],[82,88])],
    R: [line([25,85],[25,15]),arc(25,36,48,21,-90,90),line([47,57],[78,85])],
    S: [join(arc(50,33,28,19,-30,-240),arc(50,67,28,19,-60,210))],
    T: [line([18,15],[82,15]),line([50,15],[50,85])],
    U: [join(join(line([22,15],[22,58]),arc(50,58,28,27,180,0)),line([78,58],[78,15]))],
    V: [line([20,15],[50,85],[80,15])],
    W: [line([12,15],[30,85],[50,42],[70,85],[88,15])],
    X: [line([22,15],[78,85]),line([78,15],[22,85])],
    Y: [line([20,15],[50,50],[80,15]),line([50,50],[50,85])],
    Z: [line([22,15],[78,15],[22,85],[78,85])],
    a: [arc(46,61,23,24,-30,-390),line([69,37],[69,85])],
    b: [line([27,15],[27,85]),arc(49,61,23,24,180,-180)],
    c: [arc(51,61,25,24,-40,-320)],
    d: [arc(47,61,23,24,0,-360),line([70,15],[70,85])],
    e: [join(line([25,58],[75,58]),arc(50,59,25,25,0,-310))],
    f: [join(arc(57,30,17,17,-15,-180),line([40,30],[40,85])),line([24,45],[67,45])],
    g: [arc(47,52,23,22,0,-360),join(line([70,30],[70,75]),arc(47,75,23,18,0,150))],
    h: [line([27,15],[27,85]),join(arc(49,60,22,23,180,360),line([71,60],[71,85]))],
    i: [line([50,22],[51,22]),line([50,40],[50,85])],
    j: [line([59,20],[60,20]),join(line([60,37],[60,75]),arc(43,75,17,17,0,160))],
    k: [line([28,15],[28,85]),line([72,36],[28,64],[73,85])],
    l: [line([46,15],[46,77],[57,85])],
    m: [line([16,38],[16,85]),join(arc(33,58,17,20,180,360),line([50,58],[50,85])),join(arc(67,58,17,20,180,360),line([84,58],[84,85]))],
    n: [line([26,38],[26,85]),join(arc(50,60,24,23,180,360),line([74,60],[74,85]))],
    o: [arc(50,61,25,24,-90,-450)],
    p: [line([27,33],[27,94]),arc(50,55,23,23,180,-180)],
    q: [arc(47,54,23,23,0,-360),line([70,32],[70,94])],
    r: [line([30,38],[30,85]),arc(52,58,22,20,180,305)],
    s: [join(arc(50,48,22,13,-30,-240),arc(50,73,22,13,-60,210))],
    t: [line([44,20],[44,75],[52,84],[67,81]),line([26,43],[68,43])],
    u: [join(join(line([26,37],[26,63]),arc(50,63,24,22,180,0)),line([74,63],[74,37]))],
    v: [line([25,37],[50,85],[75,37])],
    w: [line([12,37],[29,85],[50,53],[71,85],[88,37])],
    x: [line([27,37],[73,85]),line([73,37],[27,85])],
    y: [line([24,32],[49,72]),line([77,32],[44,91],[28,91])],
    z: [line([27,38],[73,38],[27,85],[73,85])]
  };
  glyphs['Ñ'] = [line([24,85],[24,25],[76,85],[76,25]),line([30,15],[40,9],[60,17],[70,11])];
  glyphs['ñ'] = glyphs.n.concat([line([30,23],[40,17],[60,25],[70,19])]);
  var letters = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz'.split('');
  function length(a,b) { var dx=a[0]-b[0],dy=a[1]-b[1]; return Math.sqrt(dx*dx+dy*dy); }
  function measure(points) {
    var starts=[0];
    for(var i=1;i<points.length;i++) starts.push(starts[i-1]+length(points[i-1],points[i]));
    return {points:points,starts:starts,length:starts[starts.length-1]};
  }
  function nearest(stroke,p,min,max) {
    var best={distance:Infinity,progress:0};
    for(var i=1;i<stroke.points.length;i++) {
      var a=stroke.points[i-1],b=stroke.points[i],dx=b[0]-a[0],dy=b[1]-a[1];
      var squared=dx*dx+dy*dy;
      var t=squared ? Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/squared)) : 0;
      var progress=stroke.starts[i-1]+Math.sqrt(squared)*t;
      if(progress<min||progress>max) continue;
      var dist=length(p,[a[0]+dx*t,a[1]+dy*t]);
      if(dist<best.distance) best={distance:dist,progress:progress};
    }
    return best;
  }
  function newTrace(letter) {
    if(!glyphs[letter]) throw new Error('Unknown letter');
    return {letter:letter,strokes:glyphs[letter].map(measure),index:0,progress:0,active:false,failed:false,last:null,ink:[],done:[]};
  }
  function beginTrace(state,p) {
    if(state.index>=state.strokes.length) return false;
    state.progress=0;state.failed=false;state.ink=[];state.last=null;
    state.active=length(p,state.strokes[state.index].points[0])<=12;
    if(state.active){state.last=p;state.ink.push(p);}
    return state.active;
  }
  function moveTrace(state,p) {
    if(!state.active||state.failed) return false;
    var stroke=state.strokes[state.index],old=state.last,steps=Math.max(1,Math.ceil(length(old,p)/2));
    for(var j=1;j<=steps;j++) {
      var sample=[old[0]+(p[0]-old[0])*j/steps,old[1]+(p[1]-old[1])*j/steps];
      var hit=nearest(stroke,sample,Math.max(0,state.progress-10),state.progress+15);
      if(hit.distance>10){state.failed=true;return false;}
      state.progress=Math.max(state.progress,hit.progress);
    }
    state.last=p;state.ink.push(p);return true;
  }
  function endTrace(state,cancelled) {
    if(!state.active) return false;
    var stroke=state.strokes[state.index];
    var valid=!cancelled&&!state.failed&&state.progress>=stroke.length*.9&&length(state.last,stroke.points[stroke.points.length-1])<=12;
    if(stroke.length<3) valid=!cancelled&&!state.failed;
    if(valid){state.done.push(state.ink.slice());state.index++;}
    state.active=false;state.failed=false;state.progress=0;state.ink=[];state.last=null;
    return valid;
  }
  function challenge(random) {
    var rng=random||Math.random,kind=Math.floor(rng()*3),a=Math.floor(rng()*10),b;
    if(kind===2) return {kind:'trace',letter:letters[Math.floor(rng()*letters.length)]};
    b=Math.floor(rng()*(kind===0?10-a:a+1));
    return {kind:'math',a:a,b:b,operator:kind===0?'+':'−',answer:kind===0?a+b:a-b};
  }
  function createTimers() {
    var pending={},sequence=0,paused=false;
    function now(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now();}
    function arm(entry){
      entry.startedAt=now();
      entry.handle=setTimeout(function(){
        if(paused||!pending[entry.id])return;
        delete pending[entry.id];entry.callback();
      },entry.remaining);
    }
    return {
      set:function(callback,delay){
        var entry={id:++sequence,callback:callback,remaining:Math.max(0,Number(delay)||0),startedAt:0,handle:null};
        pending[entry.id]=entry;if(!paused)arm(entry);return entry.id;
      },
      clear:function(id){var entry=pending[id];if(entry){clearTimeout(entry.handle);delete pending[id];}},
      pause:function(){
        if(paused)return;paused=true;var time=now();
        Object.keys(pending).forEach(function(id){var entry=pending[id];clearTimeout(entry.handle);entry.remaining=Math.max(0,entry.remaining-(time-entry.startedAt));});
      },
      resume:function(){if(!paused)return;paused=false;Object.keys(pending).forEach(function(id){arm(pending[id]);});}
    };
  }
  var css = '#learning-gate{position:fixed;z-index:2147483647;inset:0;background:rgba(7,20,36,.96);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;color:#f5fafc;font:600 20px system-ui,-apple-system,Arial,sans-serif;overscroll-behavior:contain;touch-action:none}#learning-gate *{box-sizing:border-box}#learning-gate .gate-card{width:360px;max-width:100%;max-height:100%;overflow:auto;background:#193248;border:1px solid #456377;border-radius:26px;padding:18px;text-align:center;box-shadow:0 16px 70px #0006}#learning-gate .gate-top{display:flex;align-items:center;justify-content:space-between;font-size:28px}#learning-gate .gate-lock{color:#9cc8df}#learning-gate .gate-instruction{margin:8px 0;color:#cae1ec;font-size:15px;font-weight:500}#learning-gate #gate-prompt{display:block;font-size:48px;font-weight:800;line-height:1.3;margin:18px 0;letter-spacing:2px}#learning-gate .gate-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}#learning-gate button{appearance:none;border:0;border-radius:15px;background:#edf6f9;color:#122d40;font:800 28px system-ui,Arial,sans-serif;min-width:44px;min-height:52px;cursor:pointer;touch-action:manipulation;padding:8px}#learning-gate button:focus-visible{outline:4px solid #ffce5a;outline-offset:2px}#learning-gate button:active{background:#ffce5a;transform:scale(.96)}#learning-gate [data-gate-key="0"]{grid-column:2}#learning-gate #gate-feedback{height:30px;font-size:22px;line-height:30px;color:#ffdf88;margin:8px 0 0}#learning-gate #gate-trace{display:block;width:100%;height:auto;max-height:48vh;aspect-ratio:1;background:#102739;border-radius:18px;touch-action:none}#learning-gate .gate-trace-footer{display:flex;justify-content:space-between;align-items:center;margin-top:10px}#learning-gate #gate-retry{font-size:24px;min-height:44px;background:#31556d;color:#fff}#learning-gate #gate-strokes{color:#7df0b5;letter-spacing:4px;font-size:18px}#learning-gate .gate-hidden{display:none!important}#learning-gate .gate-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-height:520px) and (min-width:500px){#learning-gate .gate-card{width:650px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:0 18px}#learning-gate .gate-top{grid-column:1}#learning-gate .gate-instruction{grid-column:1}#learning-gate #gate-math,#learning-gate #gate-drawing{grid-column:2;grid-row:1/5}#learning-gate #gate-prompt{font-size:42px;margin:0 0 8px}#learning-gate button{min-height:42px;padding:3px}#learning-gate #gate-trace{max-height:64vh;width:auto;max-width:100%;margin:auto}#learning-gate #gate-feedback{grid-column:1}#learning-gate .gate-keys{gap:5px}}@media(prefers-reduced-motion:reduce){#learning-gate button:active{transform:none}}';
  function mount(options) {
    options=options||{};
    if(typeof document==='undefined'||!document.body) throw new Error('Mount LearningGate after document.body exists');
    if(document.getElementById('learning-gate')) throw new Error('Only one learning gate may be mounted at a time');
    var locked=false,destroyed=false,nextAt=0,overlay=null,current=null,trace=null,pointer=null,previousFocus=null,previousOverflow='',lastNow=Date.now();
    var style=document.getElementById('learning-gate-style');
    if(!style){style=document.createElement('style');style.id='learning-gate-style';style.textContent=css;document.head.appendChild(style);}
    function announce(name){try{window.dispatchEvent(new CustomEvent('learninggate:'+name,{detail:{gameId:options.gameId||''}}));}catch(ignore){}}
    function inside(target){return !!(overlay&&target&&overlay.contains(target));}
    var blockedEvents=['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup','touchstart','touchmove','touchend','touchcancel','click','dblclick','contextmenu','wheel','keydown','keyup'];
    function blockOutside(event){
      if(!locked)check();
      if(!locked) return;
      if(!inside(event.target)){if(event.cancelable)event.preventDefault();event.stopImmediatePropagation();}
    }
    function keepFocus(event){if(locked&&!inside(event.target)){event.stopPropagation();focusFirst();}}
    function focusFirst(){if(overlay){var first=overlay.querySelector('button');(first||overlay).focus({preventScroll:true});}}
    function feedback(text){if(overlay)overlay.querySelector('#gate-feedback').textContent=text;}
    function unlock(){
      if(!locked||destroyed)return;
      try{if(options.onUnlock)options.onUnlock();}catch(error){feedback('↻');return;}
      nextAt=Date.now()+INTERVAL;lastNow=Date.now();locked=false;
      document.body.style.overflow=previousOverflow;
      if(overlay)overlay.remove();overlay=null;trace=null;pointer=null;
      if(previousFocus&&document.documentElement.contains(previousFocus)){try{previousFocus.focus({preventScroll:true});}catch(ignore){}}
      announce('unlock');
    }
    function drawTrace(){
      if(!overlay||!trace)return;
      var canvas=overlay.querySelector('#gate-trace'),ctx=canvas.getContext('2d'),ratio=canvas.width/100;
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,100,100);ctx.lineCap='round';ctx.lineJoin='round';
      ctx.strokeStyle='#26455b';ctx.lineWidth=.5;ctx.setLineDash([2,3]);
      [15,38,85].forEach(function(y){ctx.beginPath();ctx.moveTo(8,y);ctx.lineTo(92,y);ctx.stroke();});ctx.setLineDash([]);
      trace.strokes.forEach(function(stroke,i){ctx.beginPath();stroke.points.forEach(function(p,j){if(j)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.lineWidth=8;ctx.strokeStyle=i<trace.index?'#52d6a2':i===trace.index?'#779aac':'#304b60';ctx.stroke();});
      trace.done.concat(trace.ink.length?[trace.ink]:[]).forEach(function(points){ctx.beginPath();points.forEach(function(p,j){if(j)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.lineWidth=4;ctx.strokeStyle=trace.failed?'#ffab80':'#fff1a4';ctx.stroke();});
      if(trace.index<trace.strokes.length){
        var stroke=trace.strokes[trace.index],start=stroke.points[0],next=stroke.points[Math.min(2,stroke.points.length-1)];
        ctx.beginPath();ctx.arc(start[0],start[1],6,0,Math.PI*2);ctx.fillStyle='#ffcf61';ctx.fill();
        ctx.fillStyle='#122d40';ctx.font='bold 7px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(trace.index+1),start[0],start[1]);
        if(stroke.length>3){var angle=Math.atan2(next[1]-start[1],next[0]-start[0]),x=start[0]+Math.cos(angle)*13,y=start[1]+Math.sin(angle)*13;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(3,0);ctx.lineTo(-2,-3);ctx.lineTo(-2,3);ctx.closePath();ctx.fillStyle='#ffcf61';ctx.fill();ctx.restore();}
      }
      overlay.querySelector('#gate-strokes').textContent=trace.strokes.map(function(_,i){return i<trace.index?'●':'○';}).join(' ');
    }
    function setupDrawing(){
      var canvas=overlay.querySelector('#gate-trace');canvas.width=400;canvas.height=400;canvas.setAttribute('data-letter',current.letter);trace=newTrace(current.letter);drawTrace();
      function point(event){var rect=canvas.getBoundingClientRect();return [(event.clientX-rect.left)*100/rect.width,(event.clientY-rect.top)*100/rect.height];}
      function down(event){if(pointer!==null||event.button>0)return;event.preventDefault();pointer=event.pointerId;if(beginTrace(trace,point(event))){feedback('');try{canvas.setPointerCapture(pointer);}catch(ignore){}}else{pointer=null;feedback('☝ ●');}drawTrace();}
      function move(event){if(event.pointerId!==pointer)return;event.preventDefault();moveTrace(trace,point(event));drawTrace();}
      function up(event){if(event.pointerId!==pointer)return;event.preventDefault();if(event.type==='pointerup')moveTrace(trace,point(event));var valid=endTrace(trace,event.type!=='pointerup');pointer=null;if(valid&&trace.index===trace.strokes.length){unlock();return;}feedback(valid?'✓':'↻');drawTrace();}
      canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);
      overlay.querySelector('#gate-retry').onclick=function(){trace=newTrace(current.letter);pointer=null;feedback('');drawTrace();};
    }
    function lock(){
      if(locked||destroyed)return;
      locked=true;previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';current=challenge();
      overlay=document.createElement('section');overlay.id='learning-gate';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Un pequeño reto para jugar');overlay.setAttribute('tabindex','-1');
      overlay.innerHTML='<div class="gate-card"><div class="gate-top"><span class="gate-lock" aria-hidden="true">🔒</span><span aria-hidden="true">🧠 → 🎮</span></div><p class="gate-instruction" id="gate-instruction"></p><div id="gate-math"><output id="gate-prompt"></output><div class="gate-keys"></div></div><div id="gate-drawing"><canvas id="gate-trace" aria-label="Sigue el trazo desde el punto amarillo" role="img"></canvas><div class="gate-trace-footer"><span id="gate-strokes" aria-label="Trazos completados"></span><button id="gate-retry" aria-label="Empezar la letra otra vez">↻</button></div></div><div id="gate-feedback" role="status" aria-live="polite"></div></div>';
      document.body.appendChild(overlay);
      blockedEvents.forEach(function(name){overlay.addEventListener(name,function(e){e.stopPropagation();},{passive:false});});
      overlay.addEventListener('keydown',function(event){
        if(event.key==='Escape'){event.preventDefault();return;}
        if(event.key==='Tab'){var buttons=Array.prototype.filter.call(overlay.querySelectorAll('button'),function(b){return b.offsetWidth>0;});var first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
        if(current.kind==='math'&&/^[0-9]$/.test(event.key)){event.preventDefault();answer(Number(event.key));}
      });
      if(current.kind==='math'){
        overlay.querySelector('#gate-drawing').className='gate-hidden';overlay.querySelector('#gate-instruction').textContent='👆 0 1 2 3 4 5 6 7 8 9';
        overlay.querySelector('#gate-prompt').textContent=current.a+' '+current.operator+' '+current.b+' = ?';
        var keys=overlay.querySelector('.gate-keys');[1,2,3,4,5,6,7,8,9,0].forEach(function(n){var button=document.createElement('button');button.type='button';button.setAttribute('data-gate-key',String(n));button.setAttribute('aria-label',String(n));button.textContent=String(n);button.onclick=function(){answer(n);};keys.appendChild(button);});
      }else{
        overlay.querySelector('#gate-math').className='gate-hidden';overlay.querySelector('#gate-instruction').textContent='☝ ✍ '+current.letter;setupDrawing();
      }
      try{if(options.onLock)options.onLock();}catch(error){/* Fail closed: overlay remains input-blocking. */}
      focusFirst();announce('lock');
    }
    function answer(n){if(!locked||current.kind!=='math')return;if(n===current.answer)unlock();else feedback('↻');}
    function check(){
      if(destroyed)return;
      if(document.hidden)cancelInput();
      var now=Date.now();
      // A backwards wall-clock adjustment must not grant extra unlocked time.
      if(now<lastNow&&nextAt)nextAt=Math.min(nextAt,now);
      lastNow=now;if(!locked&&now>=nextAt)lock();
    }
    function cancelInput(){if(trace&&pointer!==null){endTrace(trace,true);pointer=null;drawTrace();}}
    blockedEvents.forEach(function(name){window.addEventListener(name,blockOutside,{capture:true,passive:false});});
    document.addEventListener('focusin',keepFocus,true);document.addEventListener('visibilitychange',check);window.addEventListener('focus',check);window.addEventListener('pageshow',check);window.addEventListener('blur',cancelInput);
    var timer=window.setInterval(check,1000);lock();
    return {isLocked:function(){return locked;},check:check,destroy:function(){
      if(destroyed)return;destroyed=true;window.clearInterval(timer);
      blockedEvents.forEach(function(name){window.removeEventListener(name,blockOutside,true);});
      document.removeEventListener('focusin',keepFocus,true);document.removeEventListener('visibilitychange',check);window.removeEventListener('focus',check);window.removeEventListener('pageshow',check);window.removeEventListener('blur',cancelInput);
      if(locked)document.body.style.overflow=previousOverflow;if(overlay)overlay.remove();overlay=null;
    }};
  }
  return {mount:mount,createTimers:createTimers,Core:{interval:INTERVAL,challenge:challenge,letters:letters,glyphs:glyphs,newTrace:newTrace,beginTrace:beginTrace,moveTrace:moveTrace,endTrace:endTrace}};
}));
