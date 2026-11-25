"""RandomForestClassifier: the corresponding branch of code/models.py::build_model."""
from sklearn.ensemble import RandomForestClassifier
from ._config import MODEL_CONFIG


def build_rf(**overrides) -> RandomForestClassifier:
    """Construct the project model; override parameters explicitly when needed."""
    params = dict(MODEL_CONFIG["rf"])
    params.update(overrides)
    return RandomForestClassifier(**params)
