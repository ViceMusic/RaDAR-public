"""论文六种向量表示；描述符与 embedding 分开，权重加载独立。

保持旧实现的拼接顺序：24维描述符在前，随后 Avalon/Morgan/预训练向量。
"""
import numpy as np
import torch
import torch.nn.functional as F
from rdkit import Chem, DataStructs
from rdkit.Chem import rdFingerprintGenerator
from ._config import REPRESENTATIONS, BASE_DIMS, representation_dim
from .descriptors import describe_molecule


def fingerprint(mol, kind: str) -> np.ndarray:
    if kind == "morgan":
        fp = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=1024,
                                                       includeChirality=True).GetFingerprint(mol)
    elif kind == "avalon":
        from rdkit.Avalon import pyAvalonTools
        fp = pyAvalonTools.GetAvalonFP(mol, 512)
    else:
        raise ValueError(kind)
    vector = np.zeros(BASE_DIMS[kind], dtype=np.float32)
    DataStructs.ConvertToNumpyArray(fp, vector)
    return vector


@torch.no_grad()
def pretrained_embedding(smiles: str, encoder) -> np.ndarray:
    encoder.model.eval()
    if encoder.kind == "molformer":
        tokens = encoder.tokenizer(smiles, padding=True, truncation=True,
                                   return_tensors="pt").to(encoder.device)
        outputs = encoder.model(**tokens)
        pooled = getattr(outputs, "pooler_output", None)
        # Preserve old single-molecule fallback (no padded batch is used here).
        if pooled is None:
            pooled = outputs.last_hidden_state.mean(dim=1)
        vector = F.normalize(pooled.squeeze(0), p=2, dim=-1)
    elif encoder.kind == "molt5":
        tokens = encoder.tokenizer(smiles, truncation=True, return_tensors="pt").to(encoder.device)
        hidden = encoder.model.encoder(**tokens).last_hidden_state
        mask = tokens["attention_mask"].unsqueeze(-1)
        vector = ((hidden * mask).sum(1) / mask.sum(1)).squeeze(0)
    else:
        raise ValueError(encoder.kind)
    array = vector.detach().cpu().numpy().astype(np.float32)
    if array.shape != (768,) or not np.isfinite(array).all():
        raise ValueError(f"Invalid {encoder.kind} embedding: {array.shape}")
    return array


class PeptideFeaturizer:
    def __init__(self, representation: str, *, encoders: dict | None = None):
        self.parts = REPRESENTATIONS[representation]
        self.n_features = representation_dim(representation)
        self.encoders = dict(encoders or {})
        for kind in self.parts:
            if kind in ("molformer", "molt5") and kind not in self.encoders:
                raise ValueError(f"Load {kind} explicitly with representations.weights.load_encoder and pass encoders={{'{kind}': encoder}}")
            if kind in self.encoders and self.encoders[kind].kind != kind:
                raise ValueError(f"Encoder kind mismatch for {kind}")

    def transform(self, smiles: list[str]) -> np.ndarray:
        rows = []
        for value in smiles:
            mol = Chem.MolFromSmiles(value)
            if mol is None or mol.GetNumAtoms() == 0:
                raise ValueError(f"Invalid SMILES: {value!r}")
            parts = [describe_molecule(mol)]
            for kind in self.parts:
                parts.append(fingerprint(mol, kind) if kind in ("morgan", "avalon")
                             else pretrained_embedding(value, self.encoders[kind]))
            vector = np.concatenate(parts)
            if vector.shape != (self.n_features,) or not np.isfinite(vector).all():
                raise ValueError("Invalid feature vector")
            rows.append(vector)
        return np.asarray(rows, dtype=np.float32).reshape(len(rows), self.n_features)

    def featurize(self, smiles: str):
        """旧调用形式 (vector, True)；失败直接抛异常，不伪造特征。"""
        return self.transform([smiles])[0].tolist(), True


# 调用接口：from embedding import build_featurizer
def build_featurizer(representation: str, *, encoders: dict | None = None):
    return PeptideFeaturizer(representation, encoders=encoders)

