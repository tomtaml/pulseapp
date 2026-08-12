import base from "./index.js";

const PREVIEW_VERSION = "0.6.0";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const response = await base.fetch(request, env, ctx);
    if (request.method !== "GET" || (url.pathname !== "/api/config" && url.pathname !== "/api/health")) return response;
    try {
      const data = await response.clone().json();
      if (url.pathname === "/api/config") data.app_version = PREVIEW_VERSION;
      if (url.pathname === "/api/health") data.version = PREVIEW_VERSION;
      return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers: response.headers });
    } catch {
      return response;
    }
  }
};
