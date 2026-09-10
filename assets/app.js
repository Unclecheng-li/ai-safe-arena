import { radarSVG } from './radar.mjs';
import { badgeFor } from './scoring.mjs';
import { icon, hydrateIcons } from './icons.mjs';
import { observeReveals } from './fx.mjs';

const $ = (id) => document.getElementById(id);

async function fetchJSON(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.json();
}

function scoreClass(v) {
  if (v >= 85) return 'sc-90';
  if (v >= 70) return 'sc-70';
  if (v >= 50) return 'sc-50';
  return 'sc-0';
}

function fmtCost(m) {
  if (m.cost == null) return '—';
  const cur = m.currency === 'CNY' ? '¥' : '$';
  return `${m.tokens ? ((m.tokens.in + m.tokens.out) / 1000).toFixed(0) + 'k tok · ' : ''}${cur}${Number(m.cost).toFixed(2)}`;
}

// ---- 关卡元数据（类别/权重，来自题库 JSON；拉取失败时用内置兜底） ----
const LEVEL_FILES = [
  'A1_common_sense.json', 'D1_jailbreak_refusal.json', 'D2_malware_quiz.json',
  'C1_vuln_spotting.json', 'C2_cipher_decoding.json', 'D3_incident_response.json',
];
const FALLBACK_META = {
  A1: { id: 'A1', name: '安全常识', category: 'offense', weight: 0.15 },
  D1: { id: 'D1', name: '越狱拒答与钓鱼识别', category: 'defense', weight: 0.2 },
  D2: { id: 'D2', name: '恶意代码判断', category: 'defense', weight: 0.2 },
  C1: { id: 'C1', name: '代码漏洞识别', category: 'offense', weight: 0.2 },
  C2: { id: 'C2', name: '密码学与编码', category: 'offense', weight: 0.1 },
  D3: { id: 'D3', name: '日志研判与应急响应', category: 'defense', weight: 0.15 },
};
const SHORT = { A1: '常识', D1: '拒答/识骗', D2: '恶意代码', C1: '漏洞', C2: '密码学', D3: '应急' };
// 雷达墙 / 装饰循环色板
const PALETTE = ['#FF5A5F', '#4D7CFE', '#06D6A0', '#FF9F1C', '#FF8FAB', '#B388FF'];
const LEVEL_META = {};

async function loadLevelMeta() {
  await Promise.all(LEVEL_FILES.map(async f => {
    try {
      const lv = await fetchJSON(`benchmark/levels/${f}`);
      LEVEL_META[lv.id] = { id: lv.id, name: lv.name, category: lv.category, weight: lv.weight };
    } catch { /* 单文件失败用兜底 */ }
  }));
  for (const [id, m] of Object.entries(FALLBACK_META)) if (!LEVEL_META[id]) LEVEL_META[id] = m;
}

// 板块分：该板块内「有成绩的关卡」按关卡权重归一化加权平均
function boardScore(m, ids) {
  const avail = ids.filter(id => m.scores[id] != null);
  if (!avail.length) return null;
  const wsum = avail.reduce((s, id) => s + (LEVEL_META[id]?.weight || 0), 0);
  if (!wsum) return null;
  const v = avail.reduce((s, id) => s + m.scores[id] * (LEVEL_META[id]?.weight || 0), 0) / wsum;
  return Math.round(v * 10) / 10;
}

// 成本折算人民币（美元按 1 USD ≈ 7.2 CNY 估算）
function costCNY(m) {
  if (m.cost == null || !(m.cost > 0)) return null;
  return m.currency === 'USD' ? m.cost * 7.2 : m.cost;
}

// 跑马灯内容（重复两遍实现无缝滚动）
function fillMarquee() {
  const items = ['翻车现场 · 全程围观', '规则判分 · 不用 AI 裁判', '题库全开源 · CI 可复跑',
    '六关 95 题 · 一题不放过', '进攻要打得准 · 底线要守得住', '成本透明 · 谁便宜谁上榜'];
  const html = items.map(t => `<span>${t}</span><b>◆</b>`).join('');
  $('marquee-track').innerHTML = html + html;
}

function podiumCard(m, rank, offenseIds, defenseIds) {
  const b = badgeFor(m.total);
  const off = boardScore(m, offenseIds), def = boardScore(m, defenseIds);
  return `<div class="podium-card rv p${rank}">
    ${rank === 1 ? '<svg class="crown" width="42" height="42" viewBox="0 0 24 24" fill="#FFD02F" stroke="#191512" stroke-width="1.6" stroke-linejoin="round"><path d="M2.5 17h19l-1.4-8.6L14.6 13 12 5.8 9.4 13 3.9 8.4z"/><rect x="2.5" y="17.6" width="19" height="2.6" rx="1"/></svg>' : ''}
    <div class="pc-top"><span>RANK</span><span class="pc-rank">${rank}</span></div>
    <div class="pc-body">
      <div class="pc-name">${m.name}</div>
      <div class="pc-meta">${m.vendor || ''} · ${m.version || ''}</div>
      <div class="pc-persona">${m.persona || ''}</div>
      <div class="pc-total rv" data-count="${m.total}">0</div>
      <div class="pc-boards">
        <span>进攻 ${off ?? '—'}</span><span>防御 ${def ?? '—'}</span>
      </div>
      <div class="pc-badge"><span class="badge" style="background:${b.color}">${icon(b.icon, 13)} 安全驾照 · ${b.name}</span></div>
    </div>
  </div>`;
}

