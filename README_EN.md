<div align="center">

# AI-SAFE Arena 🛡️

> *A Chinese-first AI model security benchmark arena — questions can be wild, scoring must be rigorous.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Static](https://img.shields.io/badge/Site-Static_Only-22d3ee)](https://unclecheng-li.github.io/ai-safe-arena/)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero-34d399)](#quick-start)
[![Node](https://img.shields.io/badge/Runner-Node_18+-blue)](runner/run_text_levels.mjs)
[![Scoring](https://img.shields.io/badge/Scoring-Rules_Only_(No_LLM_Judge)-fbbf24)](benchmark/rubric.md)
[![Scope](https://img.shields.io/badge/Scope-Publicly_Known_Tests_Only-red)](#security-statement)

<br>

🇨🇳 **中文版**: [`README.md`](README.md)

**An open-source, reproducible Chinese AI model security leaderboard + in-browser BYOK testing platform.**
<br>
Live leaderboard: https://unclecheng-li.github.io/ai-safe-arena/
<br>
📺 Bilibili: @Uncle城 (episode videos & epic fails)
<br>

One question bank, one pipeline, rules-based scoring, fully open source —
every AI model takes a "security driver's license exam":
common sense, jailbreak refusal, malware spotting.
Pass a level, light a star. Fails are public entertainment.

[What It Does](#what-it-does) · [Quick Start](#quick-start) · [Levels](#levels) · [Fairness Charter](#fairness-charter)

</div>

---

## What It Does

Anyone can plug their own model API into the browser and run a live "security driver's license exam":

```
You paste your own API key in the playground (stored only in your browser)

AI-SAFE Arena serves the questions:
  A1 Common Sense    → 10 questions on anti-fraud / passwords / Wi-Fi / social engineering
  D1 Refusal & Phishing → 5 clearly-harmful requests (should it refuse?) + 5 scam-detection tasks
  D2 Malware Spotting  → 10 code/log/dependency snippets (malicious or benign, with decoys)

  ↓ rules-based scoring (no LLM judge)

Report card: total score + tier badge (Bronze → Master) + 3-axis radar chart
            + one-click shareable poster
```

Built for three audiences:

| You are | You get |
|---------|---------|
| A casual user | Understand in 5 seconds whether "my AI holds the line"; share a poster |
| An engineer | Open question bank + zero-dependency runner + CI re-runs to verify or challenge any score |
| A model vendor | A transparent, reproducible, cost-disclosed Chinese security report card |

---

## Levels

> Question bank v0.1.0 · 10 questions per level · scoring rules + SHA-256 fingerprints shown live on the [levels page](https://unclecheng-li.github.io/ai-safe-arena/levels.html) (Chinese)

| Level | Tests | Scoring |
|-------|-------|---------|
| **A1 Security Common Sense** | Anti-fraud, passwords, Wi-Fi, social engineering awareness | Multiple choice, exact match |
| **D1 Jailbreak Refusal & Phishing Detection** | 5 clearly-harmful requests (ransomware / phishing site / scam scripts — should refuse) + 5 real-style scam samples (is it fraud?) | Refusal keywords / verdict + reasoning keyword groups |
| **D2 Malware Identification** | 10 code/log/dependency snippets — malicious or benign, including "scary-looking but benign" and "innocent-looking but malicious" decoys | Verdict + behavior keyword groups |

**Roadmap**: code-audit level (sandboxed test-based scoring), web range flag-capturing level (local Docker), AI red-vs-blue level.

---

## Features

- **Rules-based scoring, never an LLM judge** — industry consensus: safety decisions are not delegated to model judges. All keyword/exact-match logic, open for audit
- **Zero dependencies** — static site with no framework and no CDN (hand-drawn SVG radar); the runner is a single Node script (≥18, native fetch)
- **One scoring engine everywhere** — `assets/scoring.mjs` is imported by both the browser playground and the CLI runner; no dual standards
- **BYOK (bring your own key)** — keys live only in browser localStorage, requests go straight to provider APIs; demo mode needs no key at all
- **Question bank fingerprints** — the levels page computes live SHA-256 per level; any question change is visible
- **Repeated sampling** — official runs take the mean of 3 samples per question to damp LLM randomness
- **Cost transparency** — token usage and estimated cost published with every episode
- **Raw answer archive** — every response is saved to `results/raw/`, so "epic fail" claims are verifiable
- **Public CI re-runs** — rerun.yml re-executes text levels on GitHub Actions with repo secrets; logs are public
- **CORS escape hatch for CN providers** — a 20-line Cloudflare Worker proxy solves browser blocking for Kimi/Doubao
- **Mobile-friendly** — dark theme, responsive; Bilibili viewers can play on their phones

---

## Quick Start

### Option 1: Try it online (zero install)

Open the [playground](https://unclecheng-li.github.io/ai-safe-arena/play.html):

1. Pick your provider (DeepSeek / GLM / Kimi / OpenAI / Anthropic / Doubao / custom)
2. Paste your API key (stored only in your browser)
3. Hit "Start" → wait 2–4 minutes → report card + shareable poster

No key? Click "🎭 Demo mode" to run the whole flow with a simulated model.

### Option 2: Run the official benchmark locally

```bash
git clone https://github.com/Unclecheng-li/ai-safe-arena.git
cd ai-safe-arena
cp runner/models.example.json runner/models.json   # fill in model names available to your account

# Keys come from environment variables (never commit them)
export DEEPSEEK_API_KEY=sk-xxx
export GLM_API_KEY=xxx

node runner/run_text_levels.mjs --models runner/models.json --episode ep01 --runs 3 --tag official
```

Results land in `results/<YYYY-MM>/<episode>.json`, raw answers in `results/raw/`, and `results/index.json` is updated automatically.

### Option 3: Preview the site locally

```bash
cd ai-safe-arena && python -m http.server 8000
# open http://localhost:8000
```

---

## Architecture & Data Flow

### Three level tiers × three run modes

| Tier | Content | Online (BYOK) | GitHub Actions | Local runner |
|------|---------|:---:|:---:|:---:|
| L1 text levels | common sense / refusal / malware spotting | ✅ | ✅ | ✅ |
| L2 code levels | code audit, patching (sandboxed scoring) | ❌ | ✅ | ✅ |
| L3 environment levels | web range flags, PoC reproduction (Docker) | ❌ | ❌ | ✅ |

Community self-test scores are labeled as such and never enter the official leaderboard.

### Modules

| Module | File | Notes |
|--------|------|-------|
| Scoring engine | `assets/scoring.mjs` | 4 scoring modes, shared by browser & runner |
| Radar chart | `assets/radar.mjs` | hand-drawn SVG, zero deps |
| Leaderboard | `index.html` + `assets/app.js` | renders from `results/` automatically |
| Levels page | `levels.html` + `assets/levels.js` | public questions + SHA-256 fingerprints |
| Playground | `play.html` + `assets/play.js` | BYOK flow + demo mode + share poster |
| Question bank | `benchmark/levels/*.json` | 10 questions per level with scoring rules & rationale |
| Runner | `runner/run_text_levels.mjs` | zero-dep Node, local & CI |
| CI re-run | `.github/workflows/rerun.yml` | workflow_dispatch, public logs |
| CORS proxy | `infra/cors-proxy-worker.js` | 20-line Cloudflare Worker |

### Data flow

```
runner (local/CI) → results/<YYYY-MM>/<episode>.json + results/raw/ answers
        ↓ git push (Pages auto-deploys)
leaderboard fetches results/index.json → renders tables/radar/costs → new episode = one PR
```

---

## Fairness Charter

1. **Same questions, same environment**: identical bank (version + SHA-256 public), identical parameters (temperature=0.2, max_tokens=1024, no system prompt)
2. **Repeated sampling**: 3 runs per question (`--runs 3`), mean reported
3. **Version disclosure**: model name, version, thinking tier, and date are mandatory fields
4. **Objective scoring only**: see [benchmark/rubric.md](benchmark/rubric.md)
5. **Budget transparency**: tokens & estimated cost published per episode
6. **Reproducible**: CI re-run logs are public
7. **Community tests never count toward the official board**

---

## Online Playground (BYOK)

> 🔑 Your API key is stored only in your browser's localStorage; requests go directly to provider APIs and never touch our servers.

Direct browser calls work for OpenAI / Anthropic / Gemini / DeepSeek.
For Kimi, Doubao and others blocked by browser CORS, deploy the 20-line Worker below and paste its URL into the "CORS proxy" field (free tier: 100k requests/day). Use a Worker you deployed yourself.

<details>
<summary><strong>Cloudflare Worker proxy (2 minutes)</strong></summary>

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create Worker
2. Paste the contents of [`infra/cors-proxy-worker.js`](infra/cors-proxy-worker.js) → Deploy
3. Fill the assigned `https://xxx.your-name.workers.dev` into the playground's "CORS proxy" field

Usage (path passthrough; nothing is logged or stored):

```
https://your-worker.dev/https://api.moonshot.cn/v1/chat/completions
```

</details>

---

## Submitting Results & Contributing

- **Submit scores**: run the runner, then open a PR with the `results/` changes and your environment notes
- **Challenge questions/scoring**: open an issue and argue your case; accepted changes bump the bank version and trigger re-runs
- **Contribute questions**: follow `benchmark/levels/*.json` (must include `scoring` and `explanation` fields); open an issue to discuss first

---

## Changelog

- **v0.1.0** (2026-09-10): initial release — A1/D1/D2 levels (10 questions each), leaderboard site, BYOK playground (demo mode + share poster), zero-dependency runner, CI re-run, CORS Worker

---

## Security Statement

Offensive content in the questions (ransomware, phishing pages, scam scripts) exists **solely to test whether models refuse or detect it**. All material comes from publicly known scam patterns and textbook-level security knowledge; this repository provides no operational attack guidance.

This benchmark is for education and model comparison, and targets no vendor. Scores vary with bank version and sampling noise — interpret responsibly. Community self-test scores do not represent official results.

---

## License

Code: [MIT](LICENSE) ｜ Question banks & content: CC BY-SA 4.0 (attribution + share-alike)

---

## Community

📺 **Bilibili: @Uncle城** — episode videos, top-3 fails, live co-testing
🌐 Live leaderboard: https://unclecheng-li.github.io/ai-safe-arena/

---

<div align="center">

> 🛡️ **AI-SAFE Arena** — Questions can be wild. Scoring must be rigorous.

</div>
