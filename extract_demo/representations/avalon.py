"""SMILES -> Avalon(512), preceded by the original 24 descriptors."""
import numpy as np
from ._vector import PeptideFeaturizer


def extract(smiles: list[str]) -> np.ndarray:
    """Return one float32 feature row per SMILES, without standardization."""
    return PeptideFeaturizer("Avalon(512)").transform(smiles)
