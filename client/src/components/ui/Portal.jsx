/**
 * Dibuja su contenido directamente en <body>, fuera del árbol visual de la página.
 *
 * Úsalo para capas que deben cubrir toda la pantalla (menús laterales, visores, hojas):
 * si se dibujan dentro de un elemento con `backdrop-filter`, `transform` o `position: sticky`,
 * ese elemento las "encierra" (quedan del tamaño del header o detrás de él aunque tengan
 * un z-index mayor).
 */
import { createPortal } from 'react-dom';

export function Portal({ children }) {
  return createPortal(children, document.body);
}
