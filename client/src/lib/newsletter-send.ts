import { supabase } from "./supabase";
import { getEmailServiceSettingsForSending } from "./email-service-settings";

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

export async function sendNewsletterViaApi(args: {
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  const token = await getAccessToken();
  const emailService = await getEmailServiceSettingsForSending();

  const resp = await fetch("/api/newsletter-send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: args.to,
      subject: args.subject,
      html: args.html,
      emailService,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    throw new Error(data?.error || "Failed to send newsletter");
  }
}
