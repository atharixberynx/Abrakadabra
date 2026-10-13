/**
 * Estructura de la tienda pública: barra de anuncio, header y footer.
 * Versión básica de la Fase 2; en la Fase 3 se agregan el menú de categorías,
 * el buscador, el carrito, el cajón móvil y el footer completo.
 */
import { Link, Outlet } from 'react-router-dom';
import { store } from '../../config/store.js';
import { useAuth } from '../../context/AuthContext.jsx';

function AccountLink() {
  const { status, user, isAdmin } = useAuth();

  if (status === 'loading') return <span className="h-5 w-24 animate-pulse rounded bg-lavender" />;

  if (status === 'anonymous') {
    return (
      <Link to="/iniciar-sesion" className="text-sm font-medium text-brand hover:text-brand-dark">
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm font-medium">
      {isAdmin && (
        <Link to="/admin" className="text-brand-soft hover:text-brand-dark">
          Panel admin
        </Link>
      )}
      <Link to="/cuenta" className="text-brand hover:text-brand-dark">
        Hola, {user.name.split(' ')[0]}
      </Link>
    </div>
  );
}

export function StoreLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bg-brand px-4 py-2 text-center text-xs tracking-wider text-white sm:text-sm">
        {store.announcements[0]} <span aria-hidden="true">·</span> {store.announcements[1]}
      </div>

      <header className="border-b border-lavender bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label={`${store.name}: ir al inicio`}>
            <img src={store.logos.onWhite} alt={store.name} className="h-14 w-auto" />
          </Link>
          <AccountLink />
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="bg-brand px-4 py-10 text-center text-white">
        <img src={store.logos.onPurple} alt={store.name} className="mx-auto h-24 w-auto" />
        <p className="mt-4 text-sm text-white/85">{store.fullAddress}</p>
      </footer>
    </div>
  );
}
