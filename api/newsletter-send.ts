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

type ClientEmailService = {
  service: string;
  apiKey?: string;
  apiUrl?: string;
  fromEmail: string;
  senderName?: string;
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

function decryptApiKey(ciphertext: string, secret: string): string {
  const key = deriveKey(secret);
  const parts = String(ciphertext || "").split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted API key format");
  const iv = Buffer.from(parts[0] || "", "base64");
  const data = Buffer.from(parts[1] || "", "base64");
  const tag = Buffer.from(parts[2] || "", "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

function htmlToText(html: string): string {
  const raw = String(html || "");
  if (!raw.trim()) return "";
  return raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/?\s*(p|div|tr|table|h1|h2|h3|h4|h5|h6|li)\b[^>]*>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatFrom(senderName: string | undefined, fromEmail: string): string {
  const v = String(fromEmail || "").trim();
  if (!v) return v;
  if (v.includes("<") && v.includes(">")) return v;
  const name = String(senderName || "").trim() || "GroupTherapy";
  return `${name} <${v}>`;
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

async function sendViaResend(args: { apiKey: string; fromEmail: string; to: string[]; subject: string; html: string }) {
  const text = htmlToText(args.html);

  for (const recipient of args.to) {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: args.fromEmail,
        to: [recipient],
        subject: args.subject,
        html: args.html,
        ...(text ? { text } : {}),
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Resend error: ${err}`);
    }
  }
}

async function sendViaSendGrid(args: { apiKey: string; fromEmail: string; to: string[]; subject: string; html: string }) {
  const text = htmlToText(args.html);
  const listUnsub = args.fromEmail ? `<mailto:${String(args.fromEmail).trim()}?subject=unsubscribe>` : "";

  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: args.to.map((email) => ({ to: [{ email }] })),
      from: { email: args.fromEmail, name: "GroupTherapy Records" },
      subject: args.subject,
      content: [
        ...(text ? [{ type: "text/plain", value: text }] : []),
        { type: "text/html", value: args.html },
      ],
      ...(listUnsub ? { headers: { "List-Unsubscribe": listUnsub } } : {}),
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`SendGrid error: ${err}`);
  }
}

async function sendViaApiUrl(args: { apiUrl: string; fromEmail: string; to: string[]; subject: string; html: string }) {
  const resp = await fetch(args.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: args.to, subject: args.subject, html: args.html, from: args.fromEmail }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Email API error: ${err}`);
  }
}

export default async function handler(req: Req, res: Res) {
  try {
    const method = (req.method || "POST").toUpperCase();

    if (method === "OPTIONS") {
      res.status(204);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
      res.send("");
      return;
    }

    if (method !== "POST") {
      json(res, 405, { success: false, error: "Method not allowed" });
      return;
    }

    const token = getBearerToken(req);
    if (!token) {
      json(res, 401, { success: false, error: "Missing Authorization" });
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    // If Supabase env is present, validate the bearer token against Supabase.
    // If not present (local/dev), we still require Authorization header, but we don't block sending.
    if (supabaseUrl && (serviceRoleKey || supabaseAnonKey)) {
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
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const to: string[] = Array.isArray(body?.to) ? body.to.filter((x: any) => typeof x === "string") : [];
    const subject = String(body?.subject || "");
    const html = String(body?.html || "");
    const emailService: ClientEmailService | null = body?.emailService ? (body.emailService as any) : null;

    if (to.length === 0) {
      json(res, 400, { success: false, error: "No recipients" });
      return;
    }

    if (!subject.trim() || !html.trim()) {
      json(res, 400, { success: false, error: "Missing subject or html" });
      return;
    }

    if (!emailService || !emailService.service || emailService.service === "none") {
      json(res, 400, { success: false, error: "Email service not configured" });
      return;
    }

    const service = String(emailService.service || "none");
    const fromEmail = String(emailService.fromEmail || "").trim();
    const senderName = String(emailService.senderName || "").trim();
    const apiKey = String(emailService.apiKey || "").trim();
    const apiUrl = String(emailService.apiUrl || "").trim();

    const unsubscribeMailto = fromEmail ? `mailto:${fromEmail}?subject=unsubscribe` : "";
    const listUnsubHeader = unsubscribeMailto ? `<${unsubscribeMailto}>` : "";
    const renderedHtml = String(html || "")
      .split("{{NEWSLETTER_UNSUBSCRIBE_MAILTO}}")
      .join(unsubscribeMailto || "#");

    if (!fromEmail) {
      json(res, 400, { success: false, error: "From email not configured" });
      return;
    }

    if ((service === "resend" || service === "sendgrid") && !apiKey) {
      json(res, 400, { success: false, error: "API key not configured" });
      return;
    }

    if ((service === "ses" || service === "smtp") && !apiUrl) {
      json(res, 400, { success: false, error: "API URL not configured" });
      return;
    }

    if (service === "resend") {
      const from = formatFrom(senderName, fromEmail);
      await sendViaResend({ apiKey, fromEmail: from, to, subject, html: renderedHtml });
      json(res, 200, { success: true });
      return;
    }

    if (service === "sendgrid") {
      const text = htmlToText(renderedHtml);
      const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: to.map((email) => ({ to: [{ email }] })),
          from: { email: fromEmail, name: senderName || "GroupTherapy" },
          subject,
          content: [
            ...(text ? [{ type: "text/plain", value: text }] : []),
            { type: "text/html", value: renderedHtml },
          ],
          ...(listUnsubHeader ? { headers: { "List-Unsubscribe": listUnsubHeader } } : {}),
          reply_to: { email: fromEmail },
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`SendGrid error: ${err}`);
      }
      json(res, 200, { success: true });
      return;
    }

    if (service === "ses" || service === "smtp") {
      for (const recipient of to) {
        await sendViaApiUrl({ apiUrl, fromEmail, to: [recipient], subject, html: renderedHtml });
      }
      json(res, 200, { success: true });
      return;
    }

    json(res, 400, { success: false, error: `Unknown email service: ${service}` });
  } catch (e) {
    const msg = e instanceof Error
      ? e.message
      : typeof (e as any)?.message === "string"
        ? String((e as any).message)
        : "Unknown error";
    json(res, 500, { success: false, error: msg });
  }
}
