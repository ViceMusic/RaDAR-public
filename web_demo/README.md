# RaDAR-Bench 静态浏览器 demo

双击项目根目录的 **../index.html** 即可使用。无需 Node.js、Python、HTTP 服务、网络连接或浏览器特殊启动参数。所有推理在浏览器本地进行，不上传 SMILES。

选择 SIF / SGF 和 LR / RF / XGB，输入 SMILES，点击“预测稳定性”。支持载入现有测试样本、结构显示、任务/模型即时切换、预测 JSON 下载。页面下方可展开特征说明并运行 Python/JS 对照测试。

## 模型

本 demo 的六个模型单独训练，不替换论文实验。使用 `Experiments/Exp1-MainTable/Datas/seed_888` 对应训练数据：SIF 397 条，SGF 307 条。测试集未用于拟合。标签由项目 `map_minutes` 映射后按 SIF ≥270、SGF ≥250 分钟定义；模型预测概率 ≥0.5 判为正类。

- LR：原配置，lbfgs，C=1，max_iter=160，balanced，random_state=42。两次训练均产生收敛警告，详见 metadata.json。
- RF：37 棵树，balanced，random_state=42；单线程导出。
- XGB：max_depth=5，learning_rate=0.1，200 棵树，hist，random_state=42；单线程导出。
- 所有模型输入均为 float32 的 **24 维描述符 + 1024 位 Morgan**，无标准化。
- `models/weights.json` 为可移植模型参数；`weights.js` 内容相同，仅增加全局变量包装，避免 file:// 下 fetch 本地 JSON 的限制。
- LR 保存 coef/intercept，计算 sigmoid(wᵀx+b)。RF 保存节点、阈值及叶子正类概率，取37棵树的均值。XGB保存节点及带学习率的叶子权重，对浮点32 margin 累加后计算 sigmoid；分裂阈值也恢复为 float32。
- `models/metadata.json` 保存数据文件哈希、完整参数、Python依赖版本、测试指标和训练警告。

## 特征一致性

Python RDKit 为 **2025.09.3**；本地固定的官方 RDKit.js npm 包为 **2025.3.4-1.0.0**，运行内核 **2025.03.4**。两个版本的对应关系通过实际分子测试验证，不以版本号替代一致性检查。

Morgan：radius=2、1024 bits、useChirality=true；保持默认键类型和原子不变量，不使用 feature Morgan。

24 维描述符顺序与 `code/descriptors.py` 完全对应：

| 索引（零起始） | 描述符 |
|---|---|
| 0–7 | QED.properties 的 MW、ALOGP、HBA、HBD、PSA、ROTB、AROM、ALERTS |
| 8–18 | MolWt、MolLogP、CalcNumHBA、CalcNumHBD、TPSA、NumRotatableBonds、NumRings、FractionCSP3、HeavyAtomCount、mol.GetNumAtoms、rings/(rotatable+1) |
| 19–23 | Gasteiger 电荷 mean、max、min、总体 std、sum |

RDKit.js MinimalLib 不直接提供整套 QED/Gasteiger 接口，`chemistry.js` 做了以下补充：

- 用官方 QED SMARTS计算受体及结构警报；芳环计数遵循删除对应脂肪环原子后的环数，而非直接替换成 NumAromaticRings。
- 使用实际 C++ Crippen 参数表逐原子匹配并展开氢，避免旧 `Crippen.txt` 中部分 SMARTS 与实际实现不同。
- 从固定 RDKit pickle v16 读取原子的杂化、氢数、形式电荷及键的共轭标记，移植原 Gasteiger 12轮迭代；统计按 NumPy float32 的累加/方差顺序处理。
- MinimalLib 的描述符 JSON 会截断到5位小数：质量与logP采用原子计算，FractionCSP3直接计算比例，TPSA恢复到原子贡献的0.01刻度，再转float32。防止小误差改变树的分支。
- 不以0补齐缺失接口；非法 SMILES、通配原子、无法支持的分子会显示错误。超过2000个显式原子的输入被限制，以免阻塞浏览器。部分不支持的查询或特殊注释结构会拒绝处理。

## 已完成的验证

Chrome 直接打开 file:// 进行测试，不启动网页服务器。

