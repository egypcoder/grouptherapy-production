import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
};

type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function getBearerToken(req: Req): string | null {
  const h = firstHeader(req.headers["authorization"]) || firstHeader(req.headers["Authorization"]);
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

function json(res: Res, status: number, data: any) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify(data));
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptApiKey(apiKey: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${enc.toString("base64")}:${tag.toString("base64")}`;
}

function maskLast4(apiKey: string): string {
  const v = String(apiKey || "");
  if (v.length <= 4) return v;
  return v.slice(-4);
}

async function getSettingsRow(sbAdmin: any) {
  const { data, error } = await sbAdmin
    .from("email_service_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export default async function handler(req: Req, res: Res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || (!serviceRoleKey && !supabaseAnonKey)) {
      json(res, 500, {
        success: false,
        error: "Supabase server env is not configured (need SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)",
      });
      return;
    }

    const token = getBearerToken(req);
    if (!token) {
      json(res, 401, { success: false, error: "Missing Authorization" });
      return;
    }

    const sbDb = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey!);

    const userAuthClient = serviceRoleKey
      ? sbDb
      : createClient(supabaseUrl, supabaseAnonKey!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

    const { data: userResult, error: userError } = serviceRoleKey
      ? await sbDb.auth.getUser(token)
      : await (userAuthClient as any).auth.getUser();
    if (userError || !userResult?.user) {
      json(res, 401, { success: false, error: "Unauthorized" });
      return;
    }

    if ((req.method || "GET").toUpperCase() === "GET") {
      const row = await getSettingsRow(sbDb);
      json(res, 200, {
        success: true,
        settings: row
          ? {
              service: row.service || "none",
              apiUrl: row.api_url || "",
              fromEmail: row.from_email || "",
              apiKeyLast4: row.api_key_last4 || "",
              hasApiKey: !!row.api_key_encrypted,
            }
          : {
              service: "none",
              apiUrl: "",
              fromEmail: "",
              apiKeyLast4: "",
              hasApiKey: false,
            },
      });
      return;
    }

    if ((req.method || "POST").toUpperCase() === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const service = String(body?.service || "none");
      const apiUrl = String(body?.apiUrl || "");
      const fromEmail = String(body?.fromEmail || "");
      const apiKey = body?.apiKey ? String(body.apiKey) : "";

      const existing = await getSettingsRow(sbDb);

      if (!fromEmail.trim() || !fromEmail.includes("@")) {
        json(res, 400, { success: false, error: "Please provide a valid From email address" });
        return;
      }

      if ((service === "resend" || service === "sendgrid") && !apiKey && !existing?.api_key_encrypted) {
        json(res, 400, { success: false, error: "Please provide an API key for this email service" });
        return;
      }

      if ((service === "ses" || service === "smtp") && !apiUrl.trim()) {
        json(res, 400, { success: false, error: "Please provide an API URL for this email service" });
        return;
      }

      const payload: any = {
        service,
        api_url: apiUrl || null,
        from_email: fromEmail || null,
      };

      if (apiKey) {
        const secret = requireEnv("EMAIL_SETTINGS_ENCRYPTION_KEY");
        payload.api_key_encrypted = encryptApiKey(apiKey, secret);
        payload.api_key_last4 = maskLast4(apiKey);
      }

      if (existing?.id) {
        const { error } = await sbDb.from("email_service_settings").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await sbDb.from("email_service_settings").insert(payload);
        if (error) throw error;
      }

      const row = await getSettingsRow(sbDb);
      json(res, 200, {
        success: true,
        settings: row
          ? {
              service: row.service || "none",
              apiUrl: row.api_url || "",
              fromEmail: row.from_email || "",
              apiKeyLast4: row.api_key_last4 || "",
              hasApiKey: !!row.api_key_encrypted,
            }
          : null,
      });
      return;
    }

    json(res, 405, { success: false, error: "Method not allowed" });
  } catch (e) {
    const msg = e instanceof Error
      ? e.message
      : typeof (e as any)?.message === "string"
        ? String((e as any).message)
        : "Unknown error";
    json(res, 500, { success: false, error: msg });
  }
}
