// 入场与动效引擎（零依赖）：滚动 reveal + 数字滚动 + 印章盖戳 + 活力动效
// 各页面渲染动态内容后调用 observeReveals() 让新元素也参与动画；
// initLively() 每页初始化一次（逐字标题 / 视差 / 滚动进度条 / 点击爆裂）

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 环境不支持 IO 时全部直接显示（fail-open：绝不让内容停在不可见状态）
const HAS_IO = typeof IntersectionObserver !== 'undefined';
const io = HAS_IO ? new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    revealNow(e.target);
    io.unobserve(e.target);
  }
}, { threshold: 0.1 }) : null;

function revealNow(el) {
  el.classList.add('in');
  if (el.dataset.count) countUp(el);
  const badge = el.querySelector('.badge:not(.stamp-anim)');
  if (badge) badge.classList.add('stamp-anim');
}

// 给 root 下所有 .rv 元素挂上观察（root 省略时全文档）
export function observeReveals(root = document) {
  try {
    root.querySelectorAll('.rv:not(.in)').forEach(el => io ? io.observe(el) : revealNow(el));
  } catch {
    root.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
  }
}

// 数字从 0 滚到 data-count 值（reduced-motion 下直接显示终值）
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  if (isNaN(target)) return;
  const dec = (el.dataset.count.split('.')[1] || '').length;
  if (REDUCED) { el.textContent = target.toFixed(dec); return; }
  const t0 = performance.now(), dur = 750;
  (function tick(t) {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

// ---- hero 标题逐字弹入：文本节点逐字包 .ch，mark 内部递归处理 ----
function splitChars(el) {
  const walk = (node) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach(ch => {
          if (!ch.trim()) { frag.appendChild(document.createTextNode(ch)); return; }
          const s = document.createElement('span');
          s.className = 'ch';
          s.textContent = ch;
          frag.appendChild(s);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el);
  el.querySelectorAll('.ch').forEach((s, i) => { s.style.animationDelay = `${i * 42}ms`; });
}

// ---- hero 装饰随鼠标视差漂移（translate 属性与 transform 动画互不干扰） ----
function parallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const els = hero.querySelectorAll('.deco, .sticker-stamp');
  if (!els.length) return;
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    els.forEach((el, i) => {
      const f = (i % 2 ? -1 : 1) * (12 + i * 7);
      el.style.translate = `${(dx * f).toFixed(1)}px ${(dy * f).toFixed(1)}px`;
    });
  });
  hero.addEventListener('mouseleave', () => els.forEach(el => { el.style.translate = ''; }));
}

// ---- 滚动进度条：吸在导航下缘 ----
function scrollProgress() {
  const header = document.querySelector('header.site');
  if (!header) return;
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  header.appendChild(bar);
  const update = () => {
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    bar.style.width = (p * 100).toFixed(2) + '%';
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

// ---- 按钮点击爆裂：墨点 + 黄星向外飞散 ----
function burst(x, y) {
  for (let i = 0; i < 7; i++) {
    const b = document.createElement('span');
    b.className = i % 2 ? 'burst-bit yl' : 'burst-bit';
    const ang = (Math.PI * 2 * i) / 7 + Math.random() * 0.6;
    const dist = 34 + Math.random() * 42;
    b.style.cssText = `left:${x - 4}px; top:${y - 4}px; --dx:${Math.cos(ang) * dist}px; --dy:${Math.sin(ang) * dist}px;`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 700);
  }
}

// ---- 里程碑纸屑：硬边方形彩纸从元素中心喷射（新粗野五色 + 墨描边） ----
const CONFETTI_COLORS = ['#FFD02F', '#FF5A5F', '#4D7CFE', '#06D6A0', '#FF9F1C', '#FF8FAB'];
export function confetti(el, n = 26) {
  if (REDUCED || !el) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('span');
    b.className = 'confetti-bit';
    const size = 7 + Math.random() * 5;
    const dx = (Math.random() - 0.5) * 340;
    const up = -(70 + Math.random() * 110);
    const dy = 90 + Math.random() * 160;
    const rot = (Math.random() - 0.5) * 720;
    b.style.cssText = `left:${cx - size / 2}px; top:${cy - size / 2}px; width:${size}px; height:${size}px;`
      + `background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};`
      + `--dx:${dx.toFixed(0)}px; --up:${up.toFixed(0)}px; --dy:${dy.toFixed(0)}px;`
      + `--rot:${rot.toFixed(0)}deg; --dur:${(1 + Math.random() * 0.5).toFixed(2)}s;`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1700);
  }
}

// ---- 小型提示气泡（复制确认等），锚定点击位置 ----
export function showTip(x, y, text) {
  const t = document.createElement('span');
  t.className = 'copy-tip';
  t.textContent = text;
  t.style.cssText = `left:${x}px; top:${y - 8}px;`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1200);
}

// 每页初始化一次的活力动效
export function initLively() {
  if (REDUCED) return;
  const h1 = document.querySelector('.hero h1');
  if (h1) splitChars(h1);
  parallax();
  scrollProgress();
  document.addEventListener('click', e => {
    if (e.target.closest('button.btn')) burst(e.clientX, e.clientY);
  });
}
