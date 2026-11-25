"""Defaults reused from code/config.py."""
MODEL_CONFIG = {
    "lr": dict(max_iter=160, class_weight="balanced", random_state=42),
    "rf": dict(n_estimators=37, class_weight="balanced", n_jobs=-1, random_state=42),
    "xgb": dict(max_depth=5, learning_rate=0.1, n_estimators=200,
                random_state=42, tree_method="hist"),
    "gnn": dict(hidden_dim=128, num_layers=3, dropout=0.5),
}
GIN_TRAINING = dict(epochs=50, learning_rate=1e-3, weight_decay=1e-4, batch_size=16)
