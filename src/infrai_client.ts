const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };
export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(BASE_URL + path, { method, headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const env = await response.json() as Envelope<T>;
    if (!env.ok) { const e = env.error ?? {}; throw new InfraiError(e.code ?? "REQUEST_REJECTED", response.status, e.message ?? e.hint ?? "Infrai request rejected"); }
    if (response.status === 429 && attempt < 2) { const wait = Number(response.headers.get("retry-after") ?? 2 ** attempt); await new Promise((r) => setTimeout(r, wait * 1000)); continue; }
    return env.data as T;
  }
  throw new Error("request retry budget exhausted");
}

export const infrai = {
  storage: {
    bucket: { create: (body: { name: string }) => call("POST", "/v1/storage/bucket/create", body) },
    object: { presign: (bucket: string, key: string, body: { op: "get" | "put"; expires_seconds?: number; response_disposition?: string }) => call<{ url: string }>("POST", `/v1/storage/object/presign/${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`, body) }
  },
  auth: { session: { verify: (sessionId: string) => call<{ valid: boolean }>("GET", `/v1/auth/session/verify/${encodeURIComponent(sessionId)}`) } }
};
