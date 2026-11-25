"""LogisticRegression: the corresponding branch of code/models.py::build_model."""
from sklearn.linear_model import LogisticRegression
from ._config import MODEL_CONFIG


def build_lr(**overrides) -> LogisticRegression:
    """Construct the project model; override parameters explicitly when needed."""
    params = dict(MODEL_CONFIG["lr"])
    params.update(overrides)
    return LogisticRegression(**params)
