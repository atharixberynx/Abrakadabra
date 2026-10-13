/**
 * Catálogo con filtros, orden, búsqueda y "Cargar más".
 * Los filtros viven en la URL (?categoria=palazzos&talla=XL) para poder compartir el enlace.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { FiltersPanel } from '../components/catalog/FiltersPanel.jsx';
import { findPriceRange } from '../components/catalog/priceRanges.js';
import { ProductGrid, ProductGridSkeleton } from '../components/product/ProductGrid.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StarIcon } from '../components/ui/StarIcon.jsx';
import { StoreLoader } from '../components/ui/StoreLoader.jsx';
import { useCategories } from '../hooks/useCategories.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useProductList } from '../hooks/useProductList.js';

const SORTS = [
  { value: 'nuevos', label: 'Más nuevos' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
];

const LIST_KEYS = ['talla', 'color'];

/** Lee los filtros de la URL */
function readFilters(params) {
  return {
    categoria: params.get('categoria') ?? '',
    talla: params.getAll('talla'),
    color: params.getAll('color'),
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    q: params.get('q') ?? '',
    orden: params.get('orden') ?? 'nuevos',
    nuevos: params.get('nuevos') === '1',
  };
}

/** Consulta para la API con solo los filtros conocidos y con valor */
function toApiQuery(filters) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (LIST_KEYS.includes(key)) value.forEach((v) => query.append(key, v));
    else if (key === 'nuevos') value && query.set('nuevos', '1');
    else if (value) query.set(key, value);
  }
  return query.toString();
}

function FilterChip({ label, onRemove }) {
  return (
    <li>
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center gap-1.5 rounded-full bg-lavender py-1.5 pr-2.5 pl-3.5 text-sm text-brand-dark hover:bg-brand hover:text-white"
        aria-label={`Quitar filtro ${label}`}
      >
        {label} <X className="size-3.5" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const apiQuery = toApiQuery(filters);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { categories } = useCategories();
  const { data: options } = useFetch(`/products/filters${filters.categoria ? `?categoria=${filters.categoria}` : ''}`);
  const { items, total, loading, error, slow, hasMore, loadMore } = useProductList(apiQuery);

  const category = categories.find((c) => c.slug === filters.categoria);
  const title = filters.q
    ? `Resultados para “${filters.q}”`
    : filters.nuevos && !category
      ? 'Lo nuevo'
      : (category?.name ?? 'Catálogo');
  usePageTitle(title);

  /** Aplica cambios a los filtros de la URL (un valor vacío quita el filtro) */
  const updateFilters = (changes) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      next.delete(key);
      if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
      else if (value) next.set(key, value);
    }
    setParams(next);
  };

  const clearFilters = () => setParams(filters.orden !== 'nuevos' ? { orden: filters.orden } : {});

  // Bloquea el scroll de fondo con la hoja de filtros abierta (celular)
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  const priceRange = findPriceRange(filters.min, filters.max);
  const chips = [
    filters.q && { label: `“${filters.q}”`, remove: { q: '' } },
    category && { label: category.name, remove: { categoria: '' } },
    filters.nuevos && { label: 'Lo nuevo', remove: { nuevos: '' } },
    ...filters.talla.map((t) => ({ label: `Talla ${t}`, remove: { talla: filters.talla.filter((x) => x !== t) } })),
    ...filters.color.map((c) => ({ label: c, remove: { color: filters.color.filter((x) => x !== c) } })),
    (filters.min || filters.max) && {
      label: priceRange?.label ?? `$${filters.min || 0} a $${filters.max || '…'}`,
      remove: { min: '', max: '' },
    },
  ].filter(Boolean);
  const activeCount = chips.length;

  const panel = (
    <FiltersPanel filters={filters} options={options} categories={categories} onChange={updateFilters} />
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Ruta de navegación" className="mb-3 text-sm text-ink/70">
        <Link to="/" className="hover:text-brand">Inicio</Link>
        <span aria-hidden="true"> / </span>
        {category ? (
          <>
            <Link to="/catalogo" className="hover:text-brand">Catálogo</Link>
            <span aria-hidden="true"> / </span>
            <span className="text-ink">{category.name}</span>
          </>
        ) : (
          <span className="text-ink">Catálogo</span>
        )}
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl text-brand-dark sm:text-4xl">
            {title} <StarIcon className="size-5 text-gold" />
          </h1>
          {!loading && (
            <p className="mt-1 text-sm text-ink/70" aria-live="polite">
              {total} {total === 1 ? 'prenda' : 'prendas'}
            </p>
          )}
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal className="size-4" />
            Filtrar{activeCount > 0 && ` (${activeCount})`}
          </Button>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-ink/80 sm:inline">Ordenar:</span>
            <select
              value={filters.orden}
              onChange={(e) => updateFilters({ orden: e.target.value === 'nuevos' ? '' : e.target.value })}
              className="h-9 rounded-full border border-brand/25 bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none"
              aria-label="Ordenar productos"
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>{sort.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mb-6 flex flex-wrap items-center gap-2" aria-label="Filtros activos">
          {chips.map((c) => (
            <FilterChip key={c.label} label={c.label} onRemove={() => updateFilters(c.remove)} />
          ))}
          <li>
            <button type="button" onClick={clearFilters} className="px-2 text-sm font-medium text-brand underline-offset-4 hover:underline">
              Limpiar filtros
            </button>
          </li>
        </ul>
      )}

      <div className="flex gap-10">
        <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filtros">
          {panel}
        </aside>

        <section className="min-w-0 flex-1" aria-label="Productos">
          {loading && items.length === 0 ? (
            slow ? <StoreLoader slow /> : <ProductGridSkeleton />
          ) : error && items.length === 0 ? (
            <div className="rounded-card bg-lavender p-8 text-center">
              <p className="text-ink/80">{error.message}</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-card bg-lavender px-6 py-14 text-center">
              <StarIcon className="mx-auto size-6 text-gold" />
              <p className="mt-3 font-display text-xl text-brand-dark">No encontramos prendas con estos filtros</p>
              <p className="mt-1 text-sm text-ink/80">Prueba con otra talla, color o categoría.</p>
              <Button size="sm" className="mt-6" onClick={clearFilters}>Limpiar filtros</Button>
            </div>
          ) : (
            <>
              <ProductGrid products={items} />
              {hasMore && (
                <div className="mt-10 text-center">
                  <Button variant="secondary" onClick={loadMore} disabled={loading}>
                    {loading ? 'Cargando…' : 'Cargar más'}
                  </Button>
                  <p className="mt-2 text-xs text-ink/70">
                    Mostrando {items.length} de {total}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Hoja de filtros (celular) */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sheetOpen ? '' : 'pointer-events-none'}`} {...(!sheetOpen && { inert: '' })}>
        <div className={`absolute inset-0 bg-ink/40 transition-opacity ${sheetOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSheetOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white transition-transform duration-300 ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
        >
          <div className="flex items-center justify-between border-b border-lavender px-5 py-4">
            <h2 className="text-xl text-brand-dark">Filtros</h2>
            <button type="button" onClick={() => setSheetOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-lavender" aria-label="Cerrar filtros">
              <X className="size-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{panel}</div>
          <div className="flex gap-3 border-t border-lavender p-4">
            <Button variant="secondary" className="flex-1" onClick={clearFilters} disabled={activeCount === 0}>
              Limpiar
            </Button>
            <Button className="flex-[2]" onClick={() => setSheetOpen(false)}>
              {loading ? 'Buscando…' : `Ver ${total} ${total === 1 ? 'prenda' : 'prendas'}`}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
