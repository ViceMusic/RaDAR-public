"""36维原子特征、双向无属性边；复用原 smile_gin.py。"""
from typing import Iterable
import torch
from rdkit import Chem
from torch_geometric.data import Data

ATOM_NUMBERS = [1, 6, 7, 8, 9, 15, 16, 17, 35, 53]
ATOM_DEGREES = [0, 1, 2, 3, 4, 5, 10]
FORMAL_CHARGES = [-2, -1, 0, 1, 2, 3]
HYDROGEN_COUNTS = [0, 1, 2, 3, 4]
HYBRIDIZATIONS = [
    Chem.HybridizationType.SP,
    Chem.HybridizationType.SP2,
    Chem.HybridizationType.SP3,
    Chem.HybridizationType.SP3D,
    Chem.HybridizationType.SP3D2,
    Chem.HybridizationType.UNSPECIFIED,
]
NODE_FEATURE_DIM = 36


def _one_hot(value: object, choices: Iterable[object]) -> list[int]:
    items = list(choices)
    return [1 if value == item else 0 for item in items]


def get_atom_features(atom: Chem.Atom) -> list[float]:
    features: list[float] = []
    features += _one_hot(atom.GetAtomicNum(), ATOM_NUMBERS)
    features += _one_hot(atom.GetDegree(), ATOM_DEGREES)
    features += _one_hot(atom.GetFormalCharge(), FORMAL_CHARGES)
    features.append(1 if atom.IsInRing() else 0)
    features.append(1 if atom.GetIsAromatic() else 0)
    features += _one_hot(atom.GetTotalNumHs(), HYDROGEN_COUNTS)
    features += _one_hot(atom.GetHybridization(), HYBRIDIZATIONS)
    return features


def smiles_to_graph_data(smiles: str) -> Data:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None or mol.GetNumAtoms() == 0:
        raise ValueError(f"Invalid SMILES: {smiles}")

    node_features = [get_atom_features(atom) for atom in mol.GetAtoms()]
    x = torch.tensor(node_features, dtype=torch.float)

    edge_pairs: list[list[int]] = []
    for bond in mol.GetBonds():
        start = bond.GetBeginAtomIdx()
        end = bond.GetEndAtomIdx()
        edge_pairs.append([start, end])
        edge_pairs.append([end, start])

    if edge_pairs:
        edge_index = torch.tensor(edge_pairs, dtype=torch.long).t().contiguous()
    else:
        edge_index = torch.empty((2, 0), dtype=torch.long)

    return Data(x=x, edge_index=edge_index)
