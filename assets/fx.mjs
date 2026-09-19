// 入场与动效引擎（零依赖）：滚动 reveal + 数字滚动 + 印章盖戳 + 活力动效 + 灵动力场
// 各页面渲染动态内容后调用 observeReveals() 让新元素也参与动画；
// initLively() 每页初始化一次（逐字标题 / 视差 / 滚动进度条 / 点击爆裂 / 氛围粒子 / 星星尾迹等）
// v0.4.0 新增导出：countUp / scramble / tilt / twinkles（榜单页灵动增强用）

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = matchMedia('(pointer: fine)').matches;

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
export function countUp(el) {
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

/* ============================================================
   灵动力场层（v0.4.0）—— 氛围粒子 / 星星尾迹 / 解码 / 倾斜 / 磁吸
   ============================================================ */

// ---- 全站漂浮几何粒子背景：canvas 固定最底层，鼠标靠近轻轻散开 ----
function initAmbient() {
  const cv = document.createElement('canvas');
  cv.id = 'ambient-canvas';
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  const COLORS = ['#191512', '#FFD02F', '#FF5A5F', '#4D7CFE', '#06D6A0', '#FF9F1C'];
  const DPR = Math.min(2, devicePixelRatio || 1);
  let W = 0, H = 0, parts = [], raf = 0, mx = -9999, my = -9999;

  function resize() {
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.min(46, Math.max(16, Math.round(W * H / 26000)));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .24, vy: (Math.random() - .5) * .24,
      s: 3 + Math.random() * 5,
      c: COLORS[Math.random() * COLORS.length | 0],
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .012,
      shape: Math.random() * 3 | 0,           // 0 方块 1 十字 2 三角
      a: .09 + Math.random() * .15,
    }));
  }

  function draw(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
    ctx.lineWidth = 2;
    const s = p.s;
    if (p.shape === 0) ctx.fillRect(-s / 2, -s / 2, s, s);
    else if (p.shape === 1) {
      ctx.beginPath();
      ctx.moveTo(-s / 2, 0); ctx.lineTo(s / 2, 0);
      ctx.moveTo(0, -s / 2); ctx.lineTo(0, s / 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -s / 1.5); ctx.lineTo(s / 1.8, s / 2); ctx.lineTo(-s / 1.8, s / 2);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 12000) { const d = Math.sqrt(d2) || 1; p.x += dx / d * .9; p.y += dy / d * .9; }
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
      draw(p);
    }
    raf = requestAnimationFrame(tick);
  }

  resize();
  addEventListener('resize', resize, { passive: true });
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(tick);
  });
  raf = requestAnimationFrame(tick);
}

// ---- 鼠标星星尾迹：小黄星 + 墨色十字，快速淡出（仅精确指针） ----
function sparkleTrail() {
  if (!FINE_POINTER) return;
  let last = 0;
  addEventListener('mousemove', e => {
    const now = performance.now();
    if (now - last < 48) return;
    last = now;
    const s = document.createElement('span');
    s.className = Math.random() < .55 ? 'trail-bit' : 'trail-bit cross';
    s.style.cssText = `left:${e.clientX}px; top:${e.clientY}px; --rot:${(Math.random() * 160 - 80) | 0}deg;`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 620);
  }, { passive: true });
}

// ---- 跑马灯随滚动速度加速（滚得越快，字幕越躁） ----
function marqueeBoost() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  let lastY = scrollY, boost = 0, t;
  addEventListener('scroll', () => {
    boost = Math.min(3, boost + Math.abs(scrollY - lastY) / 260);
    lastY = scrollY;
    track.style.animationDuration = (26 / (1 + boost)).toFixed(1) + 's';
    clearTimeout(t);
    t = setTimeout(() => { boost = 0; track.style.animationDuration = ''; }, 480);
  }, { passive: true });
}