- 484 个现有不同 SMILES，另加15个手性、带电、同位素、盐、芳环和映射原子样例，共499个分子。
- 499 × 1024 位 Morgan 指纹：**完全一致**。
- 499 × 24 维 float32 描述符：**完全一致**。
- 499 × 2任务 × 3模型 = **2994 次类别判断全部一致**。
- LR 最大概率差约 1.00×10⁻¹⁴；RF 约 1.11×10⁻¹⁶；XGB 约 1.06×10⁻⁷（float32 sigmoid/累加数值精度）。验证阈值为1e-6。
- 报告：`tests/parity_report.json`；Python参考特征及预测：`tests/fixtures.js`；页面交互检查：`tests/ui_validation.json`。
- `tests/parity.html` 可直接双击运行完整对照；主页面“运行 Python / JS 对照”按钮也可运行。

这些检查验证导出与前端计算的一致性；模型对新分子的科学泛化性能不由导出一致性证明。模型分数也不是实测稳定时间。

## 本地文件

- `../index.html`：外置预测入口；`styles.css` / `app.js`：页面样式与交互。
- `chemistry.js` / `chemistry-data.js`：一致的特征计算与官方参数。
- `inference.js`：三类模型的纯JS推理。
- `models/`：模型JSON、直接加载的JS包装和配置。
- `vendor/`：固定版本RDKit.js及base64包装WASM；不使用CDN。
- `tests/`：对照数据、报告与浏览器截图；普通预测不加载完整测试样本。

## 第三方来源与许可

RDKit.js来自官方 npm `@rdkit/rdkit@2025.3.4-1.0.0`，保留 `vendor/LICENSE`。移植的RDKit算法按BSD-3-Clause保留版权与 `vendor/RDKIT-LICENSE.txt`。

- https://github.com/rdkit/rdkit-js
- https://github.com/rdkit/rdkit/blob/Release_2025_03_4/Code/MinimalLib/minilib.cpp
- https://github.com/rdkit/rdkit/blob/Release_2025_03_4/Code/GraphMol/PartialCharges/GasteigerCharges.cpp
- https://github.com/rdkit/rdkit/blob/Release_2025_03_4/Code/GraphMol/Descriptors/Crippen.cpp
- https://github.com/rdkit/rdkit/blob/Release_2025_03_4/Code/GraphMol/MolPickler.cpp

WASM以JS内嵌字节载入，使 file:// 直接打开不受WASM文件fetch限制。JSON模型通过本地普通script加载，无模块服务器依赖。


## 数据集探索页面

双击 `dataset.html`，或通过顶部“数据集探索”进入第二页；“分子预测”返回原推理页。两页均支持直接以 file:// 打开，无需启动服务，所有资源均为本地 HTML/CSS/JS。

- 按 SIF / SGF → 专利来源 → 分子顺序筛选，也可直接点击散点。
- 颜色对应来源，选中记录显示同色半透明光晕；重叠点可重复点击切换。
- 右侧动画面板展示 RDKit 分子结构、两个任务的稳定性记录、来源、SMILES；左上按钮最小化，浮动按钮恢复。
- 2D 拖动平移；3D 拖动旋转、Shift 拖动平移；滚轮缩放。“XY 俯视”恢复沿 Z 轴观看，“↺”重置。
- 侧栏区分原始分钟数和星号／等级映射值，保留原始标记；缺失值显示“未提供”。
- 顶部访问和下载入口均指向 https://huggingface.co/datasets/Vicemusic5/RaDAR-Bench 。页面包含完整数据集说明及联系人信息。

### 数据与坐标

`datasets(splited)` 的四个 CSV 原样保留。整理结果为 `data/radar-bench.json`，含 513 条记录、402 条 SGF 成员记录、原始稳定性字段、映射分钟数、来源、原文件行号与训练/测试归属、Morgan 激活位及三维坐标。浏览序号依次取 SIF_train 和 SIF_test 文件行顺序，保留重复记录；SGF 按四字段及重复次数匹配。`data/radar-bench.js` 为同一 JSON 的全局变量包装，供 file:// 页面加载。

