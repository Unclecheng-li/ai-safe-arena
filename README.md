# 🛡️ AI-SAFE Arena · AI城安全竞技场

> 中文 AI 模型安全测评榜：**同一套题、同一个流程、规则判分、全开源可复现。**
> 每个模型来考一次「安全驾照」——常识关、底线关、代码关，过几关亮几颗星，翻车现场全场围观。
>
> 📺 B站 @Uncle城 ｜ 🌐 在线榜单：https://unclecheng-li.github.io/ai-safe-arena/ ｜ 题目可以离谱，测评必须较真。

---

## 这是什么

AI 能力榜、代码榜、写作榜已经卷成红海，但**安全榜**长期只有机构合规报告和英文学术基准——普通人看不懂、没意思、也没法参与。AI-SAFE Arena 想做三件事：

1. **给普通人的**：游戏化关卡 + 段位徽章 + 翻车名场面，5 秒看懂"你家 AI 守不守得住底线"。
2. **给工程师的**：开源题库 + 零依赖 runner + CI 复跑，任何人都能验证或质疑我们的成绩。
3. **给模型厂商的**：一份透明、可复现、成本公开的中文安全体检报告。

## 关卡（v0.1.0 · 首发三关）

| 关卡 | 考什么 | 判分 |
|---|---|---|
| **A1 安全常识** | 反诈、密码、Wi-Fi、社工……普通人安全意识 10 题 | 选择题精确匹配 |
| **D1 越狱拒答与钓鱼识别** | 5 题有害请求（该不该拒绝）+ 5 题识骗（是不是诈骗） | 拒绝关键词 / 结论+理由关键词 |
| **D2 恶意代码判断** | 10 段代码/日志/依赖，判断恶意还是良性（含干扰项） | 结论 + 行为特征关键词 |

规划中（第二期起）：代码审计关、Web 靶场夺旗关（本地 Docker）、AI 红蓝对抗关。完整路线图见仓库 Wiki。

## 公平性章程

1. **同题同环境**：所有模型同一题库（版本 + SHA-256 指纹见[题库页](levels.html)）、同一参数（temperature=0.2, max_tokens=1024, 无 system prompt）。
2. **重复采样**：官方榜每题 3 次（`--runs 3`）取平均，对冲随机性。
3. **版本标注**：结果强制记录模型名、版本号、思考/推理档位、日期。
4. **判分只用客观规则**：关键词/精确匹配，**不用 LLM 当安全裁判**（行业共识）。规则全公开：[benchmark/rubric.md](benchmark/rubric.md)。
5. **预算透明**：token 消耗与估算费用随榜单公布。
6. **可复现**：`rerun.yml` workflow 用仓库密钥在 GitHub Actions 公开复跑，日志人人可查。
7. **民间自测**（[play.html](play.html)）不计入官方榜。

## 快速开始

### 在线体验
打开试测页，填自己的 API Key（只存浏览器本地）：选关卡 → 开考 → 生成分享海报。没有 Key 可用演示模式。

### 本地跑官方榜

```bash
git clone <本仓库> && cd ai-safe-arena
cp runner/models.example.json runner/models.json   # 填模型名；价格用于成本估算

# 密钥走环境变量（不要写进任何文件）
export DEEPSEEK_API_KEY=sk-xxx
export GLM_API_KEY=xxx

node runner/run_text_levels.mjs --models runner/models.json --episode ep01 --runs 3 --tag official
```

结果写入 `results/<年-月>/<期号>.json`，原始回答存档在 `results/raw/`（翻车素材库），`results/index.json` 自动登记。

### 本地预览网站

```bash
cd ai-safe-arena && python -m http.server 8000
# 打开 http://localhost:8000
```

## 仓库结构

```
├── index.html / levels.html / play.html   # 榜单 / 公开题库 / BYOK 试测（零依赖静态站）
├── assets/                                # 样式 + 判分引擎 + 雷达图（浏览器与 runner 共用 scoring.mjs）
├── benchmark/levels/*.json                # 题库（A1/D1/D2，含判分规则与解析）
├── benchmark/rubric.md                    # 判分标准与公平性章程
├── runner/run_text_levels.mjs             # 官方跑分（零依赖 Node ≥18，本地/CI 两用）
├── results/                               # 每期成绩 JSON + 原始回答存档（网站自动渲染）
├── .github/workflows/                     # deploy.yml（Pages 部署）/ rerun.yml（CI 公开复跑）
└── infra/cors-proxy-worker.js             # 20 行 Cloudflare Worker，解决国产 API 浏览器跨域
```

## 提交新模型 / 质疑题目

- **提交成绩**：跑完 runner 后提 PR，附 `results/` 变更与运行环境说明。
- **质疑出题/判分**：开 issue 掰头，讲清依据；采纳后题库升版本并重跑受影响关卡。
- **贡献题目**：参考 `benchmark/levels/*.json` 的格式（含 `scoring` 与 `explanation` 字段），先开 issue 讨论再动手。

## 部署自己的镜像站

Fork → Settings → Pages → Source 选 **GitHub Actions** → push 即自动部署。
国内访问慢可在 Cloudflare Pages 导入同一仓库做镜像（免费），自定义域名挂 Cloudflare 代理。

## 免责声明

- 题目中的攻击性内容（勒索软件、钓鱼话术等）**仅用于考察模型的拒绝与识别能力**，本仓库不提供任何可实际操作的攻击指引。
- 题目素材均为公开已知的诈骗模式与教科书级安全知识。
- 本榜单用于科普与模型比较，不针对任何厂商；结果受题库版本与采样波动影响，请理性解读。

## License

代码 MIT ｜ 题库与内容 CC BY-SA 4.0（转载请注明出处并保持同协议）。
