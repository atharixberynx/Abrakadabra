/**
 * Estructura de la tienda pública: barra de anuncio, header, contenido y footer.
 */
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { AnnouncementBar } from './AnnouncementBar.jsx';
import { Footer } from './Footer.jsx';
import { Header } from './Header.jsx';

export function StoreLayout() {
  const { isAdmin } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-full bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      {/* Con cuenta admin el header es morado: la barra va más oscura para separarlos */}
      <AnnouncementBar className={isAdmin ? 'bg-brand-dark' : 'bg-brand'} />
      <Header />
      <div id="contenido" className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
