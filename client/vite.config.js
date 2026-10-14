import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { BRAND_CSS_PATH, readBrandColors } from './scripts/brand-tokens.mjs';

/** Cabeceras de seguridad de vercel.json, para probarlas igual en `npm run preview` */
function vercelSecurityHeaders() {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
  const rule = config.headers.find((h) => h.source === '/(.*)');
  return Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]));
}

/**
 * Reemplaza %BRAND_COLOR% en index.html (color de la barra del navegador en el celular)
 * con el color principal de src/theme/brand.css, para no repetirlo a mano.
 */
function brandThemeColor() {
  return {
    name: 'brand-theme-color',
    configureServer(server) {
      server.watcher.add(BRAND_CSS_PATH);
    },
    transformIndexHtml(html) {
      return html.replaceAll('%BRAND_COLOR%', readBrandColors().brand);
    },
  };
}

/**
 * SEO al publicar:
 *  - %SITE_URL% en index.html → URL pública (las vistas previas de WhatsApp/Facebook piden URL completas)
 *  - genera robots.txt: permite la tienda, oculta panel, cuenta y checkout, y apunta al mapa del sitio
 */
function seo(siteUrl) {
  return {
    name: 'abk-seo',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
    generateBundle() {
      const lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /cuenta',
        'Disallow: /checkout',
        'Disallow: /carrito',
        'Disallow: /pedido/',
        ...(siteUrl ? ['', `Sitemap: ${siteUrl}/sitemap.xml`] : []),
        '',
      ];
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: lines.join('\n') });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '');

  return {
    plugins: [react(), tailwindcss(), brandThemeColor(), seo(siteUrl)],
    // `npm run preview` sirve la versión publicada con las mismas cabeceras (CSP incluida) que Vercel
    preview: {
      port: 4173,
      headers: vercelSecurityHeaders(),
      proxy: { '/api': 'http://localhost:4000' },
    },
    server: {
      port: 5173,
      // En desarrollo, /api se reenvía al backend local. Así el navegador ve un solo dominio,
      // igual que en producción con el rewrite de vercel.json, y la cookie de sesión es de primera parte.
      proxy: {
        '/api': 'http://localhost:4000',
      },
    },
  };
});
