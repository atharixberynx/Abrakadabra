/**
 * Header de la tienda.
 *  - Fila 1: menú (celular), logo, buscador (escritorio), cuenta y carrito.
 *  - Fila 2 (escritorio): menú de categorías.
 *  - Si quien navega es admin, el header es morado con el logo de fondo morado,
 *    para distinguir de un vistazo que se está con la cuenta de administración.
 */
import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { store } from '../../config/store.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCategories } from '../../hooks/useCategories.js';
import { selectCartCount, useCartStore } from '../../store/cartStore.js';
import { MobileDrawer } from './MobileDrawer.jsx';
import { SearchForm } from './SearchForm.jsx';

/**
 * ¿El enlace del menú corresponde a la página actual? Compara la categoría y el filtro
 * "nuevos" de la URL (NavLink solo compara la ruta y marcaría todos como activos).
 */
function useIsCatalogLinkActive() {
  const location = useLocation();
  return (target) => {
    const [path, search = ''] = target.split('?');
    if (location.pathname !== path) return false;
    const current = new URLSearchParams(location.search);
    const wanted = new URLSearchParams(search);
    return ['categoria', 'nuevos'].every((key) => (current.get(key) ?? '') === (wanted.get(key) ?? ''));
  };
}

function AccountArea({ dark }) {
  const { status, user, isAdmin } = useAuth();
  const linkClass = `flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ${
    dark ? 'text-white hover:bg-white/10' : 'text-brand hover:bg-lavender'
  }`;

  if (status === 'loading') {
    return <span className={`hidden h-5 w-24 animate-pulse rounded md:block ${dark ? 'bg-white/20' : 'bg-lavender'}`} />;
  }

  if (status === 'anonymous') {
    return (
      <Link to="/iniciar-sesion" className={linkClass}>
        <UserRound className="size-5" aria-hidden="true" />
        {/* En el celular el texto no se ve, pero los lectores de pantalla lo leen */}
        <span className="sr-only md:not-sr-only">Ingresar</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* Bienvenida como texto, no como enlace */}
      <span className={`mr-1 hidden text-sm lg:inline ${dark ? 'text-white/85' : 'text-ink/80'}`}>
        Hola, {user.name.split(' ')[0]}
      </span>
      {isAdmin && (
        <Link
          to="/admin"
          className={`hidden rounded-full px-3 py-2 text-sm font-semibold md:inline-flex ${
            dark ? 'bg-gold text-brand-dark hover:brightness-95' : 'bg-lavender text-brand-dark'
          }`}
        >
          Panel admin
        </Link>
      )}
      <Link to="/cuenta" className={linkClass}>
        <UserRound className="size-5" aria-hidden="true" />
        <span className="sr-only md:not-sr-only">Mi cuenta</span>
      </Link>
    </div>
  );
}

function CartLink({ dark }) {
  const count = useCartStore(selectCartCount);
  return (
    <Link
      to="/carrito"
      className={`relative grid size-11 place-items-center rounded-full transition ${dark ? 'text-white hover:bg-white/10' : 'text-brand hover:bg-lavender'}`}
      aria-label={`Carrito, ${count} ${count === 1 ? 'prenda' : 'prendas'}`}
    >
      <ShoppingBag className="size-6" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-brand-dark">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const { isAdmin } = useAuth();
  const { categories } = useCategories();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const isActive = useIsCatalogLinkActive();

  const dark = isAdmin;
  const iconButton = `grid size-11 place-items-center rounded-full transition ${dark ? 'text-white hover:bg-white/10' : 'text-brand hover:bg-lavender'}`;
  const navLinkClass = (target) =>
    `relative block py-4 text-[15px] tracking-wide transition after:absolute after:inset-x-0 after:bottom-2.5 after:h-0.5 after:origin-left after:bg-gold after:transition-transform ${
      isActive(target) ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
    } ${dark ? 'text-white' : 'text-ink hover:text-brand'}`;

  return (
    <header className={`sticky top-0 z-40 ${dark ? 'bg-brand' : 'border-b border-lavender bg-white/95 backdrop-blur'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 md:h-24 md:gap-6">
        <button type="button" className={`${iconButton} -ml-2 md:hidden`} onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
          <Menu className="size-6" />
        </button>

        <Link to="/" aria-label={`${store.name}: ir al inicio`} className="shrink-0">
          <img
            src={dark ? store.logos.onPurple : store.logos.onWhite}
            alt={store.name}
            className="h-12 w-auto md:h-16"
          />
        </Link>

        <SearchForm className="mx-auto hidden w-full max-w-md md:block" />

        <div className="ml-auto flex items-center md:ml-0">
          <button
            type="button"
            className={`${iconButton} md:hidden`}
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? 'Cerrar buscador' : 'Buscar'}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="size-6" /> : <Search className="size-6" />}
          </button>
          <AccountArea dark={dark} />
          {/* La cuenta admin solo ve la tienda: no compra, así que no tiene carrito */}
          {!isAdmin && <CartLink dark={dark} />}
        </div>
      </div>

      {searchOpen && (
        <div className="px-4 pb-3 md:hidden">
          <SearchForm autoFocus onSubmitted={() => setSearchOpen(false)} />
        </div>
      )}

      <nav aria-label="Categorías" className={`hidden md:block ${dark ? 'border-t border-white/15' : 'border-t border-lavender'}`}>
        {/* En tablet las categorías no caben en una fila: se deslizan. Desde 1024 px van centradas */}
        <ul className="scrollbar-none relative mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 whitespace-nowrap lg:justify-center lg:gap-7">
          <li>
            <Link to="/catalogo?nuevos=1" className={navLinkClass('/catalogo?nuevos=1')}>Lo nuevo</Link>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                to={`/catalogo?categoria=${category.slug}`}
                className={navLinkClass(`/catalogo?categoria=${category.slug}`)}
              >
                {category.name}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/catalogo" className={navLinkClass('/catalogo')}>Ver todo</Link>
          </li>
        </ul>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
    </header>
  );
}
