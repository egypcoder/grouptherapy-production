import { supabase } from "./supabase";
import { setEmailConfig } from "./email-service";

export type EmailServiceSettings = {
  service: string;
  apiUrl: string;
  fromEmail: string;
  senderName: string;
  apiKeyLast4: string;
  hasApiKey: boolean;
};

const STORAGE_KEY = "newsletter_email_service_settings";

type StoredEmailServiceSettings = {
  service: string;
  apiUrl: string;
  fromEmail: string;
  senderName?: string;
  apiKey?: string;
};

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

function maskLast4(apiKey?: string): string {
  const v = String(apiKey || "");
  if (v.length <= 4) return v;
  return v.slice(-4);
}

function readStored(): StoredEmailServiceSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      service: String((parsed as any).service || "none"),
      apiUrl: String((parsed as any).apiUrl || ""),
      fromEmail: String((parsed as any).fromEmail || ""),
      senderName: (parsed as any).senderName ? String((parsed as any).senderName) : undefined,
      apiKey: (parsed as any).apiKey ? String((parsed as any).apiKey) : undefined,
    };
  } catch {
    return null;
  }
}

function writeStored(next: StoredEmailServiceSettings | null) {
  if (typeof window === "undefined") return;
  if (!next) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function toPublicSettings(s: StoredEmailServiceSettings | null): EmailServiceSettings {
  const service = s?.service || "none";
  const apiUrl = s?.apiUrl || "";
  const fromEmail = s?.fromEmail || "";
  const senderName = String(s?.senderName || "").trim();
  const apiKeyLast4 = maskLast4(s?.apiKey);
  const hasApiKey = !!String(s?.apiKey || "").trim();
  return { service, apiUrl, fromEmail, senderName, apiKeyLast4, hasApiKey };
}

export async function fetchEmailServiceSettings(): Promise<EmailServiceSettings> {
  await getAccessToken();
  const stored = readStored();
  const publicSettings = toPublicSettings(stored);
  setEmailConfig(
    publicSettings.service && publicSettings.service !== "none"
      ? {
          service: publicSettings.service,
          apiKey: stored?.apiKey,
          apiUrl: publicSettings.apiUrl,
          fromEmail: publicSettings.fromEmail,
        }
      : null
  );
  return publicSettings;
}

export async function getEmailServiceSettingsForSending(): Promise<StoredEmailServiceSettings> {
  await getAccessToken();
  const stored = readStored();
  if (!stored) throw new Error("Email service not configured");
  return stored;
}

export async function updateEmailServiceSettings(input: {
  service: string;
  apiKey?: string;
  apiUrl?: string;
  fromEmail: string;
  senderName?: string;
}): Promise<EmailServiceSettings> {
  await getAccessToken();

  const prev = readStored();
  const service = String(input.service || "none");
  const apiUrl = String(input.apiUrl || "");
  const fromEmail = String(input.fromEmail || "");
  const senderName = String(input.senderName || "");

  const next: StoredEmailServiceSettings = {
    service,
    apiUrl,
    fromEmail,
    senderName,
    apiKey: prev?.apiKey,
  };

  if (typeof input.apiKey === "string" && input.apiKey.trim()) {
    next.apiKey = input.apiKey.trim();
  }

  if (service !== "resend" && service !== "sendgrid") {
    next.apiKey = undefined;
  }

  if (service === "none") {
    writeStored(null);
    setEmailConfig(null);
    return toPublicSettings(null);
  }

  writeStored(next);

  const publicSettings = toPublicSettings(next);
  setEmailConfig({
    service: publicSettings.service,
    apiKey: next.apiKey,
    apiUrl: publicSettings.apiUrl,
    fromEmail: publicSettings.fromEmail,
  });
  return publicSettings;
}
