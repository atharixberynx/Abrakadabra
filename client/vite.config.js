import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { BRAND_CSS_PATH, readBrandColors } from './scripts/brand-tokens.mjs';

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

export default defineConfig({
  plugins: [react(), tailwindcss(), brandThemeColor()],
  server: {
    port: 5173,
    // En desarrollo, /api se reenvía al backend local. Así el navegador ve un solo dominio,
    // igual que en producción con el rewrite de vercel.json, y la cookie de sesión es de primera parte.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
