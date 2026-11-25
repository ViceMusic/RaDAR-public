"""Representation dimensions and pinned pretrained revisions from code/config.py."""
from pathlib import Path

WEIGHTS_ROOT = Path(__file__).resolve().parent / ".weights"
HF_MODELS = {
    "molformer": {"model_id": "ibm-research/MoLFormer-XL-both-10pct",
                  "revision": "7b12d946c181a37f6012b9dc3b002275de070314"},
    "molt5": {"model_id": "laituan245/molt5-base",
              "revision": "7f2da6b30fd8ddc55b7867d53ce75e09bb85f284"},
}
REPRESENTATIONS = {
    "Morgan(1024)": ("morgan",),
    "Avalon(512)": ("avalon",),
    "molFormer(768)": ("molformer",),
    "MolT5(768)": ("molt5",),
    "Avalon(512)_MolT5(768)": ("avalon", "molt5"),
    "Avalon(512)_molFormer(768)": ("avalon", "molformer"),
}
BASE_DIMS = {"morgan": 1024, "avalon": 512, "molformer": 768, "molt5": 768}

def representation_dim(name: str) -> int:
    return 24 + sum(BASE_DIMS[k] for k in REPRESENTATIONS[name])
