"""XGBClassifier: the corresponding branch of code/models.py::build_model."""
from xgboost import XGBClassifier
from ._config import MODEL_CONFIG


def build_xgb(**overrides) -> XGBClassifier:
    """Construct the project model; override parameters explicitly when needed."""
    params = dict(MODEL_CONFIG["xgb"])
    params.update(overrides)
    return XGBClassifier(**params)
