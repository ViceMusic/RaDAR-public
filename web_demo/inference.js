'use strict';
window.Inference=(()=>{
 const sigmoid=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
 function predict(model,input){
  if(input.length!==1048)throw Error('特征必须为1048维');
  const x=Float32Array.from(input);
  if(model.type==='LR')return sigmoid(model.coef.reduce((s,w,i)=>s+w*x[i],model.intercept));
  if(model.type==='RF')return model.trees.reduce((sum,t)=>{let i=0;while(t.left[i]!==-1)i=x[t.feature[i]]<=t.threshold[i]?t.left[i]:t.right[i];return sum+t.positive[i];},0)/model.trees.length;
  if(model.type==='XGB'){
   let margin=Math.fround(model.base_margin);
   for(const t of model.trees){let i=0;while(t.left_children[i]!==-1){let v=x[t.split_indices[i]];i=Number.isNaN(v)?(t.default_left[i]?t.left_children[i]:t.right_children[i]):v<Math.fround(t.split_conditions[i])?t.left_children[i]:t.right_children[i];}margin=Math.fround(margin+Math.fround(t.split_conditions[i]));}
   return sigmoid(margin);
  }
  throw Error('未知模型');
 }
 return {predict};
})();
