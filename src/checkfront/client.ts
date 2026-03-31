import { createHmac, randomBytes } from "node:crypto";
import { config } from "../config.js";

type Config = typeof config;

function sign(cfg: Config) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(8).toString("hex");
  const payload = `${cfg.token}${nonce}${timestamp}`;
  const sig = createHmac("sha256", cfg.key).update(payload).digest("hex");
  return { token: cfg.token, nonce, timestamp, sig };
}

function authParams(cfg: Config): URLSearchParams {
  const { token, nonce, timestamp, sig } = sign(cfg);
  const params = new URLSearchParams();
  params.set("token", token);
  params.set("nonce", nonce);
  params.set("timestamp", String(timestamp));
  params.set("sig", sig);
  return params;
}

export function createCheckfrontClient(cfg: Config) {
  const baseUrl = `https://${cfg.host}/api/3.0`;

  async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const auth = authParams(cfg);
    if (params) {
      for (const [k, v] of Object.entries(params)) auth.set(k, v);
    }
    const url = `${baseUrl}/${path}?${auth.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Checkfront API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const auth = authParams(cfg);
    const url = `${baseUrl}/${path}?${auth.toString()}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Checkfront API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async function put<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const auth = authParams(cfg);
    const url = `${baseUrl}/${path}?${auth.toString()}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Checkfront API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  return { get, post, put };
}

export type CheckfrontClient = ReturnType<typeof createCheckfrontClient>;
