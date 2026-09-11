#!/usr/bin/env node
// AI-SAFE Arena 官方跑分 runner（零依赖，Node >= 18）
// 用法：
//   node run_text_levels.mjs --models ./models.json --episode ep01 --runs 3
// 可选：--levels A1,D1,D2  --filter-models "DeepSeek-V4-Pro,GLM-5.3"  --tag official|ci|local
// 密钥从环境变量读取（models.json 里只写变量名，绝不存 key 本身）。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreAnswer, levelScore } from '../assets/scoring.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : def;
}

function parseArgs() {
  const modelsFile = path.resolve(HERE, arg('models', 'models.json'));
  const episode = arg('episode', `ep${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
  const levels = (arg('levels', '') || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const filter = new Set((arg('filter-models', '') || '').split(',').map(s => s.trim()).filter(Boolean));
  const runs = Math.max(1, parseInt(arg('runs', '3'), 10) || 3);
  const tag = arg('tag', 'official');
  return { modelsFile, episode, levels, filter, runs, tag };
}

async function callModel(m, prompt) {
  const t0 = Date.now();
  let r;
  if (m.api === 'anthropic') {
    r = await fetch(`${m.baseURL.replace(/\/$/, '')}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json', 'x-api-key': process.env[m.apiKeyEnv],
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: m.model, max_tokens: 1024, temperature: 0.2, messages: [{ role: 'user', content: prompt }] }),
    });
  } else {
    r = await fetch(`${m.baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env[m.apiKeyEnv]}` },
      body: JSON.stringify({ model: m.model, temperature: 0.2, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
    });
  }
  if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  // 推理模型思考占满 token 时 content 可能为空，兜底取 reasoning_content
  const msg = d.choices?.[0]?.message ?? {};
  const text = m.api === 'anthropic'
    ? (d.content || []).map(c => c.text || '').join('\n')
    : String(msg.content || msg.reasoning_content || '');
  const usage = m.api === 'anthropic'
    ? { in: d.usage?.input_tokens || 0, out: d.usage?.output_tokens || 0 }
    : { in: d.usage?.prompt_tokens || 0, out: d.usage?.completion_tokens || 0 };
  return { text: String(text).trim(), usage, ms: Date.now() - t0 };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const args = parseArgs();
  if (!fs.existsSync(args.modelsFile)) {
    console.error(`找不到模型配置 ${args.modelsFile}。请复制 models.example.json 为 models.json 并填写。`);
    process.exit(1);
  }
  const modelsCfg = JSON.parse(fs.readFileSync(args.modelsFile, 'utf8'));

  // 加载题库
  const levelDir = path.join(ROOT, 'benchmark', 'levels');
  let levelFiles = fs.readdirSync(levelDir).filter(f => f.endsWith('.json'));
  const allLevels = {};
  for (const f of levelFiles) {
    const lv = JSON.parse(fs.readFileSync(path.join(levelDir, f), 'utf8'));
    allLevels[lv.id] = lv;
  }
  const levelIds = args.levels.length ? args.levels : Object.keys(allLevels);
  for (const id of levelIds) if (!allLevels[id]) { console.error(`未知关卡: ${id}`); process.exit(1); }

  // 环境变量里有 key 的模型才跑
  const runnable = modelsCfg.models.filter(m =>
    (!args.filter.size || args.filter.has(m.name)) && process.env[m.apiKeyEnv]);
  const skipped = modelsCfg.models.filter(m => (!args.filter.size || args.filter.has(m.name)) && !process.env[m.apiKeyEnv]);
  if (skipped.length) console.log(`跳过（缺少环境变量密钥）: ${skipped.map(m => `${m.name}(${m.apiKeyEnv})`).join(', ')}`);
  if (!runnable.length) { console.error('没有可运行的模型。'); process.exit(1); }

  console.log(`\n=== AI-SAFE Arena run: ${args.episode} | levels=${levelIds.join(',')} | runs=${args.runs} | tag=${args.tag} ===\n`);

  const rawDir = path.join(ROOT, 'results', 'raw', args.episode);
  fs.mkdirSync(rawDir, { recursive: true });

  const outModels = [];
  for (const m of runnable) {
    const perLevelScores = {}, tokens = { in: 0, out: 0 };
    let hardFail = 0;
    for (const id of levelIds) {
      const lv = allLevels[id];
      const qScores = [];
      for (const q of lv.questions) {
        let sum = 0, n = 0, responses = [];
        for (let k = 0; k < args.runs; k++) {
          try {
            const r = await callModel(m, q.prompt);
            tokens.in += r.usage.in; tokens.out += r.usage.out;
            const s = scoreAnswer(r.text, q.scoring);
            sum += s.score; n++;
            responses.push(`run${k + 1} score=${s.score}\n${r.text}`);
          } catch (e) {
            responses.push(`run${k + 1} ERROR ${e.message}`);
            if (/401|403/.test(e.message)) hardFail++;
          }
          await sleep(300);
        }
        qScores.push(n ? sum / n : 0); // 多次采样取平均，对冲 LLM 随机性（口径见 rubric.md）
        fs.writeFileSync(path.join(rawDir, `${m.name}__${q.id}.txt`), responses.join('\n\n====\n\n'), 'utf8');
      }
      perLevelScores[id] = levelScore(qScores.map((s, i) => ({ score: s })));
      console.log(`  ${m.name} · ${id} ${lv.name}: ${perLevelScores[id]}`);
    }
    const total = Math.round(levelIds.reduce((s, id) => s + perLevelScores[id] * allLevels[id].weight, 0) * 10) / 10;
    const cost = m.pricing
      ? Math.round((tokens.in / 1e6 * m.pricing.in + tokens.out / 1e6 * m.pricing.out) * 100) / 100
      : null;
    outModels.push({
      name: m.name, vendor: m.vendor || '', version: m.version || '', thinkingLevel: m.thinkingLevel || '默认',
      scores: perLevelScores, total, tokens: { ...tokens },
      cost, currency: m.pricing?.currency || 'CNY',
      runs: args.runs, source: args.tag,
    });
    console.log(`  → ${m.name} 总分 ${total}${cost != null ? ` ｜ 估算费用 ${cost} ${m.pricing?.currency || 'CNY'}` : ''}\n`);
    if (hardFail >= 3) console.warn(`  ⚠️ ${m.name} 多次鉴权失败，请检查 ${m.apiKeyEnv}`);
  }

  // 写结果（合并进已有期文件）
  const monthDir = path.join(ROOT, 'results', new Date().toISOString().slice(0, 7));
  fs.mkdirSync(monthDir, { recursive: true });
  const outFile = path.join(monthDir, `${args.episode}.json`);
  let ep = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : null;
  if (!ep) {
    ep = { episode: args.episode, date: new Date().toISOString().slice(0, 10), title: `第 ? 期（请编辑标题）`, demo: false, benchmarkVersion: allLevels[levelIds[0]].version, levels: levelIds, models: [] };
  }
  for (const om of outModels) {
    const i = ep.models.findIndex(x => x.name === om.name);
    if (i !== -1) ep.models[i] = { ...ep.models[i], ...om };
    else ep.models.push(om);
  }
  ep.models.sort((a, b) => b.total - a.total);
  fs.writeFileSync(outFile, JSON.stringify(ep, null, 2), 'utf8');

  // 更新 results/index.json
  const idxFile = path.join(ROOT, 'results', 'index.json');
  const rel = path.relative(path.join(ROOT, 'results'), outFile).replace(/\\/g, '/');
  const idx = fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, 'utf8')) : { episodes: [] };
  if (!idx.episodes.some(e => e.file === rel)) idx.episodes.push({ file: rel, date: ep.date, title: ep.title });
  idx.episodes.sort((a, b) => (a.date < b.date ? 1 : -1));
  fs.writeFileSync(idxFile, JSON.stringify(idx, null, 2), 'utf8');

  console.log(`✅ 结果已写入 ${path.relative(ROOT, outFile)}（并更新 results/index.json）`);
  console.log(`   原始回答存档：${path.relative(ROOT, path.join(ROOT, 'results', 'raw', args.episode))}（翻车素材就在这里）`);
}

main().catch(e => { console.error(e); process.exit(1); });
