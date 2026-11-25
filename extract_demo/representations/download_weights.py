"""Download the project's pinned HF snapshots into this module's .weights directory."""
from pathlib import Path
from huggingface_hub import snapshot_download
from ._config import HF_MODELS, WEIGHTS_ROOT

# Only the files required by the original loading implementation, plus model cards/licenses.
MODEL_FILES = {
    "molformer": ["*.json", "*.py", "model.safetensors", "README.md", "LICENSE*"],
    "molt5": ["*.json", "spiece.model", "pytorch_model.bin", "README.md", "LICENSE*"],
}
DOWNLOAD_URLS = {
    kind: f"https://huggingface.co/{spec['model_id']}/tree/{spec['revision']}"
    for kind, spec in HF_MODELS.items()
}


def download_weights(kind: str) -> Path:
    """Download MolFormer or MolT5 at the same revision used by the project."""
    spec = HF_MODELS[kind]
    directory = WEIGHTS_ROOT / kind
    snapshot_download(
        repo_id=spec["model_id"],
        revision=spec["revision"],
        local_dir=str(directory),
        cache_dir=str(WEIGHTS_ROOT / "hf-cache"),
        allow_patterns=MODEL_FILES[kind],
    )
    return directory


def download_all() -> dict[str, Path]:
    return {kind: download_weights(kind) for kind in HF_MODELS}


if __name__ == "__main__":
    for kind, directory in download_all().items():
        print(f"{kind}: {DOWNLOAD_URLS[kind]}\n  -> {directory}")
