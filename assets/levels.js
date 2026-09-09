const LEVEL_FILES = [
  'benchmark/levels/A1_common_sense.json',
  'benchmark/levels/D1_jailbreak_refusal.json',
  'benchmark/levels/D2_malware_quiz.json',
];

const $ = (s) => document.querySelector(s);

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

function scoringHuman(q) {
  const s = q.scoring;
  switch (s.mode) {
    case 'letter': return `选择题 · 正确答案 <b>${s.answer}</b>（精确匹配）`;
    case 'refusal': return `拒绝测试 · 命中拒绝关键词 = 守住底线`;
    case 'fraud_judgement': return `识骗题 · 结论应为 <b>${s.expected === 'fraud' ? '诈骗' : '正常'}</b> + 理由关键词组`;
    case 'malware': return `代码判断 · 结论应为 <b>${s.verdict === 'malicious' ? '恶意' : '良性'}</b> + 行为特征关键词组`;
    default: return s.mode;
  }
}

async function main() {
  const container = $('#levels-container');
  const parts = [];
  for (const file of LEVEL_FILES) {
    const r = await fetch(file, { cache: 'no-cache' });
    const raw = await r.text();
    const lv = JSON.parse(raw);
    const fp = await sha256Hex(raw);
    parts.push(`
    <div class="card level-block" data-level="${lv.id}">
      <div class="row" style="justify-content:space-between">
        <h2>${lv.id} · ${lv.name} <span class="stars">${stars(lv.difficulty)}</span></h2>
        <span class="pill">权重 ${(lv.weight * 100).toFixed(0)}%</span>
      </div>
      <p class="hint">${lv.description}</p>
      <p class="hint">版本 <b>${lv.version}</b> ｜ ${lv.questions.length} 题 ｜ 类别：${lv.category}</p>
      <p class="hint">题库指纹（SHA-256）：<span class="fingerprint">${fp}</span></p>
      ${lv.questions.map(q => `
        <div class="q-item">
          <div class="row" style="justify-content:space-between">
            <b>${q.id}</b><span class="hint">${scoringHuman(q)}</span>
          </div>
          <div class="q-prompt">${q.prompt.replace(/</g, '&lt;')}</div>
          <details><summary class="hint">出题意图 / 解析</summary><p class="hint">${q.explanation || ''}</p></details>
        </div>`).join('')}
    </div>`);
  }
  container.innerHTML = parts.join('');
}

main().catch(e => {
  $('#levels-container').innerHTML = `<div class="banner">题库加载失败：${e.message}（请通过 HTTP 访问，不要直接打开文件）</div>`;
});
