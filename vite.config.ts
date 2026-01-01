import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import type { ServerResponse } from "http";

import sitemapHandler from "./api/sitemap";
import sitemapArtistsHandler from "./api/sitemap-artists";
import sitemapEventsHandler from "./api/sitemap-events";
import sitemapPagesHandler from "./api/sitemap-pages";
import sitemapPostsHandler from "./api/sitemap-posts";
import sitemapReleasesHandler from "./api/sitemap-releases";
import sitemapVideosHandler from "./api/sitemap-videos";
import robotsHandler from "./api/robots";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), "VITE_");
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "string") process.env[k] = v;
  }

  return {
    plugins: [
      react(),
      {
        name: "local-seo-endpoints",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            try {
              const url = req.url || "/";
              const parsed = new URL(url, "http://local");
              const pathname = parsed.pathname;

              const routes: Record<string, any> = {
                "/sitemap.xml": sitemapHandler,
                "/sitemap-pages.xml": sitemapPagesHandler,
                "/sitemap-posts.xml": sitemapPostsHandler,
                "/sitemap-releases.xml": sitemapReleasesHandler,
                "/sitemap-events.xml": sitemapEventsHandler,
                "/sitemap-artists.xml": sitemapArtistsHandler,
                "/sitemap-videos.xml": sitemapVideosHandler,
                "/robots.txt": robotsHandler,

                "/api/sitemap": sitemapHandler,
                "/api/sitemap-pages": sitemapPagesHandler,
                "/api/sitemap-posts": sitemapPostsHandler,
                "/api/sitemap-releases": sitemapReleasesHandler,
                "/api/sitemap-events": sitemapEventsHandler,
                "/api/sitemap-artists": sitemapArtistsHandler,
                "/api/sitemap-videos": sitemapVideosHandler,
                "/api/robots": robotsHandler,
              };

              const handler = routes[pathname];
              if (!handler) return next();

              const headers: Record<string, string | string[] | undefined> = {};
              for (const [k, v] of Object.entries(req.headers || {})) {
                headers[k] = v as any;
              }

              const nodeRes = res as ServerResponse;
              const wrappedRes = {
                status(code: number) {
                  nodeRes.statusCode = code;
                  return wrappedRes;
                },
                setHeader(name: string, value: string) {
                  nodeRes.setHeader(name, value);
                },
                send(body: string) {
                  nodeRes.end(body);
                },
              };

              const query: Record<string, string | string[] | undefined> = {};
              parsed.searchParams.forEach((value, key) => {
                const existing = query[key];
                if (existing === undefined) query[key] = value;
                else if (Array.isArray(existing)) existing.push(value);
                else query[key] = [existing, value];
              });

              await handler(
                {
                  headers,
                  query,
                },
                wrappedRes
              );
            } catch (e) {
              next(e);
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    envDir: path.resolve(__dirname),
    envPrefix: "VITE_",
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      sourcemap: true,
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});