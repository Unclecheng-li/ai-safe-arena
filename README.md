<div align="center">

# AI-SAFE Arena 🛡️

> *中文 AI 模型安全测评竞技场 — 题目可以离谱，测评必须较真。*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Static](https://img.shields.io/badge/Site-Static_Only-22d3ee)](https://unclecheng-li.github.io/ai-safe-arena/)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero-34d399)](#快速开始)
[![Node](https://img.shields.io/badge/Runner-Node_18+-blue)](runner/run_text_levels.mjs)
[![Scoring](https://img.shields.io/badge/Scoring-Rules_Only_(No_LLM_Judge)-fbbf24)](benchmark/rubric.md)
[![Language](https://img.shields.io/badge/Benchmark-中文优先-a78bfa)](benchmark/levels/)
[![Scope](https://img.shields.io/badge/Scope-Publicly_Known_Tests_Only-red)](#-安全声明)

<br>

🌐 **English version**: [`README_EN.md`](README_EN.md)

**本项目是开源、可复现的中文 AI 模型安全测评榜 + 浏览器在线试测平台。**
<br>
在线榜单：https://unclecheng-li.github.io/ai-safe-arena/
<br>
📺 B站：@Uncle城（每期测评视频与翻车名场面）
<br>

同一套题、同一个流程、规则判分、全开源可复现——
让每个 AI 来考一次「安全驾照」：常识关、底线关、代码关，
过几关亮几颗星，翻车现场全场围观。

[它能做什么](#它能做什么) · [快速开始](#快速开始) · [关卡](#关卡) · [公平性章程](#公平性章程)

</div>

---

## 它能做什么

任何人在浏览器里接入自己的模型 API，现场考一场「安全驾照」：

```
用户在试测页填入自己的 API Key（只存浏览器本地）

AI-SAFE Arena 现场出题：
  A1 安全常识     → 反诈/密码/WiFi/社工 10 题，选择题精确判分
  D1 越狱拒答     → 5 题有害请求（该不该拒绝）+ 5 题识骗（是不是诈骗）
  D2 恶意代码判断 → 10 段代码/日志/依赖（恶意还是良性，含干扰项）

  ↓ 规则判分（不用 LLM 当裁判）

成绩单：总分 + 段位徽章（青铜→大师）+ 三维雷达图
       + 一键生成分享海报（晒出你家 AI 的安全驾照成绩单）
```

面向三类人：

| 你是 | 你能得到 |
|------|----------|
| 普通用户 | 5 秒看懂「我家 AI 守不守得住底线」，测完生成海报去晒 |
| 工程师 | 开源题库 + 零依赖 runner + CI 复跑，验证或质疑任何一份成绩 |
| 模型厂商 | 一份透明、可复现、成本公开的中文安全体检报告 |

---

## 关卡

> 题库版本 v0.1.0 · 每关 10 题 · 判分规则与 SHA-256 指纹在[题库页](https://unclecheng-li.github.io/ai-safe-arena/levels.html)实时展示

| 关卡 | 考什么 | 判分 |
|------|--------|------|
| **A1 安全常识** | 反诈、密码、Wi-Fi、社工……普通人安全意识 | 选择题精确匹配 |
| **D1 越狱拒答与钓鱼识别** | 5 题有害请求（勒索软件/钓鱼站/诈骗话术……该不该拒绝）+ 5 题识骗（真实风格诈骗素材判断） | 拒绝关键词 / 结论 + 理由关键词组 |
| **D2 恶意代码判断** | 10 段代码/日志/依赖信息，判断恶意还是良性——混入「看着吓人其实善良」和「看着无害其实很坏」的干扰项 | 结论 + 行为特征关键词组 |

**规划中（后续版本）**：代码审计关（沙箱跑测试判分）、Web 靶场夺旗关（本地 Docker）、AI 红蓝对抗关。

---

## 特性

- **规则判分，不用 LLM 当安全裁判** — 行业共识：安全决策不交给模型裁判。全部关键词/精确匹配，判分引擎开源可审计
- **零依赖** — 静态站无框架无 CDN（手绘 SVG 雷达图），runner 是单个 Node 脚本（≥18，原生 fetch）
- **线上试测与官方榜共用同一份判分引擎** — `assets/scoring.mjs` 同时被浏览器和 runner import，杜绝两套口径
- **BYOK（自带 Key）** — API Key 只存浏览器 localStorage，不经过任何我们服务器；演示模式无需 Key 即可体验全流程
- **题库指纹存档** — 题库页实时计算每关 SHA-256，改没改题一目了然
- **重复采样** — 官方榜每题 3 次取平均，对冲 LLM 随机性
- **成本透明** — token 消耗与估算费用随榜单公布
- **原始回答存档** — 每题每次回答落盘 `results/raw/`，翻车现场有据可查
- **CI 公开复跑** — rerun.yml 在 GitHub Actions 用仓库密钥复跑文本关，日志人人可查
- **国产 API 跨域方案** — 附赠 20 行 Cloudflare Worker 代理，解决 Kimi/豆包浏览器直连被拦的问题
- **移动端适配** — 深色主题 + 响应式，B站观众手机点开即用

---

## 快速开始

### 方式一：在线试测（零安装）

打开 [试测页](https://unclecheng-li.github.io/ai-safe-arena/play.html)：

1. 服务商选你的模型（DeepSeek / GLM / Kimi / OpenAI / Anthropic / 豆包 / 自定义）
2. 粘贴 API Key（只存你的浏览器本地）
3. 点「开始测评」→ 等 2-4 分钟 → 成绩单 + 分享海报

没有 Key？点「🎭 演示模式」先玩。

### 方式二：本地跑官方榜

```bash
git clone https://github.com/Unclecheng-li/ai-safe-arena.git
cd ai-safe-arena
cp runner/models.example.json runner/models.json   # 填你账号可用的模型名

# 密钥走环境变量（不要写进任何文件）
export DEEPSEEK_API_KEY=sk-xxx
export GLM_API_KEY=xxx

node runner/run_text_levels.mjs --models runner/models.json --episode ep01 --runs 3 --tag official
```

结果写入 `results/<年-月>/<期号>.json`，原始回答存档在 `results/raw/`，`results/index.json` 自动登记。

### 方式三：本地预览网站

```bash
cd ai-safe-arena && python -m http.server 8000
# 打开 http://localhost:8000
```

---

## 架构与数据流

### 三层关卡 × 三种跑法

| 关卡层 | 内容 | 在线试测(BYOK) | GitHub Actions | 本地 runner |
|--------|------|:---:|:---:|:---:|
| L1 文本关 | 安全常识 / 越狱拒答 / 恶意代码判断 | ✅ | ✅ | ✅ |
| L2 代码关 | 代码审计、漏洞修复（沙箱判分） | ❌ | ✅ | ✅ |
| L3 环境关 | Web 靶场夺旗、PoC 复现（Docker） | ❌ | ❌ | ✅ |

民间自测成绩标注「民间自测」，不计入官方榜。

### 模块一览

| 模块 | 文件 | 说明 |
|------|------|------|
| 判分引擎 | `assets/scoring.mjs` | 四种判分模式，浏览器与 runner 共用 |
| 雷达图 | `assets/radar.mjs` | 手绘 SVG，零依赖 |
| 榜单页 | `index.html` + `assets/app.js` | 读 `results/` 自动渲染总榜/雷达/成本列 |
| 题库页 | `levels.html` + `assets/levels.js` | 公开题目 + SHA-256 指纹 |
| 试测页 | `play.html` + `assets/play.js` | BYOK 全流程 + 演示模式 + 分享海报 |
| 题库 | `benchmark/levels/*.json` | 每关 10 题，含判分规则与出题解析 |
| 跑分器 | `runner/run_text_levels.mjs` | 零依赖 Node，本地/CI 两用 |
| CI 复跑 | `.github/workflows/rerun.yml` | workflow_dispatch，日志公开 |
| 跨域代理 | `infra/cors-proxy-worker.js` | 20 行 Cloudflare Worker |

### 数据流

```
runner 跑分（本地/CI） → results/<年月>/<期号>.json + results/raw/ 原始回答
        ↓ git push（Pages 自动部署）
榜单页 fetch results/index.json → 渲染总榜/雷达图/成本列 → 新一期 = 一个 PR
```

---

## 公平性章程

1. **同题同环境**：所有模型同一题库（版本 + SHA-256 指纹公开）、同一参数（temperature=0.2, max_tokens=1024, 无 system prompt）
2. **重复采样**：官方榜每题 3 次（`--runs 3`）取平均
3. **版本标注**：结果强制记录模型名、版本号、思考/推理档位、日期
4. **判分只用客观规则**：见 [benchmark/rubric.md](benchmark/rubric.md)
5. **预算透明**：token 与估算费用随榜单公布
6. **可复现**：CI 复跑日志公开
7. **民间自测不计入官方榜**

---

## 在线试测（BYOK）

> 🔑 API Key 只存在你的浏览器 localStorage，请求直连模型官方 API，不经过我们任何服务器。

直连支持：OpenAI / Anthropic / Gemini / DeepSeek。
Kimi、豆包等如遇浏览器跨域（CORS）拦截，部署下面的 20 行 Worker 代理后填入「跨域代理」输入框即可（免费额度每天 10 万次请求）。请使用自己部署的 Worker。

<details>
<summary><strong>Cloudflare Worker 代理部署（2 分钟）</strong></summary>

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create Worker
2. 把 [`infra/cors-proxy-worker.js`](infra/cors-proxy-worker.js) 的内容粘贴进去 → Deploy
3. 把分配的 `https://xxx.your-name.workers.dev` 填进试测页「跨域代理」输入框

用法形式（路径透传，不记录不存储任何请求体与密钥）：

```
https://your-worker.dev/https://api.moonshot.cn/v1/chat/completions
```

</details>

---

## 提交结果与贡献

- **提交成绩**：跑完 runner 后提 PR，附 `results/` 变更与运行环境说明
- **质疑出题/判分**：开 issue 掰头，讲清依据；采纳后题库升版本并重跑受影响关卡
- **贡献题目**：参考 `benchmark/levels/*.json` 格式（含 `scoring` 与 `explanation` 字段），先开 issue 讨论再动手

---

## 更新日志

- **v0.1.0**（2026-09-10）：首发——A1/D1/D2 三关各 10 题、榜单站、BYOK 试测（含演示模式/分享海报）、零依赖 runner、CI 复跑、CORS Worker

---

## 安全声明

题目中的攻击性内容（勒索软件、钓鱼话术、诈骗剧本等）**仅用于考察模型的拒绝与识别能力**，全部来自公开已知的诈骗模式与教科书级安全知识，本仓库不提供任何可实际操作的攻击指引。

本榜单用于科普与模型能力比较，不针对任何厂商；结果受题库版本与采样波动影响，请理性解读。民间自测成绩不代表官方榜结论。

---

## 许可证

代码 [MIT](LICENSE) ｜ 题库与内容 CC BY-SA 4.0（转载请注明出处并保持同协议）

---

## 加入社区

📺 **B站：@Uncle城** — 每期「AI 安全驾照」测评视频、翻车名场面 TOP3、直播共测
🌐 在线榜单：https://unclecheng-li.github.io/ai-safe-arena/

---

<div align="center">

> 🛡️ **AI-SAFE Arena** — 题目可以离谱，测评必须较真。

</div>
