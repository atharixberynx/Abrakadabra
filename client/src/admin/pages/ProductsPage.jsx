/**
 * Panel › Productos: tabla con búsqueda y filtros, visibilidad en la tienda,
 * editar, ver en la tienda y eliminar.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { useFetch, clearFetchCache } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { apiFetch } from '../../lib/api.js';
import { formatPrice } from '../../lib/format.js';
import { imageUrl } from '../../lib/images.js';
import { confirmDialog, toast } from '../../store/uiStore.js';
import { CloudinaryWarning, ErrorState, LoadingState, PageHeader } from '../components/AdminUi.jsx';

const selectClass =
  'h-11 rounded-xl border border-brand/20 bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none';

function StockBadge({ product }) {
  if (!product.inStock) return <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">Agotado</span>;
  if (product.lowStock) {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <span className="rounded-full bg-lavender px-2.5 py-1 text-xs font-semibold text-brand-dark">{product.totalStock} unidades</span>
        <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[11px] font-medium text-brand-dark" title="Algunas combinaciones de color y talla tienen 1 o 2 unidades">
          Pocas en algunas tallas
        </span>
      </span>
    );
  }
  return <span className="rounded-full bg-lavender px-2.5 py-1 text-xs font-semibold text-brand-dark">{product.totalStock} unidades</span>;
}

function Thumb({ product }) {
  return (
    <div className="aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-lg bg-lavender">
      {product.image && <img src={imageUrl(product.image, 120)} alt="" className="size-full object-cover" />}
    </div>
  );
}

function ColorDots({ colors }) {
  return (
    <span className="mt-1 flex gap-1" aria-label={`Colores: ${colors.map((c) => c.name).join(', ')}`}>
      {colors.slice(0, 6).map((c) => (
        <span key={c.key} title={c.name} className="size-3.5 rounded-full border border-ink/15" style={{ backgroundColor: c.hex }} />
      ))}
    </span>
  );
}

export default function ProductsPage() {
  usePageTitle('Productos · Panel');
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const { data: categoriesData } = useFetch('/admin/categories', { cache: false });

  const query = new URLSearchParams();
  for (const key of ['q', 'categoria', 'estado', 'stock', 'page']) {
    if (params.get(key)) query.set(key, params.get(key));
  }
  const { data, loading, error, reload } = useFetch(`/admin/products?${query}`, { cache: false });

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  // La búsqueda se aplica 300 ms después de dejar de escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((params.get('q') ?? '') !== search.trim()) setFilter('q', search.trim());
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleActive = async (product) => {
    try {
      await apiFetch(`/admin/products/${product.id}/status`, { method: 'PATCH', body: { active: !product.active } });
      clearFetchCache();
      toast.success(product.active ? `"${product.name}" ya no se muestra en la tienda` : `"${product.name}" ahora se muestra en la tienda`);
      reload({ silent: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (product) => {
    const ok = await confirmDialog({
      title: `¿Eliminar "${product.name}"?`,
      message:
        'Se borrarán el producto y todas sus fotos. Esta acción no se puede deshacer. Si solo quieres ocultarlo por un tiempo, apaga "Visible".',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/admin/products/${product.id}`, { method: 'DELETE' });
      clearFetchCache();
      toast.success('Producto eliminado');
      reload({ silent: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const categories = categoriesData?.categories ?? [];
  const items = data?.items ?? [];
  const page = data?.page ?? 1;

  return (
    <>
      <PageHeader
        title="Productos"
        description={data ? `${data.total} ${data.total === 1 ? 'producto' : 'productos'}` : undefined}
        actions={
          <Button as={Link} to="/admin/productos/nuevo">
            <Plus className="size-4" /> Nuevo producto
          </Button>
        }
      />
      <CloudinaryWarning />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">Buscar productos</span>
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/60" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o color…"
            className={`${selectClass} w-full pl-9`}
          />
        </label>
        <select aria-label="Filtrar por categoría" value={params.get('categoria') ?? ''} onChange={(e) => setFilter('categoria', e.target.value)} className={selectClass}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select aria-label="Filtrar por estado" value={params.get('estado') ?? ''} onChange={(e) => setFilter('estado', e.target.value)} className={selectClass}>
          <option value="">Visibles y ocultos</option>
          <option value="activos">Solo visibles</option>
          <option value="inactivos">Solo ocultos</option>
        </select>
        <select aria-label="Filtrar por existencias" value={params.get('stock') ?? ''} onChange={(e) => setFilter('stock', e.target.value)} className={selectClass}>
          <option value="">Todas las existencias</option>
          <option value="bajo">Poco stock (1 o 2)</option>
          <option value="agotado">Agotados</option>
        </select>
      </div>

      {loading && !data ? (
        <LoadingState message="Cargando productos…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <div className="rounded-card bg-white p-10 text-center shadow-soft">
          <p className="font-display text-xl text-brand-dark">No hay productos con estos filtros</p>
          <p className="mt-1 text-sm text-ink/80">Cambia la búsqueda o crea un producto nuevo.</p>
        </div>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className="hidden overflow-hidden rounded-card bg-white shadow-soft md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-lavender bg-lavender/60 text-xs uppercase tracking-wider text-ink/80">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Existencias</th>
                  <th className="px-4 py-3 font-semibold">Visible</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender">
                {items.map((p) => (
                  <tr key={p.id} className={p.active ? '' : 'bg-ink/[0.03]'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb product={p} />
                        <div className="min-w-0">
                          <Link to={`/admin/productos/${p.id}`} className="font-medium text-ink hover:text-brand">{p.name}</Link>
                          <ColorDots colors={p.colors} />
                          {(p.isNewArrival || p.isFeatured) && (
                            <p className="mt-1 text-xs text-ink/70">
                              {[p.isNewArrival && 'Nuevo', p.isFeatured && 'Destacado'].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/85">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-brand">{formatPrice(p.price)}</span>
                      {p.compareAtPrice && <s className="ml-1.5 text-xs text-ink/70">{formatPrice(p.compareAtPrice)}</s>}
                    </td>
                    <td className="px-4 py-3"><StockBadge product={p} /></td>
                    <td className="px-4 py-3">
                      <Switch checked={p.active} onChange={() => toggleActive(p)} label={`Mostrar "${p.name}" en la tienda`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/productos/${p.id}`} className="grid size-9 place-items-center rounded-full text-brand hover:bg-lavender" aria-label={`Editar ${p.name}`} title="Editar">
                          <Pencil className="size-4" />
                        </Link>
                        <Link to={`/producto/${p.slug}`} className="grid size-9 place-items-center rounded-full text-brand hover:bg-lavender" aria-label={`Ver ${p.name} en la tienda`} title="Ver en la tienda">
                          <Eye className="size-4" />
                        </Link>
                        <button type="button" onClick={() => remove(p)} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger-soft" aria-label={`Eliminar ${p.name}`} title="Eliminar">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: tarjetas */}
          <ul className="space-y-3 md:hidden">
            {items.map((p) => (
              <li key={p.id} className="rounded-card bg-white p-4 shadow-soft">
                <div className="flex gap-3">
                  <Thumb product={p} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/productos/${p.id}`} className="font-medium text-ink">{p.name}</Link>
                    <p className="text-xs text-ink/70">{p.category?.name}</p>
                    <p className="mt-1 text-sm font-semibold text-brand">{formatPrice(p.price)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StockBadge product={p} />
                  <Switch checked={p.active} onChange={() => toggleActive(p)} label="Visible" showLabel size="sm" />
                </div>
                <div className="mt-3 flex gap-2 border-t border-lavender pt-3">
                  <Button as={Link} to={`/admin/productos/${p.id}`} variant="secondary" size="sm" className="flex-1">
                    <Pencil className="size-4" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(p)} className="text-danger" aria-label={`Eliminar ${p.name}`}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {data.totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Paginación">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setFilter('page', String(page - 1))}>
                <ChevronLeft className="size-4" /> Anterior
              </Button>
              <span className="text-sm text-ink/80">Página {page} de {data.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setFilter('page', String(page + 1))}>
                Siguiente <ChevronRight className="size-4" />
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
