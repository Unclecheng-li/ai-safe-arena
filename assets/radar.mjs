// 极简 SVG 雷达图（零依赖），榜单页与试测页共用 —— 新粗野主义配色：墨色网格 + 彩色填充
export function radarSVG(values, labels, opts = {}) {
  const size = opts.size || 180;
  const pad = opts.pad || 34;
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - pad;
  const n = values.length;
  // 兼容旧调用：color 曾传 [c1, c2]，现在取第一个（或直接传字符串）
  const raw = opts.color || '#4D7CFE';
  const accent = Array.isArray(raw) ? raw[0] : raw;
  const ink = '#191512';
  const max = opts.max || 100;

  const pt = (i, frac) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [cx + Math.cos(ang) * r * frac, cy + Math.sin(ang) * r * frac];
  };
  const ring = (frac) => n === 0 ? '' :
    Array.from({ length: n }, (_, i) => pt(i, frac).map(v => v.toFixed(1)).join(',')).join(' ');

  const poly = values.map((v, i) => pt(i, Math.max(0.02, Math.min(1, v / max))).map(x => x.toFixed(1)).join(',')).join(' ');

  let grid = '', axis = '', ticks = '', dots = '';
  for (const frac of [0.25, 0.5, 0.75, 1]) {
    grid += `<polygon points="${ring(frac)}" fill="none" stroke="${ink}" stroke-opacity="${frac === 1 ? 0.75 : 0.22}" stroke-width="${frac === 1 ? 2 : 1.2}"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, 1);
    axis += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${ink}" stroke-opacity="0.25" stroke-width="1.2" stroke-dasharray="3 3"/>`;
    const [lx, ly] = pt(i, 1.24);
    const anchor = Math.abs(lx - cx) < 12 ? 'middle' : (lx > cx ? 'start' : 'end');
    ticks += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="11" font-weight="700" font-family="'JetBrains Mono',Consolas,monospace" fill="${ink}" text-anchor="${anchor}" dominant-baseline="middle">${labels[i]} ${Math.round(values[i])}</text>`;
  }
  // 数据顶点：彩色实心 + 墨描边（class=rp/rd 供入场动画，顶点逐个弹出）
  values.forEach((v, i) => {
    const [x, y] = pt(i, Math.max(0.02, Math.min(1, v / max)));
    dots += `<circle class="rd" style="animation-delay:${0.35 + i * 0.06}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${accent}" stroke="${ink}" stroke-width="1.6"/>`;
  });

  // 估算标签像素宽度（CJK≈1em、拉丁/数字≈0.62em、含空格），据此横向加宽 viewBox，防止左右标签被裁切
  const fontSize = 11;
  const estTextW = (s) => [...String(s)].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e7f ? fontSize : fontSize * 0.62), 0) + 4;
  let mx = 0;
  labels.forEach((l, i) => {
    const tw = estTextW(`${l} ${Math.round(values[i])}`);
    const [lx] = pt(i, 1.24);
    if (lx < cx - 12) mx = Math.max(mx, tw - lx);                    // 左侧锚点 end：向左伸出
    else if (lx > cx + 12) mx = Math.max(mx, lx + tw - size);        // 右侧锚点 start：向右伸出
    else mx = Math.max(mx, tw / 2 - Math.min(lx, size - lx));        // 上下锚点 middle：半宽伸出
  });
  mx = Math.max(0, Math.ceil(mx));
  const my = 10; // 顶部/底部标签半高余量，防上缘裁切
  // minW：viewBox 最小宽度（试测页成绩单传 500，保证长标签两侧余量）
  const vw = Math.max(size + 2 * mx, Math.ceil(opts.minW || 0));
  const vx = (size - vw) / 2;

  return `<svg viewBox="${vx.toFixed(0)} ${-my} ${vw} ${size + 2 * my}" width="${vw}" height="${size + 2 * my}" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
    ${grid}${axis}
    <polygon class="rp" points="${poly}" fill="${accent}" fill-opacity="0.38" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}
    ${ticks}
  </svg>`;
}