// ---- 回到顶部按钮：新粗野主义方块 + 圆环滚动进度 ----
function backToTop() {
  const fab = document.createElement('button');
  fab.id = 'back-top';
  fab.type = 'button';
  fab.setAttribute('aria-label', '回到顶部');
  fab.innerHTML = `
    <svg class="ring" viewBox="0 0 40 40" aria-hidden="true">
      <circle class="bg" cx="20" cy="20" r="15.9"/>
      <circle class="fg" cx="20" cy="20" r="15.9"/>
    </svg>
    <svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
  document.body.appendChild(fab);
  const fg = fab.querySelector('.fg');
  const update = () => {
    const h = document.documentElement;
    const p = Math.min(1, h.scrollTop / (h.scrollHeight - h.clientHeight || 1));
    fg.style.strokeDashoffset = (100 * (1 - p)).toFixed(1);
    fab.classList.toggle('show', h.scrollTop > 380);
  };
  addEventListener('scroll', update, { passive: true });
  update();
  fab.addEventListener('click', e => {
    burst(e.clientX, e.clientY);
    scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---- 英雄区鼠标聚光灯：--mx/--my 喂给 CSS 径向高光 ----
function heroSpotlight() {
  const hero = document.querySelector('.hero');
  if (!hero || !FINE_POINTER) return;
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
    hero.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
  }, { passive: true });
}

// ---- 文字解码乱序显现：安全竞技场的"破译"仪式感 ----
export function scramble(el, dur = 650) {
  if (REDUCED || !el || el.dataset.busy) return;
  const text = el.dataset.text || el.textContent;
  el.dataset.text = text;
  el.dataset.busy = '1';
  const CHARS = '!<>-_/[]{}=+*^?#%$01';
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - (1 - p) * (1 - p);
    const reveal = Math.floor(eased * text.length);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      out += i < reveal || !text[i].trim() ? text[i] : CHARS[Math.random() * CHARS.length | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else { el.textContent = text; delete el.dataset.busy; }
  })(t0);
}

// ---- 卡片 3D 倾斜随动（p1 保留 scale 与脉冲光环，不覆盖其阴影） ----
export function tilt(selector, max = 4.5) {
  if (REDUCED || !FINE_POINTER) return;
  document.querySelectorAll(selector).forEach(card => {
    if (card.dataset.tilt) return;
    card.dataset.tilt = '1';
    const isP1 = card.classList.contains('p1');
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(720px) rotateX(${(-dy * max).toFixed(2)}deg) rotateY(${(dx * max).toFixed(2)}deg) translate(-3px,-3px)${isP1 ? ' scale(1.045)' : ''}`;
      if (!isP1) card.style.boxShadow = `${(8 + dx * 3).toFixed(1)}px ${(8 + dy * 3).toFixed(1)}px 0 var(--ink)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
  });
}

// ---- 冠军卡星星闪烁：在卡片上部随机撒几颗四角星 ----
export function twinkles(el, n = 6) {
  if (REDUCED || !el) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'twinkle';
    s.style.cssText = `left:${(8 + Math.random() * 84).toFixed(0)}%; top:${(5 + Math.random() * 34).toFixed(0)}%;`
      + `animation-delay:${(Math.random() * 2.4).toFixed(2)}s; --ts:${(0.7 + Math.random() * 0.7).toFixed(2)};`;
    el.appendChild(s);
  }
}

// ---- 大按钮磁吸：用 translate 属性，与 transform 动画（呼吸）互不干扰 ----
function magnetic() {
  if (!FINE_POINTER) return;
  document.querySelectorAll('.btn.big').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.translate = `${(dx * .14).toFixed(1)}px ${(dy * .2).toFixed(1)}px`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.translate = ''; });
  });
}

// 每页初始化一次的活力动效
export function initLively() {
  if (REDUCED) return;
  const h1 = document.querySelector('.hero h1');
  if (h1) splitChars(h1);
  parallax();
  scrollProgress();
  initAmbient();
  sparkleTrail();
  marqueeBoost();
  backToTop();
  heroSpotlight();
  magnetic();
  const tag = document.querySelector('.hero-tag');
  if (tag) setTimeout(() => scramble(tag, 850), 650);
  document.addEventListener('click', e => {
    if (e.target.closest('button.btn')) burst(e.clientX, e.clientY);
  });
}
