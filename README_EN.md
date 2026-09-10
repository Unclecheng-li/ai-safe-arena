<div align="center">

# AI-SAFE Arena

> *A Chinese-first AI model security benchmark arena — questions can be wild, scoring must be rigorous.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Static](https://img.shields.io/badge/Site-Static_Only-22d3ee)](https://unclecheng-li.github.io/ai-safe-arena/)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero-34d399)](#quick-start)
[![Node](https://img.shields.io/badge/Runner-Node_18+-blue)](runner/run_text_levels.mjs)
[![Scoring](https://img.shields.io/badge/Scoring-Rules_Only_(No_LLM_Judge)-fbbf24)](benchmark/rubric.md)
[![Scope](https://img.shields.io/badge/Scope-Publicly_Known_Tests_Only-red)](#security-statement)

<br>

**中文版**: [`README.md`](README.md)

**An open-source, reproducible Chinese AI model security leaderboard + in-browser BYOK testing platform.**
<br>
Live leaderboard: https://unclecheng-li.github.io/ai-safe-arena/
<br>
**Bilibili**: @Uncle城 (episode videos & epic fails)
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
  A1 Common Sense    → 20 questions on anti-fraud / passwords / Wi-Fi / social engineering
  D1 Refusal & Phishing → 10 harmful/jailbreak requests (should it refuse?) + 10 scam-detection tasks
  D2 Malware Spotting  → 20 code/log/dependency snippets (malicious or benign, with decoys)
  C1 Vuln Spotting   → 15 code snippets (OWASP classics, incl. "no vulnerability" controls)
  C2 Cipher & Encoding → 10 decoding tasks (Base64 / Caesar / Morse / rail fence…)
  D3 Incident Response → 10 attack logs & intrusion traces (brute force / miners / webshell / DNS tunneling)

  ↓ rules-based scoring (no LLM judge)

Report card: total score + tier badge (Bronze → Master) + multi-axis radar chart
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

> Question bank v0.2.0 · **6 levels, 95 questions** · scoring rules + SHA-256 fingerprints shown live on the [levels page](https://unclecheng-li.github.io/ai-safe-arena/levels.html) (Chinese)

| Level | # | Tests | Scoring |
|-------|:---:|-------|---------|
| **A1 Security Common Sense** | 20 | Anti-fraud, passwords, Wi-Fi, social engineering, personal-data hygiene | Multiple choice, exact match |
| **D1 Jailbreak Refusal & Phishing Detection** | 20 | 10 clearly-harmful / jailbreak-wrapped requests (DAN persona, "legitimate reason" pretexts) + 10 scam-detection tasks (AI face-swap, pig-butchering, fake loan-cancel in 2026 style) | Refusal keywords / verdict + reasoning keyword groups |
| **D2 Malware Identification** | 20 | Malicious vs benign code/config/artifacts — macro viruses, webshells, miners, backdoor accounts, ransom notes, DNS tunneling, with benign decoys | Verdict + behavior keyword groups |
| **C1 Vulnerability Spotting** | 15 | OWASP classics: SQLi, XSS, SSRF, path traversal, command injection, deserialization, XXE, JWT bypass… plus "no vulnerability" benign controls | Vulnerability verdict + cause keyword groups |
| **C2 Cipher & Encoding** | 10 | Base64 / ROT13 / Caesar / HEX / Morse / binary / Atbash / rail fence / URL / reverse (all ciphertexts generated & verified programmatically) | Normalized contains-match |
| **D3 Incident Response & Log Analysis** | 10 | SSH brute force, Windows 4625 chains, cron persistence, miners, webshell drops, phishing headers, DNS tunneling | Incident verdict + evidence keywords / field extraction |

**Roadmap**: web range flag-capturing level (local Docker), AI red-vs-blue level.

---

## Features

- **Rules-based scoring, never an LLM judge** — industry consensus: safety decisions are not delegated to model judges. All keyword/exact-match logic, open for audit
- **Zero dependencies** — static site with no framework and no CDN (hand-drawn SVG radar); the runner is a single Node script (≥18, native fetch)
- **One scoring engine everywhere** — `assets/scoring.mjs` is imported by both the browser playground and the CLI runner; no dual standards
- **BYOK (bring your own key)** — keys live only in browser localStorage, requests go straight to provider APIs; demo mode needs no key at all
- **Question bank fingerprints** — the levels page computes live SHA-256 per level; any question change is visible
- **Repeated sampling** — official runs take the mean of 3 samples per question to damp LLM randomness
- **Cost transparency** — token usage and estimated cost published with every episode, plus a cost-efficiency board ("cheapest yet strongest", USD converted at ≈7.2 CNY)
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

No key? Click the "Demo mode" button to run the whole flow with a simulated model.

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
| L1 text levels | common sense / refusal / malware spotting | Yes | Yes | Yes |
| L2 code levels | code audit, patching (sandboxed scoring) | — | Yes | Yes |
| L3 environment levels | web range flags, PoC reproduction (Docker) | — | — | Yes |

Community self-test scores are labeled as such and never enter the official leaderboard.

### Modules

| Module | File | Notes |
|--------|------|-------|
| Scoring engine | `assets/scoring.mjs` | 7 scoring modes, shared by browser & runner |
| Radar chart | `assets/radar.mjs` | hand-drawn SVG, zero deps |
| Leaderboard | `index.html` + `assets/app.js` | renders from `results/`: overall + offense/defense board scores + 6-axis radar + cost board |
| Levels page | `levels.html` + `assets/levels.js` | public questions + SHA-256 fingerprints |
| Playground | `play.html` + `assets/play.js` | BYOK flow + demo mode + share poster |
| Question bank | `benchmark/levels/*.json` | 6 levels, 95 questions with scoring rules & rationale |
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

> Your API key is stored only in your browser's localStorage; requests go directly to provider APIs and never touch our servers.

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

- **v0.3.0** (2026-09-10): full visual redesign — Neo-Brutalism × driving-test flyer design system (paper-cream background, bold ink borders, hard shadows; dark gradients removed). New caution tapes + infinite marquees; top-3 leaderboard becomes a podium (crown sticker, count-up scores); rank badges are now stamped seals; radar charts use ink grids with per-model palette; levels page renders six colored dossier cards; playground gets sticker-style forms, animated striped progress bar, and a fully redrawn poster canvas (paper card + caution tape + red seal); new `fx.mjs` scroll-motion module; fixed A1 level metadata (category common → offense, matching the "offense = A1/C1/C2" board).
- **v0.2.2** (2026-09-10): leaderboard adds offense/defense board-score columns (weight-normalized within each board) and a cost-efficiency board (score ÷ converted cost, USD at ≈7.2 CNY); radar now labels the six levels with short names; level category/weight metadata is fetched from the level JSONs with a built-in fallback.
- **v0.2.1** (2026-09-10): levels page now renders Chinese descriptions for the decode/extract/incident scoring modes; sample leaderboard data re-synced to the 6-level v0.2.0 weights; playground adds direct Google Gemini support (official OpenAI-compatible endpoint); fixed stale v0.1.0 question-count copy in README/playground.
- **v0.2.0** (2026-09-10): question bank expanded to 6 levels / 95 questions — A1/D1/D2 grown to 20 each; new C1 vulnerability spotting, C2 cipher & encoding, D3 incident response & log analysis; scoring engine adds decode/extract/incident modes; D1 now includes DAN-style jailbreak wrappers.
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

**Bilibili: @Uncle城** — episode videos, top-3 fails, live co-testing
<br>
**Live leaderboard**: https://unclecheng-li.github.io/ai-safe-arena/

---

<div align="center">

> **AI-SAFE Arena** — Questions can be wild. Scoring must be rigorous.

</div>
