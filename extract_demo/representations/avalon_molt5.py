"""SMILES -> Avalon(512)_MolT5(768), preceded by the original 24 descriptors."""
import numpy as np
from ._vector import PeptideFeaturizer
from .weights import LoadedEncoder, load_encoder


def extract(smiles: list[str], *, encoder: LoadedEncoder | None = None,
            device: str = "cpu") -> np.ndarray:
    """Reuse a loaded encoder, or load the local pretrained weights once per call."""
    if encoder is None:
        encoder = load_encoder("molt5", device=device)
    return PeptideFeaturizer("Avalon(512)_MolT5(768)", encoders={"molt5": encoder}).transform(smiles)
