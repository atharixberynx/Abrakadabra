/**
 * Panel › Clientas (solo lectura): lista con búsqueda y detalle con sus pedidos.
 */
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
                  <tr key={c.id} className="hover:bg-lavender/30">
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
  const { data, loading, error, reload } = useFetch(`/admin/customers/${id}`, { cache: false });
  usePageTitle(data ? `${data.customer.name} · Clientas` : 'Clienta · Panel');

  if (loading && !data) return <LoadingState message="Cargando clienta…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { customer, orders } = data;
  const spent = orders.filter((o) => o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <Link to="/admin/clientas" className="mb-3 inline-flex items-center gap-1 text-sm text-brand hover:text-brand-dark">
        <ArrowLeft className="size-4" /> Clientas
      </Link>
      <PageHeader title={customer.name} description={`Registrada el ${formatDate(customer.createdAt)}`} />
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card title="Datos de contacto">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-ink/70">Correo</dt><dd className="break-all text-ink">{customer.email}</dd></div>
            <div><dt className="text-ink/70">Teléfono</dt><dd className="text-ink">{customer.phone || '—'}</dd></div>
            <div><dt className="text-ink/70">Total comprado</dt><dd className="font-semibold tabular-nums text-ink">{formatPrice(spent)}</dd></div>
          </dl>
        </Card>
        <Card title={`Pedidos (${orders.length})`}>
          {orders.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink/80">Todavía no ha hecho pedidos.</p>
          ) : (
            <ul className="divide-y divide-lavender">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link to={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-lavender/40 sm:px-2">
                    <div>
                      <p className="font-semibold text-brand">{o.orderNumber}</p>
                      <p className="text-xs text-ink/70">{formatShortDate(o.createdAt)} · {o.pieces} {o.pieces === 1 ? 'prenda' : 'prendas'} · {formatPrice(o.total)}</p>
                    </div>
                    <AdminStatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
