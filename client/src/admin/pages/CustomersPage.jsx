/**
 * Panel › Clientas (solo lectura): lista con búsqueda y detalle con sus pedidos.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { formatPrice } from '../../lib/format.js';
import { formatDate, formatShortDate } from '../../lib/orders.js';
import { AdminStatusBadge } from '../components/AdminStatusBadge.jsx';
import { Card, ErrorState, LoadingState, PageHeader } from '../components/AdminUi.jsx';

const dateOnly = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' });

export function CustomersPage() {
  usePageTitle('Clientas · Panel');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const query = new URLSearchParams();
  for (const key of ['q', 'page']) if (params.get(key)) query.set(key, params.get(key));
  const { data, loading, error, reload } = useFetch(`/admin/customers?${query}`, { cache: false });

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = search.trim();
      if ((params.get('q') ?? '') !== q) setParams(q ? { q } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, params, setParams]);

  const page = data?.page ?? 1;
  const goToPage = (p) => setParams({ ...(params.get('q') && { q: params.get('q') }), page: String(p) }, { replace: true });

  return (
    <>
      <PageHeader title="Clientas" description={data ? `${data.total} ${data.total === 1 ? 'cuenta registrada' : 'cuentas registradas'}` : undefined} />
      <label className="relative mb-5 block max-w-md">
        <span className="sr-only">Buscar clientas</span>
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/60" aria-hidden="true" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, correo o teléfono…" className="h-11 w-full rounded-xl border border-brand/20 bg-white pr-3 pl-9 text-sm focus:border-brand focus:outline-none" />
      </label>

      {loading && !data ? (
        <LoadingState message="Cargando clientas…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <p className="rounded-card bg-white p-10 text-center text-ink/80 shadow-soft">No hay clientas con esa búsqueda.</p>
      ) : (
        <>
          <ul className="grid gap-3 md:hidden">
            {data.items.map((c) => (
              <li key={c.id}>
                <Link to={`/admin/clientas/${c.id}`} className="block rounded-card bg-white p-4 shadow-soft">
                  <p className="font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-ink/70">{c.email}</p>
                  <p className="mt-1 text-sm text-ink/85">{c.orders} {c.orders === 1 ? 'pedido' : 'pedidos'} · {formatPrice(c.spent)}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-card bg-white shadow-soft md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-lavender bg-lavender/60 text-xs uppercase tracking-wider text-ink/80">
                <tr>
                  <th className="px-4 py-3 font-semibold">Clienta</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Registrada</th>
                  <th className="px-4 py-3 text-right font-semibold">Pedidos</th>
                  <th className="px-4 py-3 text-right font-semibold">Total comprado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender">
                {data.items.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/admin/clientas/${c.id}`)} className="cursor-pointer hover:bg-lavender/40">
                    <td className="px-4 py-3">
                      <Link to={`/admin/clientas/${c.id}`} className="font-medium text-brand hover:text-brand-dark">{c.name}</Link>
                      <p className="text-xs text-ink/70">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink/85">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-ink/85">{dateOnly.format(new Date(c.createdAt))}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.orders}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{formatPrice(c.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Paginación">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}><ChevronLeft className="size-4" /> Anterior</Button>
              <span className="text-sm text-ink/80">Página {page} de {data.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => goToPage(page + 1)}>Siguiente <ChevronRight className="size-4" /></Button>
            </nav>
          )}
        </>
      )}
    </>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(`/admin/customers/${id}`, { cache: false });
  usePageTitle(data ? `${data.customer.name} · Clientas` : 'Clienta · Panel');

  if (loading && !data) return <LoadingState message="Cargando clienta…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { customer, orders } = data;
  const bought = orders.filter((o) => o.status !== 'cancelado');
  const spent = bought.reduce((sum, o) => sum + o.total, 0);
  const byStatus = orders.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }), {});
  const first = orders.at(-1);
  const last = orders[0];

  return (
    <>
      <Link to="/admin/clientas" className="mb-3 inline-flex items-center gap-1 text-sm text-brand hover:text-brand-dark">
        <ArrowLeft className="size-4" /> Clientas
      </Link>
      <PageHeader title={customer.name} description={`Clienta desde el ${formatDate(customer.createdAt)}`} />

      <section aria-label="Resumen de la clienta" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-card bg-white p-5 shadow-soft">
          <p className="text-sm text-ink/80">Pedidos</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{orders.length}</p>
          <p className="mt-1 text-xs text-ink/70">{byStatus.cancelado ? `${byStatus.cancelado} cancelado${byStatus.cancelado > 1 ? 's' : ''}` : 'Ninguno cancelado'}</p>
        </div>
        <div className="rounded-card bg-white p-5 shadow-soft">
          <p className="text-sm text-ink/80">Total comprado</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{formatPrice(spent)}</p>
          <p className="mt-1 text-xs text-ink/70">Sin contar cancelados</p>
        </div>
        <div className="rounded-card bg-white p-5 shadow-soft">
          <p className="text-sm text-ink/80">Compra promedio</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{formatPrice(bought.length ? spent / bought.length : 0)}</p>
          <p className="mt-1 text-xs text-ink/70">Por pedido</p>
        </div>
        <div className="rounded-card bg-white p-5 shadow-soft">
          <p className="text-sm text-ink/80">Último pedido</p>
          <p className="mt-2 text-lg font-semibold text-ink">{last ? formatShortDate(last.createdAt) : '—'}</p>
          <p className="mt-1 text-xs text-ink/70">{first ? `Primero: ${formatShortDate(first.createdAt)}` : 'Todavía no compra'}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card title="Datos de contacto">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-ink/70">Correo</dt><dd><a href={`mailto:${customer.email}`} className="break-all text-brand hover:underline">{customer.email}</a></dd></div>
            <div><dt className="text-ink/70">Teléfono</dt><dd className="text-ink">{customer.phone || '—'}</dd></div>
            <div>
              <dt className="mb-1 text-ink/70">Pedidos por estado</dt>
              <dd className="flex flex-wrap gap-1.5">
                {Object.keys(byStatus).length === 0 ? '—' : Object.entries(byStatus).map(([status, count]) => (
                  <span key={status} className="inline-flex items-center gap-1"><AdminStatusBadge status={status} /><span className="text-xs text-ink/80">×{count}</span></span>
                ))}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Pedidos">
          {orders.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink/80">Todavía no ha hecho pedidos.</p>
          ) : (
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Pedidos de la clienta">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-lavender text-xs uppercase tracking-wider text-ink/80">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Pedido</th>
                    <th className="py-2 pr-3 font-semibold">Fecha</th>
                    <th className="py-2 pr-3 text-right font-semibold">Prendas</th>
                    <th className="py-2 pr-3 text-right font-semibold">Total</th>
                    <th className="py-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lavender">
                  {orders.map((o) => (
                    <tr key={o.id} onClick={() => navigate(`/admin/pedidos/${o.id}`)} className="cursor-pointer hover:bg-lavender/40">
                      <td className="py-3 pr-3"><Link to={`/admin/pedidos/${o.id}`} className="font-semibold text-brand hover:text-brand-dark">{o.orderNumber}</Link></td>
                      <td className="py-3 pr-3 text-ink/85">{formatShortDate(o.createdAt)}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{o.pieces}</td>
                      <td className="py-3 pr-3 text-right font-semibold tabular-nums">{formatPrice(o.total)}</td>
                      <td className="py-3"><AdminStatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
