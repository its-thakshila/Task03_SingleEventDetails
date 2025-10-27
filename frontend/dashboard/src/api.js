// Use same-origin proxy in production; localhost for dev is still fine via Vite proxy or by setting VITE_API_URL.
const onVercel = typeof window !== 'undefined' && /\.vercel\.app$/.test(window.location.hostname);

export const API = onVercel ? "" : (import.meta.env.VITE_API_URL || "");

export async function apiGet(path) {
  const r = await fetch(`${API}${path}`, { credentials: "include" });
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
  return r.json();
}

export async function apiJSON(method, path, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body ?? {})
  });
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}`);
  return r.json();
}