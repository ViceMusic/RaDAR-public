# RaDAR-Bench

**KAUST Curated Peptide Stability Dataset in Simulated Intestinal and Gastric Fluids**

RaDAR-Bench is a KAUST-curated, multi-source dataset for peptide stability prediction in simulated intestinal fluid (SIF) and simulated gastric fluid (SGF). It contains **513 molecular records from five patent-derived sources**, including **513 SIF** and **402 SGF** stability measurements.

### 🦊 Introduction and website

🔬 RaDAR is a research project focused on molecular stability prediction in simulated intestinal fluid (SIF) and simulated gastric fluid (SGF), providing resources for molecular feature extraction, model evaluation, and cross-source analysis.

📦 Open-source Repository: RaDAR-public

🧬 Public Dataset: RaDAR-Bench (Hugging Face)

🌐 Online Demo: RaDAR Web Demo

📄 Preprint: Not yet available. Stay tuned for updates on our research.

🛠️ Feature Extraction and Model Reuse: This project provides implementation code, usage instructions, and reference model performance for molecular feature extraction. For details on data processing and feature extraction procedures, please visit the RaDAR Workflow Demo.

💻 Model Retraining: To retrain models using existing data or reuse the provided implementations, please refer to the SIF_SGF_Reference GitHub Repository.


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






