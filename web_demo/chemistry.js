/* Copyright (C) 2003-2011 Greg Landrum and Rational Discovery LLC (ported algorithms).
 * RDKit 2025.03.4 compatibility layer. Gasteiger and QED logic ported from
 * RDKit (BSD-3-Clause); see vendor/LICENSE and README.md. */
'use strict';
window.Chemistry = (() => {
  const f = Math.fround;
  let rdkit, patterns;
  async function init() {
    rdkit = await initRDKitModule({wasmBinary:Uint8Array.from(atob(window.RDKIT_WASM_BASE64),c=>c.charCodeAt(0))});
    if(rdkit.version()!=='2025.03.4') throw Error('RDKit 版本与特征实现不匹配');
    patterns={crippen:CHEMISTRY_DATA.crippen.map(([s,v])=>[rdkit.get_qmol('[$('+s+')]'),v]),acceptors:CHEMISTRY_DATA.acceptors.map(s=>rdkit.get_qmol(s)),alerts:CHEMISTRY_DATA.alerts.map(s=>rdkit.get_qmol(s)),aliphatic:rdkit.get_qmol(CHEMISTRY_DATA.aliphatic)};
    return rdkit;
  }
  function atomGraph(mol) {
    // Parse atom and bond fields only from the pinned RDKit pickle v16.
    // These provide the actual RDKit hybridization and conjugation flags.
    const a=mol.get_as_uint8array(), d=new DataView(a.buffer,a.byteOffset,a.byteLength); let pos=0;
    const byte=()=>d.getUint8(pos++), int=()=>{let n=d.getInt32(pos,true);pos+=4;return n;};
    if(int()!==-559038737 || int()!==0 || int()!==16) throw Error('不支持的RDKit分子格式');
    int();int();const n=int(),nb=int();byte(); if(byte()!==1) throw Error('原子格式错误');
    const atoms=[];
    for(let i=0;i<n;i++) {
      const z=byte(),flags=byte(),pf=int();let charge=0,hybrid=4,expH=0,impH=0,isotope=0;
      if(flags & (16|4|2)) throw Error('此demo不支持查询原子或特殊原子注释');
      if(pf&1) pos+=4;
      if(pf&2) {charge=byte();if(charge>127)charge-=256;}
      if(pf&4)byte();if(pf&8)hybrid=byte();if(pf&16)expH=byte();
      if(pf&32)byte();if(pf&64)impH=byte();if(pf&128)byte();if(pf&256)isotope=int();
      if(flags&8) {if(byte()!==24)throw Error('原子映射格式错误');if(byte()===255)int();}
      atoms.push({z,charge,hybrid,isotope,h:expH+impH,neighbors:[]});
    }
    if(byte()!==11) throw Error('化学键格式错误');
    const idx=()=>n>255?int():byte(),bonds=[];
    for(let i=0;i<nb;i++) {
      const u=idx(),v=idx(),flags=byte();
      if(flags&(16|1))throw Error('不支持查询键');
      if(flags&8)byte();if(flags&4)byte();
      if(flags&2){byte();const count=byte();for(let j=0;j<count;j++)idx();}
      const b={u,v,conjugated:!!(flags&32)};bonds.push(b);
      atoms[u].neighbors.push({index:v,bond:i});atoms[v].neighbors.push({index:u,bond:i});
    }
    return {atoms,bonds};
  }
  function pairwise(a,start=0,n=a.length) {
    if(n<8){let s=-0;for(let i=0;i<n;i++)s=f(s+a[start+i]);return s;}
    if(n<=128){let acc=a.slice(start,start+8);let i=8;
      for(;i<n-(n%8);i+=8)for(let k=0;k<8;k++)acc[k]=f(acc[k]+a[start+i+k]);
      let s=f(f(f(acc[0]+acc[1])+f(acc[2]+acc[3]))+f(f(acc[4]+acc[5])+f(acc[6]+acc[7])));
      for(;i<n;i++)s=f(s+a[start+i]);return s;
    }
    let half=Math.floor(n/2);half-=half%8;return f(pairwise(a,start,half)+pairwise(a,start+half,n-half));
  }
  function chargeStats(graph) {
    const {atoms,bonds}=graph,n=atoms.length,q=Array(n).fill(0),h=Array(n).fill(0);
    for(let i=0;i<n;i++) {
      let formal=atoms[i].charge;
      if(Math.abs(formal)>1e-8 && Math.abs(q[i])<1e-8) {
        let marker=[i];
        for(const a of atoms[i].neighbors)if(bonds[a.bond].conjugated)
          for(const b of atoms[a.index].neighbors)
            if(a.bond!==b.bond && bonds[b.bond].conjugated && atoms[b.index].z===atoms[i].z){formal+=atoms[b.index].charge;marker.push(b.index);}
        for(const j of marker)q[j]=formal/marker.length;
      }
    }
    const params=atoms.map(a=>{
      let mode=({4:'sp3',3:'sp2',2:'sp'})[a.hybrid]||'';
      if(!mode){if(a.z===1)mode='*';else if(a.z===16){const no=a.neighbors.filter(b=>atoms[b.index].z===8).length;mode=no===2?'so2':no===1?'so':'sp3';}}
      return CHEMISTRY_DATA.gasteiger[a.z+':'+mode]||[0,0,0];
    });
    const ion=atoms.map((a,i)=>a.z===1?20.02:params[i].reduce((x,y)=>x+y,0));
    let damp=.5;
    for(let iter=0;iter<12;iter++) {
      const energy=params.map((p,i)=>p[0]+q[i]*(p[1]+p[2]*q[i]));
      for(let i=0;i<n;i++) {
        let dq=0;
        for(const a of atoms[i].neighbors){let j=a.index,dx=energy[j]-energy[i],sgn=dx<0?0:1;dq+=dx/(sgn*(ion[i]-ion[j])+ion[j]);}
        if(atoms[i].h>0){const nh=atoms[i].h,qh=h[i]/nh,eh=7.17+qh*(6.24-.56*qh),dx=eh-energy[i],sgn=dx<0?0:1,dqh=dx/(sgn*(ion[i]-20.02)+20.02);dq+=nh*dqh;h[i]-=nh*dqh*damp;}
        q[i]+=damp*dq;
      }
      damp*=.5;
    }
    const arr=q.map(x=>f(Number.isNaN(x)?0:x)),sum=pairwise(arr),mean=f(sum/n);
    const sq=arr.map(x=>{let v=f(x-mean);return f(v*v);});
    return [mean,Math.max(...arr),Math.min(...arr),f(Math.sqrt(f(pairwise(sq)/n))),sum];
  }
  const matches=(mol,q)=>{const result=JSON.parse(mol.get_substruct_matches(q));return Array.isArray(result)?result:[];};
  function qedArom(mol,graph) {
    const removed=new Set(matches(mol,patterns.aliphatic).flatMap(m=>m.atoms));
    const kept=graph.atoms.map((_,i)=>i).filter(i=>!removed.has(i));
    let components=0,edges=0;const visited=new Set();
    for(const b of graph.bonds)if(!removed.has(b.u)&&!removed.has(b.v))edges++;
    for(const i of kept)if(!visited.has(i)){components++;let stack=[i];visited.add(i);while(stack.length){let k=stack.pop();for(const a of graph.atoms[k].neighbors)if(!removed.has(a.index)&&!visited.has(a.index)){visited.add(a.index);stack.push(a.index);}}}
    return edges-kept.length+components;
  }
  function logP(mol) {
    const copy=mol.copy();
    try {
      copy.add_hs_in_place();
      const n=atomGraph(copy).atoms.length,contrib=Array(n).fill(null);
      for(const [query,value] of patterns.crippen)for(const match of matches(copy,query)) {
        const idx=match.atoms[0];if(contrib[idx]===null)contrib[idx]=value;
      }
      if(contrib.some(x=>x===null))throw Error('部分原子的Crippen贡献未匹配');
      return contrib.reduce((s,v)=>s+v,0);
    } finally {copy.delete();}
  }
  function featurize(smiles) {
    if(!rdkit)throw Error('分子引擎尚未就绪');
    if(typeof smiles!=='string'||!smiles.trim())throw Error('请输入 SMILES');
    let mol;
    try {
      mol=rdkit.get_mol(smiles.trim());
      if(!mol||!mol.is_valid())throw Error('SMILES 无法解析，请检查括号、环编号与原子符号。');
      const graph=atomGraph(mol);
      if(!graph.atoms.length)throw Error('分子不能为空');
      if(graph.atoms.length>2000)throw Error('此demo最多处理 2000 个原子的分子');
      if(graph.atoms.some(a=>a.z===0))throw Error('请提供完整分子，不能包含通配原子 *');
      const d=JSON.parse(mol.get_descriptors());
      // MinimalLib truncates descriptor JSON to five decimals. Compute mass and
      // Crippen logP from atoms, TPSA on its 0.01 lattice, and FractionCSP3 as a ratio.
      d.CrippenClogP=logP(mol);
      d.tpsa=Math.round(d.tpsa*100)/100;
      const carbon=graph.atoms.filter(a=>a.z===6);
      d.FractionCSP3=carbon.length?carbon.filter(a=>a.hybrid===4).length/carbon.length:0;
      d.amw=graph.atoms.reduce((sum,a)=>{const mass=a.isotope?CHEMISTRY_DATA.isotopes[a.z+':'+a.isotope]:CHEMISTRY_DATA.masses[a.z];if(mass===undefined)throw Error('未知同位素质量');return sum+mass+a.h*CHEMISTRY_DATA.masses['1'];},0);
      // NumAtoms in get_descriptors includes H; Python mol.GetNumAtoms() does not.
      const hba=patterns.acceptors.reduce((n,q)=>n+matches(mol,q).length,0);
      const alerts=patterns.alerts.reduce((n,q)=>n+(matches(mol,q).length>0?1:0),0);
      const values=[d.amw,d.CrippenClogP,hba,d.NumHBD,d.tpsa,d.NumRotatableBonds,qedArom(mol,graph),alerts,
        d.amw,d.CrippenClogP,d.NumHBA,d.NumHBD,d.tpsa,d.NumRotatableBonds,d.NumRings,d.FractionCSP3,
        d.NumHeavyAtoms,graph.atoms.length,d.NumRings/(d.NumRotatableBonds+1),...chargeStats(graph)].map(f);
      const bits=mol.get_morgan_fp(JSON.stringify({radius:2,nBits:1024,useChirality:true}));
      if(bits.length!==1024||/[^01]/.test(bits))throw Error('Morgan 指纹格式错误');
      if(values.length!==24||values.some(v=>!Number.isFinite(v)))throw Error('描述符计算失败，无法对此分子提供一致的模型输入');
      return {features:Float32Array.from([...values,...bits.split('').map(Number)]),descriptors:values,
              fingerprint:bits,canonical:mol.get_smiles(),atoms:graph.atoms.length,svg:mol.get_svg(500,300)};
    } finally {if(mol)mol.delete();}
  }
  return {init,featurize,version:()=>rdkit?.version()};
})();
