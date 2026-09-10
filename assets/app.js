import { radarSVG } from './radar.mjs';
import { badgeFor } from './scoring.mjs';

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

async function main() {
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
    if (ep.note) $('demo-banner').innerHTML = `⚠️ <b>示例占位数据</b>——${ep.note}`;

    const levelIds = ep.levels || Object.keys(ep.models[0]?.scores || {});
    const th = $('th-levels');
    th.colSpan = levelIds.length;
    th.textContent = '关卡得分';

    const models = (ep.models || []).slice().sort((a, b) => b.total - a.total);
    $('lb-body').innerHTML = models.map((m, i) => {
      const b = badgeFor(m.total);
      const cells = levelIds.map(l => `<td><span class="score-mini ${scoreClass(m.scores[l] ?? 0)}">${m.scores[l] ?? '—'}</span></td>`).join('');
      return `<tr>
        <td class="rank ${i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</td>
        <td class="model-cell"><div class="name">${m.name}</div><div class="meta">${m.vendor || ''} · ${m.version || ''} · ${m.thinkingLevel || ''}</div></td>
        <td class="model-cell"><span class="persona">${m.persona || '—'}</span></td>
        ${cells}
        <td class="total-cell">${m.total.toFixed(1)}</td>
        <td><span class="badge" style="color:${b.color}">${b.icon} ${b.name}</span></td>
        <td class="hint">${fmtCost(m)}</td>
        <td class="hint">${m.runs || 1}× / ${m.source === 'sample' ? '示例' : (m.source || '官方')}</td>
      </tr>`;
    }).join('');

    $('radar-wall').innerHTML = models.map(m => {
      const vals = levelIds.map(l => m.scores[l] ?? 0);
      return `<div class="radar-card"><div class="t">${m.name}</div>
        ${radarSVG(vals, levelIds, { size: 170 })}<div class="s">${m.total.toFixed(1)} 分</div></div>`;
    }).join('');
  }

  sel.addEventListener('change', () => render(sel.value));
  if (episodes.length) await render(episodes[0].file);
  else $('episode-title').textContent = '暂无测评数据，敬请期待';
}

main().catch(e => {
  $('episode-title').textContent = '加载失败';
  console.error(e);
});
