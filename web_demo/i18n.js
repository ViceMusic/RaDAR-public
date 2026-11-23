/* Local, reversible DOM translations: model inputs, data and UI state remain untouched. */
(() => {
'use strict';
const dictionary=window.RADAR_TRANSLATIONS, supported=['zh','en','ja'];
const urlLang=new URL(location.href).searchParams.get('lang');let saved;
try{saved=localStorage.getItem('radar-language');}catch{}
let language=supported.includes(urlLang)?urlLang:supported.includes(saved)?saved:'zh';
const textSources=new WeakMap(),attributeSources=new WeakMap();
const skip='script,style,svg,textarea,pre,#language-switch,#full-smiles,#smiles-preview';
function translate(source){
 if(language==='zh')return source;
 const known=dictionary[source]?.[language];if(known)return known;
 const en=language==='en';let m;
 if((m=source.match(/^按 benchmark 标签定义，(SIF|SGF) 映射稳定时间 ≥ (\d+) 分钟为正类。$/)))return en?`Under the benchmark definition, ${m[1]} mapped stability time ≥ ${m[2]} min is positive.`:`ベンチマークのラベル定義では、${m[1]}の換算安定性時間が${m[2]}分以上の場合、陽性です。`;
 if((m=source.match(/^(\d+) 个显式原子 · (\d+) 个指纹位激活$/)))return en?`${m[1]} explicit atoms · ${m[2]} active fingerprint bits`:`明示的原子${m[1]}個 · 指紋の有効ビット${m[2]}個`;
 if((m=source.match(/^(SIF|SGF) 测试样本 · (正类|负类)$/)))return en?`${m[1]} test sample · ${m[2]==='正类'?'Positive':'Negative'}`:`${m[1]}テストサンプル · ${m[2]==='正类'?'陽性':'陰性'}`;
 if((m=source.match(/^全部来源（(\d+)）$/)))return en?`All sources (${m[1]})`:`すべての出典（${m[1]}）`;
 if((m=source.match(/^分子 (#\d+)$/)))return en?`Molecule ${m[1]}`:`分子 ${m[1]}`;
 if((m=source.match(/^原始标记：(.*) · 映射值$/)))return en?`Original annotation: ${m[1]} · Mapped value`:`元の表記：${m[1]} · 換算値`;
 if((m=source.match(/^原始标记：(.*)$/)))return en?`Original annotation: ${m[1]}`:`元の表記：${m[1]}`;
 if((m=source.match(/^原始数值：(.*)$/)))return en?`Original value: ${m[1]}`:`元の数値：${m[1]}`;
 if((m=source.match(/^(.*) · (\d+) 个邻近点（重复点击切换）$/)))return en?`${m[1]} · ${m[2]} nearby points (click again to cycle)`:`${m[1]} · 近接点${m[2]}個（再クリックで切替）`;
 if((m=source.match(/^核对中 (\d+) \/ (\d+)…$/)))return en?`Checking ${m[1]} / ${m[2]}…`:`検証中 ${m[1]} / ${m[2]}…`;
 if((m=source.match(/^(通过|存在差异)：(\d+) 个分子，(\d+) 次预测；指纹差异 (\d+) 位，描述符最大差 (.*)，类别差异 (\d+)，概率最大差 (.*)。$/)))return en?`${m[1]==='通过'?'Passed':'Differences found'}: ${m[2]} molecules, ${m[3]} predictions; ${m[4]} fingerprint bit differences, max descriptor difference ${m[5]}, ${m[6]} class differences, max probability difference ${m[7]}.`:`${m[1]==='通过'?'合格':'差異あり'}：${m[2]}分子、${m[3]}回の予測。指紋差${m[4]}ビット、記述子の最大差${m[5]}、クラス差${m[6]}、確率の最大差${m[7]}。`;
 if((m=source.match(/^(检查失败|加载失败)：(.*)$/)))return (en?(m[1]==='检查失败'?'Check failed: ':'Loading failed: '):(m[1]==='检查失败'?'検証に失敗しました：':'読み込みに失敗しました：'))+translate(m[2]);
 return source;
}
function convertText(node){
 const value=node.nodeValue, previous=textSources.get(node);let original=previous&&value===previous.rendered?previous.original:value;
 const trimmed=original.trim();if(!trimmed)return;
 const rendered=original.replace(trimmed,()=>translate(trimmed));textSources.set(node,{original,rendered});if(value!==rendered)node.nodeValue=rendered;
}
function convertAttributes(el){
 let cache=attributeSources.get(el);if(!cache){cache={};attributeSources.set(el,cache);}
 for(const attr of ['title','aria-label','placeholder']){if(!el.hasAttribute(attr))continue;const value=el.getAttribute(attr),old=cache[attr],original=old&&value===old.rendered?old.original:value,rendered=translate(original);cache[attr]={original,rendered};if(value!==rendered)el.setAttribute(attr,rendered);}
}
function updateLinks(){
 for(const a of document.querySelectorAll('a[href]')){const href=a.getAttribute('href');if(!/^(index|dataset|workflow|about)\.html(?:[?#]|$)/.test(href))continue;const u=new URL(href,location.href);u.searchParams.set('lang',language);a.setAttribute('href',u.pathname.split('/').pop()+u.search+u.hash);}
}
let pending=false;
const observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;apply();});}});
function apply(){
 observer.disconnect();
 document.documentElement.lang=language==='zh'?'zh-CN':language;
 const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&!n.parentElement.closest(skip)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});let n;while((n=walker.nextNode()))convertText(n);
 for(const el of document.querySelectorAll('[title],[aria-label],[placeholder]')){if(!el.closest('svg,script,style'))convertAttributes(el);}
 document.getElementById('language-switch').value=language;updateLinks();
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
}
function setLanguage(value){if(!supported.includes(value))return;language=value;try{localStorage.setItem('radar-language',language);}catch{}const u=new URL(location.href);u.searchParams.set('lang',language);try{history.replaceState(null,'',u);}catch{}apply();window.dispatchEvent(new CustomEvent('radar:languagechange',{detail:{language}}));}
 document.getElementById('language-switch').addEventListener('change',e=>setLanguage(e.target.value));
 window.RadarI18n={setLanguage,getLanguage:()=>language,translate};
 apply();
})();
