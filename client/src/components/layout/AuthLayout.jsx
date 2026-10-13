/**
 * Diseño de las pantallas de inicio de sesión y registro:
 * panel morado con el logo (arriba en móvil, a la izquierda en escritorio) y el formulario.
 */
import { Link } from 'react-router-dom';
import { store } from '../../config/store.js';
import { StarIcon } from '../ui/StarIcon.jsx';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex flex-col items-center justify-center bg-brand px-6 py-8 text-center text-white md:w-5/12 md:py-12">
        <Link to="/" aria-label={`${store.name}: ir al inicio`}>
          <img src={store.logos.onPurple} alt={store.name} className="h-24 w-auto md:h-44" />
        </Link>
        <p className="mt-4 hidden font-display text-xl font-light md:block">{store.slogan}</p>
        <ul className="mt-8 hidden space-y-3 text-left text-sm text-white/90 md:block">
          {store.benefits.map((benefit) => (
            <li key={benefit.title} className="flex items-center gap-3">
              <StarIcon className="size-3.5 text-gold" />
              {benefit.title}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-1 items-start justify-center px-4 py-10 md:items-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl text-brand-dark">{title}</h1>
          {subtitle && <p className="mt-2 text-ink/80">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          <p className="mt-10 text-center text-sm">
            <Link to="/" className="text-brand underline-offset-4 hover:underline">
              ← Volver a la tienda
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
