// 20 行 CORS 代理（Cloudflare Worker 免费版：每天 10 万次请求）
// 用途：试测页(play.html)直连 Kimi/豆包等不支持浏览器跨域(CORS)的 API 时使用。
// 部署：dash.cloudflare.com → Workers & Pages → Create Worker → 粘贴本文件 → Deploy，
//      然后把 https://xxx.your-name.workers.dev 填进试测页的"跨域代理"输入框。
// 形式：https://your-worker.dev/https://api.moonshot.cn/v1/chat/completions（路径透传）
// 安全：不记录、不存储任何请求体与密钥，仅透传；请使用你自己部署的 Worker。

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.pathname.replace(/^\/+/, '') + url.search; // 去掉开头斜杠得到目标 URL
    if (!target.startsWith('https://')) {
      return new Response('用法：/https://api.example.com/path ｜ 部署说明见仓库 infra/cors-proxy-worker.js', { status: 400 });
    }
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const resp = await fetch(target, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    });
    const headers = new Headers(resp.headers);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);
    return new Response(resp.body, { status: resp.status, headers });
  },
};
