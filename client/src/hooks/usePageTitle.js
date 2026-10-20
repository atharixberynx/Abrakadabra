/**
 * Título y descripción de cada página (pestaña del navegador, Google y vistas previas
 * al compartir en WhatsApp o Facebook).
 *
 *   usePageTitle('Palazo de vestir', { description: 'Palazo de tiro alto…', image: urlDeLaFoto });
 */
import { useEffect } from 'react';
import { store } from '../config/store.js';

const DEFAULT_DESCRIPTION =
  'Moda femenina casual chic y de oficina, tallas S a XL, varios colores por modelo y precios accesibles. Compra en línea con envío a todo El Salvador o retiro en tienda.';

function setMeta(attribute, key, content) {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/** Convierte rutas relativas (/brand/og-image.png) en URL completas, como piden las redes */
const absolute = (url) => (url && url.startsWith('/') ? `${window.location.origin}${url}` : url);

export function usePageTitle(title, { description, image } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${store.name}` : `${store.name} · Moda femenina en El Salvador`;
    const text = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim().slice(0, 160);
    document.title = fullTitle;
    setMeta('name', 'description', text);
    setMeta('property', 'og:title', title || store.name);
    setMeta('property', 'og:description', text);
    setMeta('property', 'og:url', window.location.href.split('#')[0]);
    setMeta('property', 'og:image', absolute(image || '/brand/og-image.png'));
  }, [title, description, image]);
}
