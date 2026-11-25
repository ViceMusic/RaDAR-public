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

### Molecular Descriptors and Atom Node Features

<table>
<tr>
<td width="55%" valign="top">
<h4>24-Dimensional Molecular Descriptors</h4>
<table>
<thead><tr><th>Dimension (1-based)</th><th>Group</th><th>Feature</th><th>Calculation</th></tr></thead>
<tbody>
<tr><td>1</td><td>QED</td><td>Molecular weight (MW)</td><td><code>QED.properties(mol).MW</code></td></tr>
<tr><td>2</td><td>QED</td><td>Octanol/water partition coefficient (ALOGP)</td><td><code>QED.properties(mol).ALOGP</code></td></tr>
<tr><td>3</td><td>QED</td><td>Hydrogen-bond acceptors (QED HBA)</td><td><code>QED.properties(mol).HBA</code></td></tr>
<tr><td>4</td><td>QED</td><td>Hydrogen-bond donors (QED HBD)</td><td><code>QED.properties(mol).HBD</code></td></tr>
<tr><td>5</td><td>QED</td><td>Polar surface area (PSA)</td><td><code>QED.properties(mol).PSA</code></td></tr>
<tr><td>6</td><td>QED</td><td>Rotatable bonds (QED ROTB)</td><td><code>QED.properties(mol).ROTB</code></td></tr>
<tr><td>7</td><td>QED</td><td>Aromatic rings (QED AROM)</td><td><code>QED.properties(mol).AROM</code></td></tr>
<tr><td>8</td><td>QED</td><td>Structural alerts (ALERTS)</td><td><code>QED.properties(mol).ALERTS</code></td></tr>
<tr><td>9</td><td>Physicochemical</td><td>Molecular weight</td><td><code>Descriptors.MolWt(mol)</code></td></tr>
<tr><td>10</td><td>Physicochemical</td><td>Octanol/water partition coefficient (LogP)</td><td><code>Crippen.MolLogP(mol)</code></td></tr>
<tr><td>11</td><td>Physicochemical</td><td>Hydrogen-bond acceptors</td><td><code>rdMolDescriptors.CalcNumHBA(mol)</code></td></tr>
<tr><td>12</td><td>Physicochemical</td><td>Hydrogen-bond donors</td><td><code>rdMolDescriptors.CalcNumHBD(mol)</code></td></tr>
<tr><td>13</td><td>Physicochemical</td><td>Topological polar surface area (TPSA)</td><td><code>rdMolDescriptors.CalcTPSA(mol)</code></td></tr>
<tr><td>14</td><td>Physicochemical</td><td>Rotatable bonds</td><td><code>rdMolDescriptors.CalcNumRotatableBonds(mol)</code></td></tr>
<tr><td>15</td><td>Physicochemical</td><td>Ring count</td><td><code>rdMolDescriptors.CalcNumRings(mol)</code></td></tr>
<tr><td>16</td><td>Physicochemical</td><td>Fraction of sp³ carbon atoms</td><td><code>rdMolDescriptors.CalcFractionCSP3(mol)</code></td></tr>
<tr><td>17</td><td>Physicochemical</td><td>Heavy atom count</td><td><code>mol.GetNumHeavyAtoms()</code></td></tr>
<tr><td>18</td><td>Physicochemical</td><td>Atom count in the RDKit molecule</td><td><code>mol.GetNumAtoms()</code></td></tr>
<tr><td>19</td><td>Physicochemical</td><td>Rigidity ratio</td><td><code>rings / (rot_bonds + 1.0)</code></td></tr>
<tr><td>20</td><td>Charge</td><td>Mean Gasteiger charge</td><td><code>arr.mean()</code></td></tr>
<tr><td>21</td><td>Charge</td><td>Maximum Gasteiger charge</td><td><code>arr.max()</code></td></tr>
<tr><td>22</td><td>Charge</td><td>Minimum Gasteiger charge</td><td><code>arr.min()</code></td></tr>
<tr><td>23</td><td>Charge</td><td>Population standard deviation of Gasteiger charges</td><td><code>arr.std(ddof=0)</code></td></tr>
<tr><td>24</td><td>Charge</td><td>Sum of Gasteiger charges</td><td><code>arr.sum()</code></td></tr>
</tbody>
</table>
</td>
<td width="45%" valign="top">
<h4>36-Dimensional Atom Node Features</h4>
<table>
<thead><tr><th>Dimensions (1-based)</th><th>Size</th><th>Feature / API</th><th>Encoding / Ordered Categories</th></tr></thead>
<tbody>
<tr><td>1–10</td><td>10</td><td>Atomic number<br><code>atom.GetAtomicNum()</code></td><td>One-hot: 1, 6, 7, 8, 9, 15, 16, 17, 35, 53 (H, C, N, O, F, P, S, Cl, Br, I)</td></tr>
<tr><td>11–17</td><td>7</td><td>Atom degree<br><code>atom.GetDegree()</code></td><td>One-hot: 0, 1, 2, 3, 4, 5, 10</td></tr>
<tr><td>18–23</td><td>6</td><td>Formal charge<br><code>atom.GetFormalCharge()</code></td><td>One-hot: -2, -1, 0, 1, 2, 3</td></tr>
<tr><td>24</td><td>1</td><td>Ring membership<br><code>atom.IsInRing()</code></td><td>Binary: yes = 1; no = 0</td></tr>
<tr><td>25</td><td>1</td><td>Aromaticity<br><code>atom.GetIsAromatic()</code></td><td>Binary: yes = 1; no = 0</td></tr>
<tr><td>26–30</td><td>5</td><td>Total hydrogen count<br><code>atom.GetTotalNumHs()</code></td><td>One-hot: 0, 1, 2, 3, 4</td></tr>
<tr><td>31–36</td><td>6</td><td>Hybridization<br><code>atom.GetHybridization()</code></td><td>One-hot: SP, SP2, SP3, SP3D, SP3D2, UNSPECIFIED</td></tr>
</tbody>
</table>
</td>
</tr>
</table>
