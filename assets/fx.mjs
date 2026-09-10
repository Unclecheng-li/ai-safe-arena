// 入场与滚动动效（零依赖）：滚动 reveal + 数字滚动 + 印章盖戳
// 各页面渲染动态内容后调用 observeReveals() 让新元素也参与动画

const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    if (e.target.dataset.count) countUp(e.target);
    const stamp = e.target.querySelector('.stamp:not(.stamp-anim)');
    if (stamp) stamp.classList.add('stamp-anim');
    io.unobserve(e.target);
  }
}, { threshold: 0.1 });

// 给 root 下所有 .rv 元素挂上观察（root 省略时全文档）
export function observeReveals(root = document) {
  root.querySelectorAll('.rv:not(.in)').forEach(el => io.observe(el));
}

// 数字从 0 滚到 data-count 值
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  if (isNaN(target)) return;
  const dec = (el.dataset.count.split('.')[1] || '').length;
  const t0 = performance.now(), dur = 750;
  (function tick(t) {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}
