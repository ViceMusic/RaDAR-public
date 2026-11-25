"""Local pretrained loading, adapted from code/weights.py."""
from dataclasses import dataclass
from pathlib import Path
import os
from ._config import WEIGHTS_ROOT


@dataclass
class LoadedEncoder:
    kind: str
    tokenizer: object
    model: object
    device: str
    source: str


def load_encoder(kind: str, *, device: str = "cpu") -> LoadedEncoder:
    """Load representations/.weights/<kind>; no implicit download or training."""
    location = WEIGHTS_ROOT / kind
    if not (location / "config.json").is_file():
        raise FileNotFoundError(f"Missing {location}; from the repository root run python -m extract_demo.representations.download_weights")

    modules = WEIGHTS_ROOT / "hf-cache" / "modules"
    os.environ["HF_MODULES_CACHE"] = str(modules)
    from transformers import AutoModel, AutoTokenizer, T5ForConditionalGeneration
    from transformers import dynamic_module_utils
    dynamic_module_utils.HF_MODULES_CACHE = str(modules)
    kwargs = dict(local_files_only=True, cache_dir=str(WEIGHTS_ROOT / "hf-cache"))
    if kind == "molformer":
        tokenizer = AutoTokenizer.from_pretrained(location, trust_remote_code=True, **kwargs)
        model = AutoModel.from_pretrained(location, trust_remote_code=True,
                                         deterministic_eval=True, **kwargs)
    elif kind == "molt5":
        tokenizer = AutoTokenizer.from_pretrained(location, model_max_length=512, **kwargs)
        model = T5ForConditionalGeneration.from_pretrained(location, **kwargs)
    else:
        raise ValueError(kind)
    model.to(device).eval()
    return LoadedEncoder(kind, tokenizer, model, device, str(location))
