import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // En desarrollo, /api se reenvía al backend local. Así el navegador ve un solo dominio,
    // igual que en producción con el rewrite de vercel.json, y la cookie de sesión es de primera parte.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
