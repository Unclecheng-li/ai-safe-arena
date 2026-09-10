import { radarSVG } from './radar.mjs';
import { badgeFor } from './scoring.mjs';
import { icon, hydrateIcons } from './icons.mjs';

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

async function main() {
  hydrateIcons();
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
    $('lb-body').innerHTML = models.map((m, i) => {
      const b = badgeFor(m.total);
      const cells = levelIds.map(l => `<td><span class="score-mini ${scoreClass(m.scores[l] ?? 0)}">${m.scores[l] ?? '—'}</span></td>`).join('');
      const boardCells = [boardScore(m, offenseIds), boardScore(m, defenseIds)].map(v =>
        `<td><span class="score-mini ${v == null ? '' : scoreClass(v)}">${v ?? '—'}</span></td>`).join('');
      return `<tr>
        <td class="rank ${i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</td>
        <td class="model-cell"><div class="name">${m.name}</div><div class="meta">${m.vendor || ''} · ${m.version || ''} · ${m.thinkingLevel || ''}</div></td>
        <td class="model-cell"><span class="persona">${m.persona || '—'}</span></td>
        ${boardCells}
        ${cells}
        <td class="total-cell">${m.total.toFixed(1)}</td>
        <td><span class="badge" style="color:${b.color}">${icon(b.icon, 13)} ${b.name}</span></td>
        <td class="hint">${fmtCost(m)}</td>
        <td class="hint">${m.runs || 1}× / ${m.source === 'sample' ? '示例' : (m.source || '官方')}</td>
      </tr>`;
    }).join('');

    $('radar-wall').innerHTML = models.map(m => {
      const vals = levelIds.map(l => m.scores[l] ?? 0);
      return `<div class="radar-card"><div class="t">${m.name}</div>
        ${radarSVG(vals, levelIds.map(id => SHORT[id] || id), { size: 170 })}<div class="s">${m.total.toFixed(1)} 分</div></div>`;
    }).join('');

    // 成本榜：性价比 = 总分 ÷ 折算费用，高在前（"谁最便宜还最能打"）
    const withCost = models
      .map(m => ({ m, cny: costCNY(m) }))
      .filter(x => x.cny != null)
      .map(x => ({ ...x, ratio: x.m.total / x.cny }))
      .sort((a, b) => b.ratio - a.ratio);
    $('cost-body').innerHTML = withCost.length ? withCost.map(({ m, cny, ratio }, i) => `
      <tr>
        <td class="rank ${i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</td>
        <td class="model-cell"><div class="name">${m.name}</div><div class="meta">${m.vendor || ''} · ${m.version || ''}</div></td>
        <td class="total-cell">${m.total.toFixed(1)}</td>
        <td class="hint">${m.tokens ? `${((m.tokens.in + m.tokens.out) / 1000).toFixed(0)}k` : '—'}</td>
        <td class="hint">${m.currency === 'CNY' ? '¥' : '$'}${Number(m.cost).toFixed(2)}</td>
        <td class="hint">¥${cny.toFixed(1)}</td>
        <td class="total-cell" style="font-size:15px">${ratio.toFixed(1)}</td>
      </tr>`).join('') : '<tr><td colspan="7" class="hint">本期暂无成本数据</td></tr>';
  }

  sel.addEventListener('change', () => render(sel.value));
  if (episodes.length) await render(episodes[0].file);
  else $('episode-title').textContent = '暂无测评数据，敬请期待';
}

main().catch(e => {
  $('episode-title').textContent = '加载失败';
  console.error(e);
});
