/* Static explorer: one immutable 3-D UMAP, orthographic camera, no runtime server. */
(() => {
'use strict';
const data=window.RADAR_BENCH, $=id=>document.getElementById(id), records=data.records;
const sources=new Map(data.sources.map(s=>[s.name,s])), byKey=new Map(records.map(r=>[r.key,r]));
const canvas=$('space-canvas'), ctx=canvas.getContext('2d'), panel=$('molecule-panel');
const state={task:'SIF',source:'all',selected:null,view:'2d',rx:0,ry:0,zoom:1,panX:0,panY:0};
let visible=[],width=0,height=0,projected=[],animation=0,drag=null,closeTimer;
const center=[0,1,2].map(i=>(Math.min(...records.map(r=>r.coordinates[i]))+Math.max(...records.map(r=>r.coordinates[i])))/2);
const radius=Math.max(...records.map(r=>Math.hypot(...r.coordinates.map((v,i)=>v-center[i]))));
const rdkit=initRDKitModule({wasmBinary:Uint8Array.from(atob(window.RDKIT_WASM_BASE64),c=>c.charCodeAt(0))});
rdkit.catch(()=>{});
const tag=r=>'#'+String(r.sequence).padStart(4,'0');
const scale=()=>Math.min(width,height)*.41/radius*state.zoom;
function rotate(v){const [x,y,z]=v,cy=Math.cos(state.ry),sy=Math.sin(state.ry),cx=Math.cos(state.rx),sx=Math.sin(state.rx),xx=x*cy+z*sy,zz=-x*sy+z*cy;return [xx,y*cx-zz*sx,y*sx+zz*cx];}
function projectVector(v){const [x,y,z]=rotate(v),s=scale();return {x:width/2+state.panX+x*s,y:height/2+state.panY-y*s,z};}
function project(r){return {...projectVector(r.coordinates.map((v,i)=>v-center[i])),r};}
function dot(p,selected=false){const color=sources.get(p.r.source).color, r=selected?5:3.6;
 if(selected){const g=ctx.createRadialGradient(p.x,p.y,3,p.x,p.y,16);g.addColorStop(0,color+'99');g.addColorStop(.55,color+'44');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color+'80';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();}
 ctx.fillStyle=color;ctx.globalAlpha=selected?1:.86;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#ffffffb0';ctx.lineWidth=.6;ctx.stroke();
}
function draw(){if(!ctx)return;ctx.clearRect(0,0,width,height);ctx.strokeStyle='#e5ece680';ctx.lineWidth=1;
 for(let i=-5;i<=5;i++){const k=i*radius/5;for(const pair of [[[k,-radius,0],[k,radius,0]],[[-radius,k,0],[radius,k,0]]]){const a=projectVector(pair[0]),b=projectVector(pair[1]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
 projected=visible.map(project).sort((a,b)=>a.z-b.z);projected.forEach(p=>dot(p));const p=projected.find(p=>p.r.key===state.selected);if(p)dot(p,true);
 const origin={x:width-42,y:43};[['X',[1,0,0],'#b77b68'],['Y',[0,1,0],'#60967c'],['Z',[0,0,1],'#7797b0']].forEach(([label,v,color])=>{const a=rotate(v);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(origin.x+a[0]*22,origin.y-a[1]*22);ctx.stroke();ctx.font='9px monospace';ctx.fillText(label,origin.x+a[0]*28-3,origin.y-a[1]*28+3);});
}
function resize(){const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=window.devicePixelRatio||1;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
function camera(rx,ry){cancelAnimationFrame(animation);const start=performance.now(),x=state.rx,y=state.ry,duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:450;function step(t){const u=duration?Math.min(1,(t-start)/duration):1,e=u*u*(3-2*u);state.rx=x+(rx-x)*e;state.ry=y+(ry-y)*e;draw();if(u<1)animation=requestAnimationFrame(step);}animation=requestAnimationFrame(step);}
function view(mode,top=false){state.view=mode;for(const m of ['2d','3d']){$('view-'+m).classList.toggle('active',mode===m);$('view-'+m).setAttribute('aria-pressed',String(mode===m));}$('view-note').textContent=mode==='2d'?'2D · 三维坐标的 XY 投影':'3D · 正交视角';$('interaction-hint').textContent=mode==='2d'?'拖动平移 · 滚轮缩放 · 点击查看分子':'拖动旋转 · Shift 拖动平移 · 滚轮缩放';camera(mode==='2d'||top?0:.55,mode==='2d'||top?0:-.65);}
function minimize(restore=true){clearTimeout(closeTimer);panel.classList.add('closing');panel.classList.remove('open');panel.inert=true;panel.setAttribute('aria-hidden','true');$('restore-panel').hidden=!restore||!state.selected;closeTimer=setTimeout(()=>panel.classList.remove('closing'),400);}
function open(){clearTimeout(closeTimer);panel.classList.remove('closing');panel.classList.add('open');panel.inert=false;panel.setAttribute('aria-hidden','false');$('restore-panel').hidden=true;}
async function select(key){const r=byKey.get(key);if(!r)return;state.selected=key;$('molecule-filter').value=key;$('selection-status').textContent=tag(r)+' · '+r.source;
 $('drawer-sequence').textContent=tag(r);$('drawer-title').textContent='分子 '+tag(r);$('drawer-source').textContent=r.source;$('source-dot').style.background=sources.get(r.source).color;$('restore-dot').style.background=sources.get(r.source).color;$('restore-label').textContent='分子 '+tag(r);
 for(const task of ['SIF','SGF']){const m=r.measurements[task],prefix=task.toLowerCase();$(prefix+'-value').textContent=m.minutes===null?'未提供':m.minutes+' min';$(prefix+'-note').textContent=m.kind==='mapped'?'原始标记：'+m.raw+' · 映射值':m.kind==='numeric'?'原始数值：'+m.raw:m.raw?'原始标记：'+m.raw:'无测量记录';}
 $('smiles-preview').textContent=r.smiles.slice(0,72)+(r.smiles.length>72?'…':'');$('full-smiles').textContent=r.smiles;$('copy-smiles').textContent='复制完整结构';$('split-info').textContent=Object.entries(r.splits).map(([t,s])=>t+' / '+s.partition).join(' · ');$('drawer-structure').replaceChildren();$('drawer-atoms').textContent='—';$('structure-status').textContent='正在绘制分子结构…';open();draw();
 try{const module=await rdkit;if(state.selected!==key)return;const mol=module.get_mol(r.smiles);if(!mol)throw Error('无法解析结构');try{$('drawer-structure').innerHTML=mol.get_svg(340,235);$('drawer-atoms').textContent=JSON.parse(mol.get_json()).molecules[0].atoms.length;$('structure-status').textContent='';}finally{mol.delete();}}catch(e){if(state.selected===key)$('structure-status').textContent='结构绘制失败，可查看下方完整 SMILES。';}
}
function filters(){const taskRecords=records.filter(r=>r.splits[state.task]);if(state.source!=='all'&&!taskRecords.some(r=>r.source===state.source))state.source='all';
 $('source-filter').replaceChildren(new Option('全部来源（'+taskRecords.length+'）','all'));for(const s of data.sources){const count=taskRecords.filter(r=>r.source===s.name).length,o=new Option(s.name+'（'+count+'）',s.name);o.disabled=!count;$('source-filter').add(o);}$('source-filter').value=state.source;
 visible=taskRecords.filter(r=>state.source==='all'||r.source===state.source);$('visible-count').textContent=visible.length;$('molecule-filter').replaceChildren(new Option('按顺序选择分子…',''));visible.forEach(r=>$('molecule-filter').add(new Option(tag(r)+' · '+r.smiles.slice(0,32)+(r.smiles.length>32?'…':''),r.key)));
 if(!visible.some(r=>r.key===state.selected)){state.selected=null;minimize(false);$('selection-status').textContent='点击点或使用上方选择栏';}else $('molecule-filter').value=state.selected;
 $('source-legend').replaceChildren();for(const s of data.sources){const b=document.createElement('button'),i=document.createElement('i'),n=document.createElement('span'),count=taskRecords.filter(r=>r.source===s.name).length;i.style.background=s.color;n.textContent=s.name+' · '+count;b.append(i,n);b.disabled=!count;b.classList.toggle('active',state.source===s.name);b.setAttribute('aria-pressed',String(state.source===s.name));b.onclick=()=>{state.source=state.source===s.name?'all':s.name;filters();};$('source-legend').append(b);}draw();
}
$('task-filter').onchange=e=>{state.task=e.target.value;filters();};$('source-filter').onchange=e=>{state.source=e.target.value;filters();};$('molecule-filter').onchange=e=>{if(e.target.value)select(e.target.value);};
$('view-2d').onclick=()=>view('2d');$('view-3d').onclick=()=>view('3d');$('top-view').onclick=()=>view(state.view,true);$('reset-view').onclick=()=>{state.zoom=1;state.panX=state.panY=0;view(state.view);};$('minimize-panel').onclick=()=>{minimize();$('restore-panel').focus();};$('restore-panel').onclick=()=>{open();$('minimize-panel').focus();};
$('copy-smiles').onclick=async()=>{const text=byKey.get(state.selected)?.smiles;if(!text)return;try{await navigator.clipboard.writeText(text);}catch{const t=document.createElement('textarea');t.value=text;panel.append(t);t.select();document.execCommand('copy');t.remove();}$('copy-smiles').textContent='已复制';};
function local(e){const b=canvas.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top};}
function hits(p){return projected.filter(q=>Math.hypot(q.x-p.x,q.y-p.y)<10).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||a.r.sequence-b.r.sequence);}
canvas.onpointerdown=e=>{cancelAnimationFrame(animation);if(state.view==='2d'){state.rx=0;state.ry=0;draw();}drag={...local(e),moved:0,pan:e.shiftKey||e.button===2};canvas.setPointerCapture(e.pointerId);$('point-tooltip').hidden=true;};
canvas.onpointermove=e=>{const p=local(e);if(drag){const dx=p.x-drag.x,dy=p.y-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);if(state.view==='3d'&&!drag.pan){state.ry+=dx*.008;state.rx+=dy*.008;}else{state.panX+=dx;state.panY+=dy;}drag.x=p.x;drag.y=p.y;draw();return;}const h=hits(p),tip=$('point-tooltip');tip.hidden=!h.length;if(h.length){tip.textContent=tag(h[0].r)+' · '+h[0].r.source+(h.length>1?' · '+h.length+' 个邻近点（重复点击切换）':'');tip.style.left=Math.max(8,Math.min(p.x+14,width-240))+'px';tip.style.top=Math.max(8,p.y-48)+'px';}};
canvas.onpointerup=e=>{if(drag&&drag.moved<5){const h=hits(local(e));if(h.length){const current=h.findIndex(p=>p.r.key===state.selected);select(h[(current+1)%h.length].r.key);}}drag=null;};canvas.onpointercancel=()=>drag=null;canvas.onpointerleave=()=>{$('point-tooltip').hidden=true;};canvas.oncontextmenu=e=>e.preventDefault();
canvas.addEventListener('wheel',e=>{e.preventDefault();const p=local(e),old=state.zoom;state.zoom=Math.max(.4,Math.min(8,old*Math.exp(-e.deltaY*.001)));const ratio=state.zoom/old;state.panX=p.x-width/2-(p.x-width/2-state.panX)*ratio;state.panY=p.y-height/2-(p.y-height/2-state.panY)*ratio;draw();},{passive:false});
canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){e.preventDefault();if(e.key==='+'||e.key==='=')state.zoom=Math.min(8,state.zoom*1.15);else if(e.key==='-')state.zoom=Math.max(.4,state.zoom/1.15);else if(state.view==='3d'){state.ry+=(e.key==='ArrowRight'?.1:e.key==='ArrowLeft'?-.1:0);state.rx+=(e.key==='ArrowDown'?.1:e.key==='ArrowUp'?-.1:0);}else{state.panX+=(e.key==='ArrowRight'?15:e.key==='ArrowLeft'?-15:0);state.panY+=(e.key==='ArrowDown'?15:e.key==='ArrowUp'?-15:0);}draw();}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open'))minimize();});
 if(!ctx)$('canvas-fallback').hidden=false;filters();new ResizeObserver(resize).observe(canvas);resize();
 window.Explorer={getState:()=>({...state,visibleCount:visible.length}),project:key=>{const p=project(byKey.get(key));return {x:p.x,y:p.y,z:p.z};},rdkitReady:rdkit};
})();
