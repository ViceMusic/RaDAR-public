'use strict';
const $=id=>document.getElementById(id);
let task='SIF',kind='LR',last=null,ready=false;
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function clearResult(){last=null;$('empty').hidden=false;$('result').hidden=true;$('fingerprint').replaceChildren();}
function render(){
 $('result-context').textContent=task+' / '+kind;
 if(!last)return;
 const p=Inference.predict(DEMO_MODELS[task][kind],last.features),positive=p>=.5;
 $('empty').hidden=true;$('result').hidden=false;
 $('result-label').textContent=positive?'正类 · 稳定':'负类 · 不稳定';
 $('result-label').classList.toggle('negative',!positive);
 $('result-task').textContent=task==='SIF'?'模拟肠液':'模拟胃液';
 $('probability').textContent=(p*100).toFixed(2)+'%';$('meter-fill').style.width=(p*100)+'%';
 $('definition').textContent=`按 benchmark 标签定义，${task} 映射稳定时间 ≥ ${task==='SIF'?270:250} 分钟为正类。`;
 $('structure').innerHTML=last.svg;
 $('atom-count').textContent=`${last.atoms} 个显式原子 · ${last.fingerprint.split('1').length-1} 个指纹位激活`;
 const frag=document.createDocumentFragment();for(const bit of last.fingerprint){const el=document.createElement('i');if(bit==='1')el.className='on';frag.append(el);}$('fingerprint').replaceChildren(frag);
}
function selectTask(value){task=value;document.querySelectorAll('.task').forEach(b=>{b.classList.toggle('active',b.dataset.task===task);b.setAttribute('aria-pressed',b.dataset.task===task)});render();}
document.querySelectorAll('.task').forEach(b=>b.addEventListener('click',()=>selectTask(b.dataset.task)));
document.querySelectorAll('.model').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.model;document.querySelectorAll('.model').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',el===b)});render();}));
DEMO_EXAMPLES.forEach((example,i)=>{const option=document.createElement('option');option.value=i;option.textContent=example.name;$('examples').append(option)});
$('examples').addEventListener('change',()=>{if($('examples').value==='')return;const ex=DEMO_EXAMPLES[Number($('examples').value)];$('smiles').value=ex.smiles;clearResult();selectTask(ex.task);status('已载入测试样本，可点击预测。')});
$('smiles').addEventListener('input',()=>{clearResult();$('examples').value='';if(ready)status('输入已更新，请重新预测。')});
$('predict').addEventListener('click',async()=>{
 $('predict').disabled=true;status('正在计算分子特征…');clearResult();
 await new Promise(r=>setTimeout(r,20));
 try{last=Chemistry.featurize($('smiles').value);last.input=$('smiles').value.trim();render();status('预测完成。可以切换任务或模型，比较结果。');}
 catch(e){clearResult();status(e.message||String(e),true);}
 finally{$('predict').disabled=!ready;}
});
$('download').addEventListener('click',()=>{if(!last)return;const p=Inference.predict(DEMO_MODELS[task][kind],last.features),obj={smiles:last.input,canonical_smiles:last.canonical,task,model:kind,positive_probability:p,predicted_class:p>=.5?1:0,threshold:.5,feature_count:1048,rdkit_js:Chemistry.version(),training_split:888};const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`prediction_${task}_${kind}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('run-tests').addEventListener('click',async()=>{
 const button=$('run-tests');button.disabled=true;
 try{
  if(!window.PARITY_FIXTURES)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='tests/fixtures.js';s.onload=resolve;s.onerror=()=>reject(Error('测试样本加载失败'));document.head.append(s)});
  let done=0,fp=0,mismatch=0,maxProbability=0,maxDescriptor=0;
  for(const t of PARITY_FIXTURES){const actual=Chemistry.featurize(t.smiles);
   for(let i=0;i<1048;i++){if(i>=24&&actual.features[i]!==t.features[i])fp++;if(i<24)maxDescriptor=Math.max(maxDescriptor,Math.abs(actual.features[i]-t.features[i]));}
   for(const task of ['SIF','SGF'])for(const kind of ['LR','RF','XGB']){const p=Inference.predict(DEMO_MODELS[task][kind],actual.features),ref=t.probabilities[task][kind];maxProbability=Math.max(maxProbability,Math.abs(p-ref));if((p>=.5)!==(ref>=.5))mismatch++;}
   done++;if(done%10===0){$('test-status').textContent=`核对中 ${done} / ${PARITY_FIXTURES.length}…`;await new Promise(r=>setTimeout(r,0));}
  }
  const pass=fp===0&&mismatch===0&&maxDescriptor===0&&maxProbability<1e-6;
  $('test-status').textContent=`${pass?'通过':'存在差异'}：${done} 个分子，${done*6} 次预测；指纹差异 ${fp} 位，描述符最大差 ${maxDescriptor.toExponential(2)}，类别差异 ${mismatch}，概率最大差 ${maxProbability.toExponential(2)}。`;
 }catch(e){$('test-status').textContent='检查失败：'+(e.message||e)}finally{button.disabled=false;}
});
Chemistry.init().then(()=>{ready=true;$('predict').disabled=false;$('predict').textContent='预测稳定性 ↗';$('run-tests').disabled=false;status('分子引擎已就绪 · 全部计算在本地完成。')}).catch(e=>{status('加载失败：'+e.message,true);$('predict').textContent='引擎加载失败';});
