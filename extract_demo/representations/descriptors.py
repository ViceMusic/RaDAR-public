"""24维描述符；原样复用 methods/featurizers.py 的计算及历史异常处理。"""
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem, Crippen, Descriptors, QED, rdMolDescriptors

def _gasteiger_charge_stats(mol: Chem.Mol) -> list[float]:
    try:
        Chem.rdPartialCharges.ComputeGasteigerCharges(mol)
        charges = []

        for atom in mol.GetAtoms():
            value = atom.GetProp("_GasteigerCharge")
            if value in ("nan", "-nan"):
                charges.append(0.0)
            else:
                charges.append(float(value))

        if not charges:
            return [0.0] * 5

        arr = np.array(charges, dtype=np.float32)
        return [
            float(arr.mean()),
            float(arr.max()),
            float(arr.min()),
            float(arr.std()),
            float(arr.sum()),
        ]

    except Exception:
        return [0.0] * 5

def _qed_properties(mol: Chem.Mol) -> list[float]:
    try:
        props = QED.properties(mol)
        return [
            float(props.MW),
            float(props.ALOGP),
            float(props.HBA),
            float(props.HBD),
            float(props.PSA),
            float(props.ROTB),
            float(props.AROM),
            float(props.ALERTS),
        ]

    except Exception:
        return [0.0] * 8

def _physchem_descriptors(mol: Chem.Mol) -> list[float]:
    try:
        heavy_atoms = float(mol.GetNumHeavyAtoms())
        rings = float(rdMolDescriptors.CalcNumRings(mol))
        rot_bonds = float(rdMolDescriptors.CalcNumRotatableBonds(mol))
        rigidity = rings / (rot_bonds + 1.0)

        return [
            float(Descriptors.MolWt(mol)),
            float(Crippen.MolLogP(mol)),
            float(rdMolDescriptors.CalcNumHBA(mol)),
            float(rdMolDescriptors.CalcNumHBD(mol)),
            float(rdMolDescriptors.CalcTPSA(mol)),
            rot_bonds,
            rings,
            float(rdMolDescriptors.CalcFractionCSP3(mol)),
            heavy_atoms,
            float(mol.GetNumAtoms()),
            float(rigidity),
        ]

    except Exception:
        return [0.0] * 11


# 调用接口：返回顺序固定为 QED(8) + 理化(11) + Gasteiger(5)。
def describe_molecule(mol) -> np.ndarray:
    if mol is None or mol.GetNumAtoms() == 0:
        raise ValueError("Empty or invalid molecule")
    value = np.asarray(_qed_properties(mol) + _physchem_descriptors(mol)
                       + _gasteiger_charge_stats(mol), dtype=np.float32)
    if value.shape != (24,) or not np.isfinite(value).all():
        raise ValueError("Non-finite or invalid descriptor vector")
    return value

