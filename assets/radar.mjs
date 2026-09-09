// 极简 SVG 雷达图（零依赖），榜单页与试测页共用
export function radarSVG(values, labels, opts = {}) {
  const size = opts.size || 180;
  const pad = opts.pad || 34;
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - pad;
  const n = values.length;
  const colors = opts.color || ['#22d3ee', '#a78bfa'];
  const max = opts.max || 100;

  const pt = (i, frac) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [cx + Math.cos(ang) * r * frac, cy + Math.sin(ang) * r * frac];
  };
  const ring = (frac) => n === 0 ? '' :
    Array.from({ length: n }, (_, i) => pt(i, frac).map(v => v.toFixed(1)).join(',')).join(' ');

  const poly = values.map((v, i) => pt(i, Math.max(0.02, Math.min(1, v / max))).map(x => x.toFixed(1)).join(',')).join(' ');

  let grid = '', axis = '', ticks = '';
  for (const frac of [0.25, 0.5, 0.75, 1]) {
    grid += `<polygon points="${ring(frac)}" fill="none" stroke="#223047" stroke-width="1"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, 1);
    axis += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#223047" stroke-width="1"/>`;
    const [lx, ly] = pt(i, 1.22);
    const anchor = Math.abs(lx - cx) < 12 ? 'middle' : (lx > cx ? 'start' : 'end');
    ticks += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="11" fill="#9aa7bb" text-anchor="${anchor}" dominant-baseline="middle">${labels[i]} ${Math.round(values[i])}</text>`;
  }
  const gid = 'g' + Math.random().toString(36).slice(2, 8);
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    ${grid}${axis}
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors[0]}"/><stop offset="100%" stop-color="${colors[1]}"/>
    </linearGradient></defs>
    <polygon points="${poly}" fill="url(#${gid})" fill-opacity="0.32" stroke="${colors[0]}" stroke-width="2"/>
    ${ticks}
  </svg>`;
}
