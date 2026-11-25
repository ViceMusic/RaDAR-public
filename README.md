# RaDAR-Bench

**KAUST Curated Peptide Stability Dataset in Simulated Intestinal and Gastric Fluids**

RaDAR-Bench is a KAUST-curated, multi-source dataset for peptide stability prediction in simulated intestinal fluid (SIF) and simulated gastric fluid (SGF). It contains **513 molecular records from five patent-derived sources**, including **513 SIF** and **402 SGF** stability measurements.

### 🦊 Introduction and website

🔬 **RaDAR** is a research project focused on molecular stability prediction in simulated intestinal fluid (SIF) and simulated gastric fluid (SGF), providing resources for molecular feature extraction, model evaluation, and cross-source analysis.

📦 **Open-source Repository:** [RaDAR-public](https://github.com/ViceMusic/RaDAR-public)

🧬 **Public Dataset:** [RaDAR-Bench (Hugging Face)](https://huggingface.co/datasets/Vicemusic5/RaDAR-Bench)

🌐 **Online Demo:** [RaDAR Web Demo](https://vicemusic.github.io/RaDAR-public/web_demo/prediction.html)

📄 **Preprint:** Not yet available. Stay tuned for updates on our research.

🛠️ **Feature Extraction and Model Reuse:** This project provides implementation code, usage instructions, and reference model performance for molecular feature extraction. For details on data processing and feature extraction procedures, please visit the [RaDAR Workflow Demo](https://vicemusic.github.io/RaDAR-public/web_demo/workflow.html?lang=en).

💻 **Model Retraining:** To retrain models using existing data or reuse the provided implementations, please refer to the [SIF_SGF_Reference GitHub Repository](https://github.com/ViceMusic/SIF_SGF_Reference).


### 📦 Dataset Download

The complete public dataset is available on Hugging Face:

**[🤗 Download RaDAR-Bench](https://huggingface.co/datasets/Vicemusic5/RaDAR-Bench)**

### 📬 Contact

For questions, feedback, or dataset-related inquiries, please contact:

**Tian (Hokkaido University)**  
Email: **tian@lmd.ist.hokudai.ac.jp**

### Python Extraction Demo

[`extract_demo/`](extract_demo/README.md) provides standalone molecular feature extraction (Morgan, Avalon, MolFormer, MolT5 and graph features) and LR/RF/XGB/GIN model examples. See its README for Python 3.12 dependencies and pretrained weight downloads.

```bash
python -m pip install -r extract_demo/requirements.txt
python -B -m extract_demo.test --download
```

With pretrained weights already available locally, omit `--download`.

### Web Demo

An interactive web demo is available for exploring peptide stability predictions in simulated intestinal fluid (SIF) and simulated gastric fluid (SGF).

**[🌐 Launch RaDAR Web Demo](https://vicemusic.github.io/RaDAR-public/web_demo/prediction.html?lang=zh)**

The demo supports SMILES-based molecular input and stability classification using Logistic Regression (LR), Random Forest (RF), and XGBoost (XGB). All predictions run locally in the browser without uploading molecular structures to a server.

The website also provides access to dataset exploration, the RaDAR evaluation protocol, and project information.

### 特征定义：24 维分子描述符与 36 维原子节点特征

以下按当前代码的实际拼接顺序整理，**维度编号从 1 开始**（对应 Python 下标从 0 开始）。24 维是每个分子的描述符向量；36 维是分子图中**每个原子**的节点特征，不是整个分子只有 36 个数。

代码依据：[descriptors.py](extract_demo/representations/descriptors.py) 中的 `describe_molecule()`、[graph.py](extract_demo/representations/graph.py) 中的 `get_atom_features()` 和 `smiles_to_graph_data()`，以及 [_vector.py](extract_demo/representations/_vector.py) 中的向量拼接逻辑。

<!-- HTML tables keep the two feature specifications side by side on GitHub. -->
<table>
<tr>
<td width="55%" valign="top">
<h4>24 维分子描述符</h4>
<p>QED 属性 8 维 + 理化描述符 11 维 + Gasteiger 电荷统计 5 维。</p>
<table>
<thead><tr><th>维度</th><th>分组</th><th>特征</th><th>代码计算来源</th></tr></thead>
<tbody>
<tr><td>1</td><td>QED</td><td>分子量 MW</td><td><code>QED.properties(mol).MW</code></td></tr>
<tr><td>2</td><td>QED</td><td>脂水分配系数 ALOGP</td><td><code>QED.properties(mol).ALOGP</code></td></tr>
<tr><td>3</td><td>QED</td><td>氢键受体数 HBA（QED 定义）</td><td><code>QED.properties(mol).HBA</code></td></tr>
<tr><td>4</td><td>QED</td><td>氢键供体数 HBD</td><td><code>QED.properties(mol).HBD</code></td></tr>
<tr><td>5</td><td>QED</td><td>极性表面积 PSA</td><td><code>QED.properties(mol).PSA</code></td></tr>
<tr><td>6</td><td>QED</td><td>可旋转键数 ROTB（QED 定义）</td><td><code>QED.properties(mol).ROTB</code></td></tr>
<tr><td>7</td><td>QED</td><td>芳香环数 AROM（QED 定义）</td><td><code>QED.properties(mol).AROM</code></td></tr>
<tr><td>8</td><td>QED</td><td>结构警示匹配数 ALERTS</td><td><code>QED.properties(mol).ALERTS</code></td></tr>
<tr><td>9</td><td>理化</td><td>分子量</td><td><code>Descriptors.MolWt(mol)</code></td></tr>
<tr><td>10</td><td>理化</td><td>脂水分配系数 LogP</td><td><code>Crippen.MolLogP(mol)</code></td></tr>
<tr><td>11</td><td>理化</td><td>氢键受体数</td><td><code>rdMolDescriptors.CalcNumHBA(mol)</code></td></tr>
<tr><td>12</td><td>理化</td><td>氢键供体数</td><td><code>rdMolDescriptors.CalcNumHBD(mol)</code></td></tr>
<tr><td>13</td><td>理化</td><td>拓扑极性表面积 TPSA</td><td><code>rdMolDescriptors.CalcTPSA(mol)</code></td></tr>
<tr><td>14</td><td>理化</td><td>可旋转键数</td><td><code>rdMolDescriptors.CalcNumRotatableBonds(mol)</code></td></tr>
<tr><td>15</td><td>理化</td><td>环数</td><td><code>rdMolDescriptors.CalcNumRings(mol)</code></td></tr>
<tr><td>16</td><td>理化</td><td>sp³ 碳占比</td><td><code>rdMolDescriptors.CalcFractionCSP3(mol)</code></td></tr>
<tr><td>17</td><td>理化</td><td>重原子数</td><td><code>mol.GetNumHeavyAtoms()</code></td></tr>
<tr><td>18</td><td>理化</td><td>分子对象中的原子数</td><td><code>mol.GetNumAtoms()</code></td></tr>
<tr><td>19</td><td>理化</td><td>自定义刚性比值</td><td><code>环数 / (可旋转键数 + 1.0)</code></td></tr>
<tr><td>20</td><td>电荷</td><td>Gasteiger 原子电荷均值</td><td><code>arr.mean()</code></td></tr>
<tr><td>21</td><td>电荷</td><td>Gasteiger 原子电荷最大值</td><td><code>arr.max()</code></td></tr>
<tr><td>22</td><td>电荷</td><td>Gasteiger 原子电荷最小值</td><td><code>arr.min()</code></td></tr>
<tr><td>23</td><td>电荷</td><td>Gasteiger 原子电荷总体标准差</td><td><code>arr.std()（ddof=0）</code></td></tr>
<tr><td>24</td><td>电荷</td><td>Gasteiger 原子电荷之和</td><td><code>arr.sum()</code></td></tr>
</tbody>
</table>
</td>
<td width="45%" valign="top">
<h4>36 维原子节点特征</h4>
<p>10 + 7 + 6 + 1 + 1 + 5 + 6 = 36 维。独热编码的每个类别占一维，类别顺序即维度顺序。</p>
<table>
<thead><tr><th>维度</th><th>维数</th><th>特征与接口</th><th>类别顺序 / 编码</th></tr></thead>
<tbody>
<tr><td>1–10</td><td>10</td><td>原子序数<br><code>atom.GetAtomicNum()</code></td><td><code>1, 6, 7, 8, 9, 15, 16, 17, 35, 53</code><br>依次对应 H、C、N、O、F、P、S、Cl、Br、I。</td></tr>
<tr><td>11–17</td><td>7</td><td>原子度数<br><code>atom.GetDegree()</code></td><td><code>0, 1, 2, 3, 4, 5, 10</code><br>分子图中的邻接原子数；不是键级之和，类别中没有 6–9。</td></tr>
<tr><td>18–23</td><td>6</td><td>形式电荷<br><code>atom.GetFormalCharge()</code></td><td><code>-2, -1, 0, 1, 2, 3</code><br>独热编码；不是 Gasteiger 部分电荷。</td></tr>
<tr><td>24</td><td>1</td><td>是否处于环中<br><code>atom.IsInRing()</code></td><td><code>是 = 1；否 = 0</code><br>单个二值特征。</td></tr>
<tr><td>25</td><td>1</td><td>是否为芳香原子<br><code>atom.GetIsAromatic()</code></td><td><code>是 = 1；否 = 0</code><br>单个二值特征。</td></tr>
<tr><td>26–30</td><td>5</td><td>原子总氢数<br><code>atom.GetTotalNumHs()</code></td><td><code>0, 1, 2, 3, 4</code><br>按 RDKit 此接口的默认行为读取，再做独热编码。</td></tr>
<tr><td>31–36</td><td>6</td><td>杂化类型<br><code>atom.GetHybridization()</code></td><td><code>SP, SP2, SP3, SP3D, SP3D2, UNSPECIFIED</code><br>按列出的顺序独热编码。UNSPECIFIED 是具体枚举值，不是所有未知类别的兜底。</td></tr>
</tbody>
</table>
<p><strong>独热编码规则：</strong>仅当实际取值等于某个列出的类别时，该维为 1，其余为 0；若取值不在列表中，则该组全部为 0，不增加 unknown 维度。</p>
<p><strong>图结构：</strong><code>x</code> 的形状为 <code>[N, 36]</code>，其中 N 是 RDKit 分子对象中的原子数。每条化学键添加两个方向的边，<code>edge_index</code> 形状为 <code>[2, 2B]</code>，B 是键数；无键时为 <code>[2, 0]</code>。当前未创建 <code>edge_attr</code>，因此没有显式键类型、键级或键立体化学特征。</p>
</td>
</tr>
</table>

实现说明：

- **24 维不是 24 个互不重复的指标，也不是 QED 得分。** 前 8 维来自 `QED.properties()`；分子量、LogP 等与后续理化部分重复保留。名称相近的指标仍应以各自接口定义为准，例如 QED 的 HBA 与 `CalcNumHBA()` 不能仅凭名称假定完全一致。
- **电荷统计的对象**是 `ComputeGasteigerCharges(mol)` 之后，遍历 `mol.GetAtoms()` 读取的 `_GasteigerCharge`。代码没有另行加入隐式氢的电荷；统计数组为 `float32`，标准差使用总体标准差。
- **没有主动补氢。** 特征提取和建图均从 `Chem.MolFromSmiles()` 得到分子，未调用 `Chem.AddHs()`；第 18 维是该对象中的实际原子数，不应解释为“补齐所有氢后的总原子数”。图节点也沿用同一原则。
- **异常处理。** QED、理化、电荷三组内部计算发生异常时，分别返回 8、11、5 个零；电荷属性字符串为 `nan` 或 `-nan` 时，该原子电荷按 0 处理。最终描述符仍须通过形状与有限值检查；无效或空分子会报错。
- **模型输入。** 24 维描述符固定放在向量表示最前面，随后拼接 Morgan、Avalon 或预训练表示，不做描述符标准化。图节点特征以浮点张量存储 0/1 编码，未显式加入手性标签；这与启用手性编码的 Morgan 指纹不同。

两张表使用 Markdown 内嵌 HTML 并排排版；窄屏或不支持 HTML 的 Markdown 阅读器可能需要横向滚动或无法完整呈现布局。
