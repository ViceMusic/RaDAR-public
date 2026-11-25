"""GIN architecture copied from code/models.py."""
from torch import nn
from torch.nn import functional as F
from torch_geometric.nn import BatchNorm, GINConv, global_add_pool
from ._config import MODEL_CONFIG

GNN_CONFIG = MODEL_CONFIG["gnn"]

class SmileGIN(nn.Module):
    def __init__(
        self,
        in_dim: int,
        hidden_dim: int = GNN_CONFIG["hidden_dim"],
        num_layers: int = GNN_CONFIG["num_layers"],
        dropout: float = GNN_CONFIG["dropout"],
    ):
        super().__init__()
        self.convs = nn.ModuleList()
        self.batch_norms = nn.ModuleList()

        input_dim = in_dim
        for _ in range(num_layers):
            block = nn.Sequential(
                nn.Linear(input_dim, hidden_dim),
                nn.ReLU(),
                nn.Linear(hidden_dim, hidden_dim),
            )
            self.convs.append(GINConv(block))
            self.batch_norms.append(BatchNorm(hidden_dim))
            input_dim = hidden_dim

        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, 1),
        )

    def forward(self, x, edge_index, batch, feat=None):
        for conv, batch_norm in zip(self.convs, self.batch_norms):
            x = conv(x, edge_index)
            x = batch_norm(x)
            x = F.relu(x)

        pooled = global_add_pool(x, batch)
        return self.classifier(pooled)


def build_gin(**overrides) -> SmileGIN:
    params = dict(GNN_CONFIG)
    params.update(overrides)
    return SmileGIN(in_dim=36, **params)
