// 本地 CORS 代理（零依赖，Node >= 18）—— 用于试测页直连不支持浏览器跨域的 API
// 背景：火山方舟(ark) 的 CORS allow-headers 不含 Authorization，浏览器直连必被预检拦截；
//      本代理在本机转发请求并补齐 CORS 头，密钥只经你本机，不经过任何第三方。
//
// 用法：  node infra/local-cors-proxy.mjs          （默认端口 8787，可用 PORT=xxxx 覆盖）
// 试测页「跨域代理」框填：  http://localhost:8787
// 转发形式（与 Cloudflare Worker 版一致，路径透传）：
//        http://localhost:8787/https://ark.cn-beijing.volces.com/api/plan/v3/chat/completions
//
// 长期方案（给粉丝用）请部署 infra/cors-proxy-worker.js 到 Cloudflare Workers（免费 10 万次/天）。

import http from 'node:http';

const PORT = process.env.PORT || 8787;
const PASS_HEADERS = ['authorization', 'x-api-key', 'anthropic-version', 'anthropic-dangerous-direct-browser-access'];
// 与 Cloudflare Worker 版一致的目标白名单：只转发已知大模型 API
const ALLOWED_HOSTS = new Set([
  'api.openai.com', 'api.anthropic.com', 'api.deepseek.com', 'api.moonshot.cn',
  'ark.cn-beijing.volces.com', 'open.bigmodel.cn', 'dashscope.aliyuncs.com',
  'generativelanguage.googleapis.com', 'api.minimax.chat', 'api.siliconflow.cn',
  'open.aiproxy-creation.siliconflow.cn', 'api.mistral.ai', 'api.x.ai', 'api.groq.com',
]);

const server = http.createServer(async (req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }

  const target = req.url.replace(/^\/+/, '');
  if (!/^https?:\/\//.test(target)) {
    res.writeHead(400, cors);
    return res.end('用法：/https://api.example.com/path ｜ 详见 infra/local-cors-proxy.mjs 注释');
  }
  let host = '';
  try { host = new URL(target).hostname; } catch { /* 下面统一 403 */ }
  if (!ALLOWED_HOSTS.has(host)) {
    res.writeHead(403, cors);
    return res.end(`目标不在白名单: ${host}`);
  }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  const headers = { 'content-type': req.headers['content-type'] || 'application/json' };
  for (const h of PASS_HEADERS) if (req.headers[h]) headers[h] = req.headers[h];

  try {
    const r = await fetch(target, {
      method: req.method,
      headers,
      body: (req.method === 'GET' || req.method === 'HEAD') ? undefined : body,
    });
    const buf = Buffer.from(await r.arrayBuffer());
    res.writeHead(r.status, { ...cors, 'content-type': r.headers.get('content-type') || 'application/json' });
    res.end(buf);
  } catch (e) {
    res.writeHead(502, cors);
    res.end(JSON.stringify({ error: `proxy fetch failed: ${e.message}` }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`CORS 代理已启动: http://localhost:${PORT}/https://...  （仅监听本机回环，Ctrl+C 停止）`);
});
