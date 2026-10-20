/**
 * Panel › Pedidos: lista con filtros por estado, tipo de entrega, fechas y búsqueda.
 * Los filtros viven en la URL para poder volver atrás sin perderlos.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { formatPrice } from '../../lib/format.js';
import { formatShortDate } from '../../lib/orders.js';
import { AdminStatusBadge, DeliveryBadge } from '../components/AdminStatusBadge.jsx';
import { ErrorState, LoadingState, PageHeader } from '../components/AdminUi.jsx';

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'pendientes', label: 'Pendientes de entregar' },
  { value: 'pagado', label: 'Por preparar' },
  { value: 'listo_para_retiro', label: 'Listos para retiro' },
  { value: 'enviado', label: 'En camino' },
  { value: 'entregado', label: 'Entregados' },
  { value: 'cancelado', label: 'Cancelados' },
  { value: 'pago_rechazado', label: 'Pagos rechazados' },
];

const fieldClass = 'h-11 rounded-xl border border-brand/20 bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none';

export default function OrdersPage() {
  usePageTitle('Pedidos · Panel');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');

  const query = new URLSearchParams();
  for (const key of ['estado', 'entrega', 'desde', 'hasta', 'q', 'page']) if (params.get(key)) query.set(key, params.get(key));
  const { data, loading, error, reload } = useFetch(`/admin/orders?${query}`, { cache: false });

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

  const estado = params.get('estado') ?? '';
  const items = data?.items ?? [];
  const page = data?.page ?? 1;
  const hasFilters = ['estado', 'entrega', 'desde', 'hasta', 'q'].some((k) => params.get(k));

  return (
    <>
      <PageHeader title="Pedidos" description={data ? `${data.total} ${data.total === 1 ? 'pedido' : 'pedidos'}` : undefined} />

      <div className="scrollbar-none relative -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por estado">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'todos'}
            type="button"
            aria-pressed={estado === tab.value}
            onClick={() => setFilter('estado', tab.value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
              estado === tab.value ? 'border-brand bg-brand text-white' : 'border-brand/20 bg-white text-ink hover:border-brand'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">Buscar pedidos</span>
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/60" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Número de pedido, nombre o correo…" className={`${fieldClass} w-full pl-9`} />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          Entrega
          <select value={params.get('entrega') ?? ''} onChange={(e) => setFilter('entrega', e.target.value)} className={`${fieldClass} flex-1`}>
            <option value="">Todas</option>
            <option value="retiro">Retiro en tienda</option>
            <option value="envio">Envío a domicilio</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          Desde
          <input type="date" value={params.get('desde') ?? ''} onChange={(e) => setFilter('desde', e.target.value)} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          Hasta
          <input type="date" value={params.get('hasta') ?? ''} onChange={(e) => setFilter('hasta', e.target.value)} className={fieldClass} />
        </label>
      </div>
      {hasFilters && (
        <button type="button" onClick={() => { setSearch(''); setParams({}, { replace: true }); }} className="mb-4 text-sm font-medium text-brand underline-offset-4 hover:underline">
          Quitar filtros
        </button>
      )}

      {loading && !data ? (
        <LoadingState message="Cargando pedidos…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <div className="rounded-card bg-white p-10 text-center shadow-soft">
          <p className="font-display text-xl text-brand-dark">{hasFilters ? 'No hay pedidos con estos filtros' : 'Todavía no hay pedidos'}</p>
          <p className="mt-1 text-sm text-ink/80">Los pedidos aparecen aquí en cuanto una clienta paga.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-card bg-white shadow-soft md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-lavender bg-lavender/60 text-xs uppercase tracking-wider text-ink/80">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pedido</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Clienta</th>
                  <th className="px-4 py-3 font-semibold">Entrega</th>
                  <th className="px-4 py-3 text-right font-semibold">Prendas</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender">
                {items.map((o) => (
                  // Toda la fila abre el detalle (el número sigue siendo un enlace para teclado y lectores)
                  <tr key={o.id} onClick={() => navigate(`/admin/pedidos/${o.id}`)} className="cursor-pointer hover:bg-lavender/40">
                    <td className="px-4 py-3">
                      <Link to={`/admin/pedidos/${o.id}`} className="font-semibold text-brand hover:text-brand-dark">{o.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-ink/85">{formatShortDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-ink">{o.customer.name}</p>
                      <p className="text-xs text-ink/70">{o.customer.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <DeliveryBadge method={o.deliveryMethod} short />
                      {o.department && <p className="text-xs text-ink/70">{o.department}</p>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{o.pieces}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3"><AdminStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((o) => (
              <li key={o.id}>
                <Link to={`/admin/pedidos/${o.id}`} className="block rounded-card bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-brand">{o.orderNumber}</span>
                    <AdminStatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 flex items-center justify-between gap-2 text-sm text-ink">
                    {o.customer.name}
                    <span className="text-xs"><DeliveryBadge method={o.deliveryMethod} short /></span>
                  </p>
                  <p className="text-xs text-ink/70">{formatShortDate(o.createdAt)} · {o.pieces} {o.pieces === 1 ? 'prenda' : 'prendas'} · {formatPrice(o.total)}</p>
                </Link>
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
