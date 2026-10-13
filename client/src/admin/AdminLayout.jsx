/**
 * Estructura del panel administrativo: barra lateral morada (escritorio) o barra superior
 * con menú desplegable (celular). Usa la misma paleta que la tienda.
 */
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { store } from '../config/store.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Portal } from '../components/ui/Portal.jsx';
import { ADMIN_NAV } from './adminNav.js';

function NavItems({ onNavigate }) {
  return (
    <ul className="space-y-1">
      {ADMIN_NAV.map(({ to, label, icon: Icon, end, soon }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                isActive ? 'bg-white font-semibold text-brand-dark' : 'text-white/90 hover:bg-white/10'
              }`
            }
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {soon && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-brand-dark">Pronto</span>}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function SidebarFooter({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };
  return (
    <div className="space-y-1 border-t border-white/15 pt-4">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/90 hover:bg-white/10">
        <ExternalLink className="size-5" aria-hidden="true" /> Ver la tienda
      </Link>
      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10">
        <LogOut className="size-5" aria-hidden="true" /> Cerrar sesión
      </button>
      <p className="px-4 pt-2 text-xs text-white/75">Sesión: {user?.name}</p>
    </div>
  );
}

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Cierra el menú del celular al cambiar de página
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-lavender/50 lg:flex">
      {/* Escritorio: barra lateral fija */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-brand p-4 lg:flex">
        <Link to="/admin" className="mb-6 block px-2" aria-label="Panel administrativo">
          <img src={store.logos.onPurple} alt={store.name} className="mx-auto h-20 w-auto" />
        </Link>
        <nav aria-label="Panel administrativo" className="flex-1 overflow-y-auto">
          <NavItems />
        </nav>
        <SidebarFooter />
      </aside>

      {/* Celular: barra superior */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-brand px-3 lg:hidden">
        <button type="button" onClick={() => setMenuOpen(true)} className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Abrir menú del panel">
          <Menu className="size-6" />
        </button>
        <img src={store.logos.onPurple} alt={store.name} className="h-12 w-auto" />
        <span className="w-11" />
      </header>

      <Portal>
        <div className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`} {...(!menuOpen && { inert: '' })}>
          <div className={`absolute inset-0 bg-ink/40 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú del panel"
            className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-brand p-4 transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <img src={store.logos.onPurple} alt={store.name} className="h-14 w-auto" />
              <button type="button" onClick={() => setMenuOpen(false)} className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Cerrar menú">
                <X className="size-6" />
              </button>
            </div>
            <nav aria-label="Panel administrativo" className="flex-1 overflow-y-auto">
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </nav>
            <SidebarFooter onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      </Portal>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
