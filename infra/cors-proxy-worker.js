// CORS 代理（Cloudflare Worker 免费版：每天 10 万次请求）—— 给粉丝公用的官方代理
// 用途：试测页(play.html)直连 ark/Kimi 等不支持浏览器跨域(CORS)的 API 时使用。
// 部署：dash.cloudflare.com → Workers & Pages → Create Worker → 粘贴本文件 → Deploy，
//      把分配的地址填进 assets/play.js 顶部 OFFICIAL_PROXY_URL，粉丝即零配置。
// 形式：https://your-worker.dev/https://api.moonshot.cn/v1/chat/completions（路径透传）
//
// 安全设计：
//  1. 目标主机白名单（只转发已知大模型 API，防止被滥用为通用开放代理）
//  2. 不记录、不存储任何请求体与密钥，仅透传；请部署在自己的账号下

const ALLOWED_HOSTS = new Set([
  'api.openai.com',
  'api.anthropic.com',
  'api.deepseek.com',
  'api.moonshot.cn',
  'ark.cn-beijing.volces.com',
  'open.bigmodel.cn',
  'dashscope.aliyuncs.com',
  'generativelanguage.googleapis.com',
  'api.minimax.chat',
  'api.siliconflow.cn',
  'open.aiproxy-creation.siliconflow.cn',
  'api.mistral.ai',
  'api.x.ai',
  'api.groq.com',
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.pathname.replace(/^\/+/, '') + url.search; // 去掉开头斜杠得到目标 URL
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    if (!target.startsWith('https://')) {
      return new Response('用法：/https://api.example.com/path ｜ 部署说明见仓库 infra/cors-proxy-worker.js', { status: 400, headers: cors });
    }
    // 白名单校验：只转发已知大模型 API 主机
    const host = new URL(target).hostname;
    if (!ALLOWED_HOSTS.has(host)) {
      return new Response(`目标不在白名单: ${host}`, { status: 403, headers: cors });
    }

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
