import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

function firstQuery(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function html(res: Res, status: number, body: string) {
  res.status(status);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(body);
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function hmacSha256Hex(secret: string, data: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function safeText(v: unknown): string {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type UnsubPayload = {
  e: string;
  ts: number;
  sig: string;
};

function decodeToken(token: string): UnsubPayload {
  const json = base64UrlDecode(token).toString("utf8");
  const parsed = JSON.parse(json);
  return parsed as UnsubPayload;
}

function makeToken(secret: string, email: string, ts: number): string {
  const payload = { e: email, ts };
  const sig = hmacSha256Hex(secret, `${payload.e}|${payload.ts}`);
  const full: UnsubPayload = { ...payload, sig };
  return base64UrlEncode(Buffer.from(JSON.stringify(full), "utf8"));
}

export default async function handler(req: Req, res: Res) {
  try {
    const method = (req.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      html(res, 405, "Method not allowed");
      return;
    }

    const token = firstQuery(req.query?.token);
    if (!token) {
      html(res, 400, "Missing token");
      return;
    }

    const secret =
      process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
      process.env.EMAIL_SETTINGS_ENCRYPTION_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      "";

    if (!secret) {
      html(res, 500, "Server not configured");
      return;
    }

    const payload = decodeToken(token);
    const email = String(payload?.e || "").toLowerCase().trim();
    const ts = Number(payload?.ts || 0);
    const sig = String(payload?.sig || "");

    if (!email || !email.includes("@") || !ts || !sig) {
      html(res, 400, "Invalid token");
      return;
    }

    const expected = hmacSha256Hex(secret, `${email}|${ts}`);
    if (expected !== sig) {
      html(res, 400, "Invalid token");
      return;
    }

    // Token expiry: 90 days
    const ageMs = Date.now() - ts;
    if (ageMs > 1000 * 60 * 60 * 24 * 90) {
      html(res, 400, "Token expired");
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !serviceRoleKey) {
      html(res, 500, "Database not configured");
      return;
    }

    const sb = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();
    const { error } = await sb
      .from("newsletter_subscribers")
      .update({
        active: false,
        unsubscribed_at: now,
        opted_out: true,
        opted_out_at: now,
      })
      .eq("email", email);

    if (error) {
      html(res, 500, "Failed to unsubscribe");
      return;
    }

    const body = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unsubscribed</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #0b0b0f; color: #fff; margin:0; }
      .wrap { max-width: 560px; margin: 0 auto; padding: 48px 20px; }
      .card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); border-radius: 16px; padding: 20px; }
      .muted { color: rgba(255,255,255,0.70); font-size: 14px; line-height: 20px; }
      a { color: #8b5cf6; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1 style="margin:0 0 8px; font-size: 22px;">You’re unsubscribed</h1>
        <p class="muted" style="margin:0;">${safeText(email)} has been opted out from future emails.</p>
      </div>
    </div>
  </body>
</html>`;

    html(res, 200, body);
  } catch (e) {
    html(res, 500, "Server error");
  }
}
