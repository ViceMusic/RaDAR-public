"""Runnable function examples: python -B test.py [--download] [--device cuda]."""
import argparse
import numpy as np
import torch
from torch_geometric.data import Batch

if __package__:
    from .models import build_lr, build_rf, build_xgb, build_gin
    from .representations import morgan, avalon, molformer, molt5, avalon_molformer, avalon_molt5
    from .representations.graph import smiles_to_graph_data
    from .representations.weights import load_encoder
    from .representations.download_weights import download_weights
else:
    from models import build_lr, build_rf, build_xgb, build_gin
    from representations import morgan, avalon, molformer, molt5, avalon_molformer, avalon_molt5
    from representations.graph import smiles_to_graph_data
    from representations.weights import load_encoder
    from representations.download_weights import download_weights

# Small molecules and illustrative binary labels, solely for testing fit/predict calls.
SMILES = ["CCO", "CCN", "CC(=O)O", "CCC", "c1ccccc1", "Cc1ccccc1", "Oc1ccccc1", "Nc1ccccc1"]
LABELS = np.array([0, 0, 0, 0, 1, 1, 1, 1])
QUERY_SMILES = ["CCCO", "CCc1ccccc1"]

# Project defaults: keep these visible as the initialization example.
# 关于函数使用的超参数配置推荐
LR_PARAMS = dict(max_iter=160, class_weight="balanced", random_state=42)
RF_PARAMS = dict(n_estimators=37, class_weight="balanced", n_jobs=-1, random_state=42)
XGB_PARAMS = dict(max_depth=5, learning_rate=0.1, n_estimators=200,
                  random_state=42, tree_method="hist")
GIN_PARAMS = dict(hidden_dim=128, num_layers=3, dropout=0.5)
GIN_TRAINING = dict(epochs=50, learning_rate=1e-3, weight_decay=1e-4, batch_size=16)


def example_vector_models() -> None:
    """SMILES -> descriptors + Morgan -> fit -> positive-class probability."""
    x = morgan.extract(SMILES)
    x_query = morgan.extract(QUERY_SMILES)
    assert x.shape == (8, 1048)
    for model in [build_lr(**LR_PARAMS), build_rf(**RF_PARAMS), build_xgb(**XGB_PARAMS)]:
        model.fit(x, LABELS)
        probabilities = model.predict_proba(x_query)[:, 1]
        assert probabilities.shape == (2,) and np.isfinite(probabilities).all()
        print(type(model).__name__, probabilities.round(4).tolist())
    x_avalon = avalon.extract(SMILES)
    assert x_avalon.shape == (8, 536)
    np.testing.assert_array_equal(x[:, :24], x_avalon[:, :24])
    print("Morgan / Avalon:", x.shape, x_avalon.shape)


def example_pretrained(device: str = "cpu", download: bool = False) -> None:
    """Load each encoder once; reuse it for individual and concatenated features."""
    for kind, single, combined in [
        ("molformer", molformer, avalon_molformer),
        ("molt5", molt5, avalon_molt5),
    ]:
        if download:
            download_weights(kind)
        encoder = load_encoder(kind, device=device)
        x = single.extract(QUERY_SMILES, encoder=encoder)
        x_combined = combined.extract(QUERY_SMILES, encoder=encoder)
        x_avalon = avalon.extract(QUERY_SMILES)
        assert x.shape == (2, 792) and x_combined.shape == (2, 1304)
        np.testing.assert_array_equal(x_combined[:, :536], x_avalon)
        np.testing.assert_allclose(x_combined[:, 536:], x[:, 24:], atol=1e-6)
        assert np.isfinite(x).all() and np.isfinite(x_combined).all()
        if kind == "molformer":
            np.testing.assert_allclose(np.linalg.norm(x[:, 24:], axis=1), 1, atol=1e-5)
        print(kind, x.shape, "Avalon combination:", x_combined.shape)
        del encoder


def example_gin(device: str = "cpu") -> None:
    """Original graph + GIN + Adam/BCE; one update exercises the training interface."""
    torch.manual_seed(42)  # Set before constructing a fresh model for each run.
    graphs = [smiles_to_graph_data(s) for s in SMILES]
    assert all(g.x.shape[1] == 36 for g in graphs)
    batch = Batch.from_data_list(graphs).to(device)
    model = build_gin(**GIN_PARAMS).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=GIN_TRAINING["learning_rate"],
                                 weight_decay=GIN_TRAINING["weight_decay"])
    model.train()
    logits = model(batch.x, batch.edge_index, batch.batch).view(-1)
    labels = torch.as_tensor(LABELS, dtype=torch.float32, device=device)
    loss = torch.nn.functional.binary_cross_entropy_with_logits(logits, labels)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    model.eval()
    query = Batch.from_data_list([smiles_to_graph_data(s) for s in QUERY_SMILES]).to(device)
    with torch.no_grad():
        probabilities = torch.sigmoid(model(query.x, query.edge_index, query.batch)).view(-1)
    assert probabilities.shape == (2,) and torch.isfinite(probabilities).all()
    print("GIN (one update):", probabilities.cpu().numpy().round(4).tolist())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true", help="Download pinned pretrained files first")
    parser.add_argument("--device", default="cpu", help="cpu or cuda")
    args = parser.parse_args()
    torch.set_num_threads(2)
    example_vector_models()
    example_pretrained(device=args.device, download=args.download)
    example_gin(device=args.device)
    print("All examples passed.")
