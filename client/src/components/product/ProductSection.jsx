/**
 * Sección de productos de la página de inicio ("Lo nuevo", "Palazzos"…):
 * título a la izquierda y "Ver todo >" a la derecha.
 * En el celular los productos se deslizan de lado; en escritorio, cuadrícula de 4.
 */
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import { StarIcon } from '../ui/StarIcon.jsx';
import { StoreLoader } from '../ui/StoreLoader.jsx';
import { ProductCard, ProductCardSkeleton } from './ProductCard.jsx';

export function SectionHeader({ title, subtitle, to, linkLabel = 'Ver todo' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-2xl text-brand-dark sm:text-3xl">
          {title} <StarIcon className="size-4 text-gold" />
        </h2>
        {subtitle && <p className="mt-1 text-sm text-ink/80">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-brand hover:text-brand-dark">
          {linkLabel} <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

const ROW = 'scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0';
const ITEM = 'w-[44%] shrink-0 snap-start sm:w-[30%] md:w-auto';

/** `query`: filtros para /products (p. ej. "nuevos=1&limit=8"), o `path`: ruta completa de la API */
export function ProductSection({ title, subtitle, query, path, to, className = '' }) {
  const { data, loading, error, slow, reload } = useFetch(path ?? `/products?${query}`);
  const products = data?.items ?? [];

  if (!loading && !error && products.length === 0) return null;

  return (
    <section className={`mx-auto max-w-7xl px-4 ${className}`}>
      <SectionHeader title={title} subtitle={subtitle} to={to} />
      {loading && slow ? (
        <StoreLoader slow />
      ) : loading ? (
        <div className={ROW} aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={ITEM}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-card bg-lavender p-6 text-center text-sm">
          <p className="text-ink/80">{error.message}</p>
          <button type="button" onClick={reload} className="mt-2 font-medium text-brand underline">
            Reintentar
          </button>
        </div>
      ) : (
        <ul className={ROW}>
          {products.map((product) => (
            <li key={product.id} className={ITEM}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
