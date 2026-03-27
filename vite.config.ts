import { defineConfig } from 'vite';

/**
 * GitHub Pages project sites are served at `https://<user>.github.io/<repo>/`.
 * Set `VITE_BASE=/<repo>/` when building for Pages (see `.github/workflows/deploy-pages.yml`).
 * Local dev uses `/` by default.
 */
function normalizeBase(raw: string | undefined): string {
  if (!raw || raw === '/') {
    return '/';
  }
  let b = raw.trim();
  if (!b.startsWith('/')) {
    b = `/${b}`;
  }
  if (!b.endsWith('/')) {
    b = `${b}/`;
  }
  return b;
}

export default defineConfig({
  base: normalizeBase(process.env.VITE_BASE),
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: true,
  },
});
