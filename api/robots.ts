type Req = {
  headers: Record<string, string | string[] | undefined>;
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

export default async function handler(req: Req, res: Res) {
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader(req.headers["x-forwarded-proto"]) || "https";
  const baseUrl = `${proto}://${host}`;

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");

  res.status(200);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(body);
}
