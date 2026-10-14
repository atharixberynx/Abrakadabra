/**
 * Menú lateral del celular con navegación por niveles (como ADOC):
 * nivel principal → "Categorías" abre un segundo nivel con "← Volver".
 * Se cierra con la X, tocando fuera, con Escape o al navegar.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageCircle, X } from 'lucide-react';
import { store } from '../../config/store.js';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCategories } from '../../hooks/useCategories.js';
import { Portal } from '../ui/Portal.jsx';
import { StarIcon } from '../ui/StarIcon.jsx';

const itemClass =
  'flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-base text-ink transition hover:bg-lavender';

export function MobileDrawer({ open, onClose }) {
  const [level, setLevel] = useState('main');
  const { categories } = useCategories();
  const { status, user, isAdmin } = useAuth();
  const { whatsappUrl } = useStoreInfo();
  const panelRef = useRef(null);

  // Cada vez que se abre, empieza en el primer nivel
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setLevel('main');
  }

  // Al abrir: bloquea el scroll de fondo y enfoca el panel
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <Portal>
      <div
        className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`}
        // Cerrado: nada de adentro se puede enfocar con el teclado
        {...(!open && { inert: '' })}
      >
        <div
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          tabIndex={-1}
          className={`absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 focus:outline-none ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-lavender px-4 py-3">
            {level === 'main' ? (
              <img src={store.logos.onWhite} alt={store.name} className="h-12 w-auto" />
            ) : (
              <button type="button" onClick={() => setLevel('main')} className="flex items-center gap-1 py-2 font-medium text-brand">
                <ChevronLeft className="size-5" /> Volver
              </button>
            )}
            <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-lavender" aria-label="Cerrar menú">
              <X className="size-6 text-ink" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            {level === 'main' ? (
              <ul className="space-y-1">
                {status === 'authenticated' && (
                  <li className="px-4 pt-2 pb-3 font-display text-lg text-brand-dark">
                    Hola, {user.name.split(' ')[0]}
                  </li>
                )}
                <li>
                  <Link to="/" onClick={onClose} className={itemClass}>Inicio</Link>
                </li>
                <li>
                  <Link to="/catalogo?nuevos=1" onClick={onClose} className={itemClass}>
                    <span className="flex items-center gap-2">Lo nuevo <StarIcon className="size-3.5 text-gold" /></span>
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={() => setLevel('categories')} className={itemClass}>
                    Categorías <ChevronRight className="size-5 text-brand-soft" />
                  </button>
                </li>
                <li>
                  <Link to="/catalogo" onClick={onClose} className={itemClass}>Ver todo el catálogo</Link>
                </li>
                <li className="my-2 border-t border-lavender" />
                <li>
                  <Link to={status === 'authenticated' ? '/cuenta' : '/iniciar-sesion'} onClick={onClose} className={itemClass}>
                    {status === 'authenticated' ? 'Mi cuenta' : 'Iniciar sesión'}
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin" onClick={onClose} className={itemClass}>Panel admin</Link>
                  </li>
                )}
                <li>
                  <Link to="/#visitanos" onClick={onClose} className={itemClass}>Visítanos</Link>
                </li>
                <li className="my-2 border-t border-lavender" />
                <li><Link to="/retiro-en-tienda" onClick={onClose} className={itemClass}>Retiro en tienda</Link></li>
                <li><Link to="/guia-de-tallas" onClick={onClose} className={itemClass}>Guía de tallas</Link></li>
                <li><Link to="/preguntas-frecuentes" onClick={onClose} className={itemClass}>Preguntas frecuentes</Link></li>
              </ul>
            ) : (
              <ul className="space-y-1">
                <li className="px-4 pt-2 pb-3 font-display text-lg text-brand-dark">Categorías</li>
                <li>
                  <Link to="/catalogo" onClick={onClose} className={itemClass}>Todas las prendas</Link>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link to={`/catalogo?categoria=${category.slug}`} onClick={onClose} className={itemClass}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </nav>

          <div className="border-t border-lavender p-4">
            <a
              href={whatsappUrl('Hola, tengo una consulta sobre la tienda.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-brand py-3 text-sm font-medium text-brand"
            >
              <MessageCircle className="size-4" /> Escríbenos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Portal>
  );
}
