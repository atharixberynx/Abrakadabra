/**
 * Panel › Resumen: fila de métricas (pedidos de hoy, pendientes de entregar, ventas del mes,
 * poco stock), pedidos por atender y productos con poco stock.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Images, Plus, Shirt, Tags } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { formatPrice } from '../../lib/format.js';
import { imageUrl } from '../../lib/images.js';
import { formatShortDate } from '../../lib/orders.js';
import { AdminStatusBadge } from '../components/AdminStatusBadge.jsx';
import { Card, CloudinaryWarning, ErrorState, LoadingState, PageHeader } from '../components/AdminUi.jsx';

/** Tarjeta de métrica: etiqueta, valor y una línea de contexto opcional */
function StatTile({ label, value, detail, to }) {
  const content = (
    <>
      <p className="text-sm text-ink/80">{label}</p>
      <p className="mt-2 font-sans text-3xl font-semibold tabular-nums text-ink">{value}</p>
      {detail && <p className="mt-1 text-xs text-ink/70">{detail}</p>}
    </>
  );
  const className = 'block rounded-card bg-white p-5 shadow-soft';
  return to ? (
    <Link to={to} className={`${className} transition hover:-translate-y-0.5 hover:shadow-md`}>{content}</Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

/** "+12 % vs. mismo periodo del mes pasado" (texto en tinta, la flecha indica dirección) */
function salesComparison({ total, previousPeriod }) {
  if (!previousPeriod) return total > 0 ? 'Primer mes con ventas registradas' : 'Sin ventas todavía este mes';
  const change = Math.round(((total - previousPeriod) / previousPeriod) * 100);
  const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '=';
  return `${arrow} ${change > 0 ? '+' : ''}${change} % vs. el mismo periodo del mes pasado (${formatPrice(previousPeriod)})`;
}

function Shortcut({ to, icon: Icon, title }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-brand-dark shadow-soft hover:bg-lavender">
      <Icon className="size-5 text-brand" aria-hidden="true" /> {title}
    </Link>
  );
}

export default function DashboardPage() {
  usePageTitle('Panel administrativo');
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/admin/dashboard', { cache: false });

  return (
    <>
      <PageHeader title={`Hola, ${user.name.split(' ')[0]}`} description="Así va la tienda hoy." />
      <CloudinaryWarning />

      {loading && !data ? (
        <LoadingState message="Cargando el resumen…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          <section aria-label="Métricas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Pedidos de hoy" value={data.ordersToday} detail="Pagados desde las 12:00 a. m." to="/admin/pedidos" />
            <StatTile
              label="Pendientes de entregar"
              value={data.pending.total}
              detail={`${data.pending.toPrepare} por preparar · ${data.pending.ready} para retiro · ${data.pending.shipped} en camino`}
              to="/admin/pedidos?estado=pendientes"
            />
            <StatTile label="Ventas del mes" value={formatPrice(data.monthSales.total)} detail={salesComparison(data.monthSales)} />
            <StatTile
              label="Productos con poco stock"
              value={data.lowStock.length}
              detail={`1 o 2 unidades en alguna talla · ${data.soldOutCount} ${data.soldOutCount === 1 ? 'agotado' : 'agotados'}`}
              to="/admin/productos?stock=bajo"
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Pedidos por atender" description="Los más antiguos primero.">
              {data.pendingOrders.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink/80">No hay pedidos pendientes. ✨</p>
              ) : (
                <ul className="divide-y divide-lavender">
                  {data.pendingOrders.map((o) => (
                    <li key={o.id}>
                      <Link to={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-lavender/40 sm:px-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-brand">{o.orderNumber}</p>
                          <p className="truncate text-xs text-ink/70">
                            {o.customerName} · {formatShortDate(o.createdAt)} · {formatPrice(o.total)} · {o.deliveryMethod === 'envio' ? 'Envío' : 'Retiro'}
                          </p>
                        </div>
                        <AdminStatusBadge status={o.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/admin/pedidos?estado=pendientes" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                Ver todos <ArrowRight className="size-4" />
              </Link>
            </Card>

            <Card title="Poco stock" description="Combinaciones con 1 o 2 unidades.">
              {data.lowStock.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink/80">Ningún producto con poco stock.</p>
              ) : (
                <ul className="divide-y divide-lavender">
                  {data.lowStock.map((p) => (
                    <li key={p.id}>
                      <Link to={`/admin/productos/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-lavender/40 sm:px-2">
                        <div className="aspect-[4/5] w-10 shrink-0 overflow-hidden rounded-md bg-lavender">
                          {p.image && <img src={imageUrl(p.image, 80)} alt="" className="size-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{p.name}{!p.active && ' (oculto)'}</p>
                          <p className="text-xs text-ink/70">
                            {p.variants.map((v) => `${v.color} ${v.size}: ${v.stock}`).join(' · ')}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <section aria-label="Accesos rápidos" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Shortcut to="/admin/productos/nuevo" icon={Plus} title="Nuevo producto" />
            <Shortcut to="/admin/productos" icon={Shirt} title="Productos" />
            <Shortcut to="/admin/categorias" icon={Tags} title="Categorías" />
            <Shortcut to="/admin/inicio" icon={Images} title="Banners de inicio" />
          </section>
        </div>
      )}
    </>
  );
}
