# Extract Feature

该项目文件夹提供了特征提取方案的代码以及提取方式
以及模型的推荐效果。

如需单一数据的预测展示，请访问本仓库的server展示页面https://vicemusic.github.io/RaDAR-public/web_demo/workflow.html?lang=en

如需直接调用训练好的权重，或根据已有数据重新训练，请您访问仓库https://github.com/ViceMusic/SIF_SGF_Reference

## 资源下载

python环境配置:
```bash
python -m pip install -r extract_demo/requirements.txt
python -B -m extract_demo.test
```

Morgan等分子指纹权重下载
```bash
python -m extract_demo.representations.download_weights
# 或下载后立即运行完整示例
python -B -m extract_demo.test --download
```

下载地址和固定 revision 见 `representations/download_weights.py` 与 `_config.py`。


## 作为模块复用（仓库根目录）：

```python
from extract_demo.representations import morgan
from extract_demo.models import build_lr

features = morgan.extract(["CCO", "c1ccccc1"])
model = build_lr()
```

`test.py` 给出当前仓库中的基础功能的调用演示

| 脚本（representations/） | 输出 |
|---|---|
| `morgan.py` | 24 + 1024 = 1048 维 |
| `avalon.py` | 24 + 512 = 536 维 |
| `molformer.py`、`molt5.py` | 24 + 768 = 792 维 |
| `avalon_molformer.py`、`avalon_molt5.py` | 24 + 512 + 768 = 1304 维 |
| `graph.py` | 36 维节点特征、双向无属性边 |

在已有的Morgan等分子指纹上，在工作流程中向量脚本统一调用 `extract(smiles_list)`来添加固定理化性质。描述符顺序为 QED(8)、理化(11)、Gasteiger(5)，始终放在最前面；组合表示只拼一份描述符，不标准化。

Morgan 使用 radius=2、1024 bits、手性开启；
Avalon 为512 bits。
MolFormer 保留原池化及 L2 归一化；
MolT5 使用 attention-mask 均值池化，不做 L2 归一化。
GIN接口为 `smiles_to_graph_data(smiles)`。