async function main() {
  hydrateIcons();
  fillMarquee();
  await loadLevelMeta();
  document.getElementById('repo-link').href = 'https://github.com/Unclecheng-li/ai-safe-arena';

  let index;
  try {
    index = await fetchJSON('results/index.json');
  } catch (e) {
    $('episode-title').textContent = '无法加载数据';
    $('episode-title').insertAdjacentHTML('afterend',
      `<p class="hint">请通过 HTTP 访问本站（如 <code>python -m http.server</code>），不要直接双击打开 HTML 文件。错误：${e.message}</p>`);
    return;
  }

  const episodes = (index.episodes || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const sel = $('episode-select');
  sel.innerHTML = episodes.map(ep => `<option value="${ep.file}">${ep.title}</option>`).join('');

  async function render(file) {
    const ep = await fetchJSON(`results/${file}`);
    $('episode-title').textContent = `${ep.title} ｜ ${ep.date} ｜ 题库 ${ep.benchmarkVersion || '?'}`;
    $('demo-banner').hidden = !ep.demo;
    if (ep.note) $('demo-banner').innerHTML = `${icon('alert', 15)} <b>示例占位数据</b>——${ep.note}`;

    const levelIds = ep.levels || Object.keys(ep.models[0]?.scores || {});
    const offenseIds = levelIds.filter(id => LEVEL_META[id]?.category === 'offense');
    const defenseIds = levelIds.filter(id => LEVEL_META[id]?.category === 'defense');
    const th = $('th-levels');
    th.colSpan = levelIds.length;
    th.textContent = '关卡得分';

    const models = (ep.models || []).slice().sort((a, b) => b.total - a.total);

    // 领奖台：前三名（视觉顺序 2-1-3，名次卡片自带 p1/p2/p3 配色）
    const top3 = models.slice(0, 3);
    const order = top3.length === 3 ? [1, 0, 2] : top3.map((_, i) => i);
    $('podium').innerHTML = order.map(i => podiumCard(top3[i], i + 1, offenseIds, defenseIds)).join('');

    // 表格：第 4 名起（不足 4 个模型时整表隐藏）
    const rest = models.slice(3);
    $('rest-wrap').style.display = rest.length ? '' : 'none';
    $('lb-body').innerHTML = rest.map((m, i) => {
      const rank = i + 4;
      const b = badgeFor(m.total);
      const cells = levelIds.map(l => `<td><span class="score-mini ${scoreClass(m.scores[l] ?? 0)}">${m.scores[l] ?? '—'}</span></td>`).join('');
      const boardCells = [boardScore(m, offenseIds), boardScore(m, defenseIds)].map(v =>
        `<td><span class="score-mini ${v == null ? '' : scoreClass(v)}">${v ?? '—'}</span></td>`).join('');
      return `<tr>
        <td class="rank"><span class="rk">${rank}</span></td>
        <td class="model-cell"><div class="name">${m.name}</div><div class="meta">${m.vendor || ''} · ${m.version || ''} · ${m.thinkingLevel || ''}</div></td>
        <td class="model-cell"><span class="persona">${m.persona || '—'}</span></td>
        ${boardCells}
        ${cells}
        <td class="total-cell">${m.total.toFixed(1)}</td>
        <td><span class="badge" style="background:${b.color}">${icon(b.icon, 13)} ${b.name}</span></td>
        <td class="hint">${fmtCost(m)}</td>
        <td class="hint">${m.runs || 1}× / ${m.source === 'sample' ? '示例' : (m.source || '官方')}</td>
      </tr>`;
    }).join('');

    $('radar-wall').innerHTML = models.map((m, i) => {
      const vals = levelIds.map(l => m.scores[l] ?? 0);
      return `<div class="radar-card rv"><div class="t">${m.name}</div>
        ${radarSVG(vals, levelIds.map(id => SHORT[id] || id), { size: 175, color: PALETTE[i % PALETTE.length] })}<div class="s"><b>${m.total.toFixed(1)}</b> 分</div></div>`;
    }).join('');

    // 成本榜：性价比 = 总分 ÷ 折算费用，高在前（"谁最便宜还最能打"）
    const withCost = models
      .map(m => ({ m, cny: costCNY(m) }))
      .filter(x => x.cny != null)
      .map(x => ({ ...x, ratio: x.m.total / x.cny }))
      .sort((a, b) => b.ratio - a.ratio);
    $('cost-body').innerHTML = withCost.length ? withCost.map(({ m, cny, ratio }, i) => `
      <tr>
        <td class="rank ${i < 3 ? 'r' + (i + 1) : ''}"><span class="rk">${i + 1}</span></td>
        <td class="model-cell"><div class="name">${m.name}</div><div class="meta">${m.vendor || ''} · ${m.version || ''}</div></td>
        <td class="total-cell">${m.total.toFixed(1)}</td>
        <td class="hint">${m.tokens ? `${((m.tokens.in + m.tokens.out) / 1000).toFixed(0)}k` : '—'}</td>
        <td class="hint">${m.currency === 'CNY' ? '¥' : '$'}${Number(m.cost).toFixed(2)}</td>
        <td class="hint">¥${cny.toFixed(1)}</td>
        <td class="total-cell"><span class="ratio-big">${ratio.toFixed(1)}</span></td>
      </tr>`).join('') : '<tr><td colspan="7" class="hint">本期暂无成本数据</td></tr>';

    observeReveals();
  }

  sel.addEventListener('change', () => render(sel.value));
  if (episodes.length) await render(episodes[0].file);
  else $('episode-title').textContent = '暂无测评数据，敬请期待';
  observeReveals();
}

main().catch(e => {
  $('episode-title').textContent = '加载失败';
  console.error(e);
});