使用 Python RDKit 2025.09.3 预计算 Morgan（radius=2，1024 bits，手性开启），不附加理化描述符。使用 umap-learn 0.5.9.post2 对全部 513 条记录一次拟合三维 UMAP：Jaccard 距离、n_neighbors=15、min_dist=0.12、random_state=42、n_jobs=1、spectral 初始化。参数、依赖版本和输入文件 SHA-256 保存在 `data/preparation.json`。

浏览器加载固定坐标，通过 Canvas 正交相机实现旋转。二维严格取这套三维坐标的 XY 投影；切换任务、来源和选中分子均不重新拟合、不抖动点坐标。UMAP 离线预计算，打开网页无需运行 Python 或下载算法依赖。

### 页面验证

实际 Chrome 以 file:// 打开验证：全部 513 条记录的浏览器 Morgan 指纹与 JSON 完全相同；513 个点在二维与三维 XY 俯视之间的屏幕坐标差为 0。已检查 SIF/SGF 及各来源数量、下拉与画布点选、分子结构绘制、侧栏最小化/恢复、页面导航、移动端无横向溢出。无外部网络请求或 JavaScript 异常。

报告：`tests/explorer_validation.json`；界面截图：`tests/explorer-desktop.png`、`tests/explorer-3d.png`、`tests/explorer-mobile.png`、`tests/explorer-mobile-space.png`。JSON 原始字段与四个 CSV 逐行核对一致，原 CSV 哈希未变。

## RaDAR协议、来源与团队

顶部导航现在包含四个静态页面：`../index.html`（分子预测）、`dataset.html`（数据集探索）、`workflow.html`（RaDAR协议）、`about.html`（来源与团队）。数据集名称和完整介绍均位于可视化之前。

`workflow.html` 严格依据 `paper/main.tex` 的 Ranking-aware Evaluation Protocol 部分，展示协议输入、域内验证与跨来源诊断、排序感知的适应评价、独立评价与结果解释。`about.html` 为五个来源提供 Coming soon 占位，并按 Tiange、Wenjia He、Suyu Dong 的页面展示顺序呈现作者；联系方式为 tian@lmd.ist.hokudai.ac.jp。数据保密说明对应论文的外部 Dataset-X。

作者卡片水印使用大学官网提供的原始文件，资源已保存至 `assets/`，无需联网加载：

- 北海道大学：[University Symbol](https://www.global.hokudai.ac.jp/about/university-symbol/)，文件 `assets/hokkaido-symbol.png`。
- KAUST：[官方网站](https://www.kaust.edu.sa/en)，文件 `assets/kaust-logo.svg`。
- 具体下载地址保存在 `assets/sources.json`。

四页浏览器检查结果保存为 `tests/routes_validation.json`。

RaDAR 协议页开头说明其定位为研究工作流的系统整理，并补充论文中的数据清洗流程。四页 header 使用相同品牌、固定导航网格和双入口（数据集下载、联系团队）；保留滚动条空间，避免不同页面长度造成水平偏移。浏览器报告同时记录桌面与手机下各导航元素的实际坐标。

## 中／英／日语言切换

四页 header 的“联系团队”右侧提供中文、English、日本語选择器。页面沿用相同的结构、卡片和可视化布局，只替换界面文字，包括导航、正文、无障碍标签、预测状态、错误提示和分子详情。切换语言不会重置预测输入、结果、选中分子或相机视角。

`i18n-data.js` 保存现有文本的英文、日文译文；`i18n.js` 处理可逆文本替换、动态文字及语言偏好。中文模式恢复原始文案。SMILES、专利编号、测量原始值、模型参数与数据文件保持原样。语言偏好保存到本地存储，并通过站内链接的 `lang=zh/en/ja` 参数跨页传递，支持 file://，无需联网或启动服务。

验证结果见 `tests/i18n_validation.json`：四页三语的桌面／手机布局、导航位置、预测状态保留、动态提示翻译、分子选择和视角保留、跨页与刷新语言保留。


## 外置入口与资源边界

预测入口已移至项目根目录 `index.html`，`web_demo/index.html` 已删除。其余三个页面和全部样式、脚本、模型、数据、校徽及测试资源仍保留在 `web_demo/`。站内导航与语言参数保留相对目录；动态对照样本从 `app.js` 所在目录解析加载。除外置入口自身外，demo 的本地资源仅来自 `web_demo/`，不依赖项目根目录的其他文件或其他项目文件夹。
