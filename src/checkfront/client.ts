import { appendFileSync } from "node:fs";
import { config } from "../config.js";

function log(msg: string) {
  appendFileSync("/tmp/checkfront-mcp.log", `${new Date().toISOString()} ${msg}\n`);
}

type CheckfrontConfig = typeof config;

export function createCheckfrontClient(cfg: CheckfrontConfig) {
  const baseUrl = `https://${cfg.host}/api/3.0`;
  const authHeader = `Basic ${Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString("base64")}`

  async function get<T>(path: string): Promise<T> {
    const url = `${baseUrl}/${path}`;
    const label = `Checkfront ${path}`;
    const started = Date.now();

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader
      }
    });

    const elapsed = Date.now() - started;
    log(`${label} ${url} ${res.status} (${elapsed} ms)`);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Checkfront API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  return { get };
}

export type CheckfrontClient = ReturnType<typeof createCheckfrontClient>;
