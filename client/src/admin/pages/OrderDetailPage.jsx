/**
 * Panel › Detalle de pedido: clienta, productos, pago, historial y cambio de estado.
 * Cancelar devuelve las prendas al inventario (lo hace el servidor).
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { clearFetchCache, useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { apiFetch } from '../../lib/api.js';
import { BRAND_LABELS } from '../../lib/card.js';
import { formatPrice } from '../../lib/format.js';
import { imageUrl } from '../../lib/images.js';
import { ADMIN_ORDER_STATUS, NEXT_ACTIONS, formatDate } from '../../lib/orders.js';
import { confirmDialog, toast } from '../../store/uiStore.js';
import { AdminStatusBadge } from '../components/AdminStatusBadge.jsx';
import { Card, ErrorState, LoadingState } from '../components/AdminUi.jsx';

const CONFIRMATIONS = {
  listo_para_retiro: {
    title: '¿Marcar como listo para retiro?',
    message: 'La clienta verá en "Mis pedidos" que ya puede pasar por su pedido.',
    confirmLabel: 'Sí, está listo',
  },
  entregado: {
    title: '¿Marcar como entregado?',
    message: 'Confirma que la clienta presentó su número de pedido y su DUI. Este cambio es final.',
    confirmLabel: 'Sí, se entregó',
  },
  cancelado: {
    title: '¿Cancelar este pedido?',
    message: 'Las prendas vuelven al inventario. Si la clienta ya pagó, coordina el reembolso con ella. Este cambio es final.',
    confirmLabel: 'Cancelar pedido',
    cancelLabel: 'No cancelar',
    danger: true,
  },
};

/** Enlace de WhatsApp para avisar a la clienta (teléfono salvadoreño 7777-7777) */
function whatsappToCustomer(order) {
  const digits = (order.customer.phone ?? '').replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const firstName = order.customer.name.split(' ')[0];
  const message = `Hola ${firstName}, tu pedido ${order.orderNumber} de Abrakadabra Fashion Shop ya está listo para retirar en ${order.pickup.address}. Horario: ${order.pickup.hours} Presenta tu número de pedido y tu DUI. ¡Te esperamos!`;
  return `https://wa.me/503${digits}?text=${encodeURIComponent(message)}`;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(`/admin/orders/${id}`, { cache: false });
  const [busy, setBusy] = useState(false);
  const order = data?.order;
  usePageTitle(order ? `Pedido ${order.orderNumber} · Panel` : 'Pedido · Panel');

  if (loading && !data) return <LoadingState message="Cargando pedido…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const changeStatus = async (status) => {
    if (!(await confirmDialog(CONFIRMATIONS[status]))) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/orders/${order.id}/status`, { method: 'PATCH', body: { status } });
      clearFetchCache(); // si se canceló, el stock devuelto se ve de inmediato en la tienda
      toast.success(`${order.orderNumber}: ${ADMIN_ORDER_STATUS[status].label.toLowerCase()}`);
      reload({ silent: true });
    } catch (err) {
      toast.error(err.message);
      reload({ silent: true });
    } finally {
      setBusy(false);
    }
  };

  const actions = NEXT_ACTIONS[order.status] ?? [];
  const whatsapp = whatsappToCustomer(order);
  const pieces = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      <Link to="/admin/pedidos" className="mb-3 inline-flex items-center gap-1 text-sm text-brand hover:text-brand-dark">
        <ArrowLeft className="size-4" /> Pedidos
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl text-brand-dark sm:text-3xl">
            {order.orderNumber} <AdminStatusBadge status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-ink/80">Realizado el {formatDate(order.createdAt)}</p>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <Button key={a.status} variant={a.variant === 'danger' ? 'dangerOutline' : 'primary'} onClick={() => changeStatus(a.status)} disabled={busy}>
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card title={`Productos · ${pieces} ${pieces === 1 ? 'prenda' : 'prendas'}`}>
            <ul className="divide-y divide-lavender">
              {order.items.map((item) => (
                <li key={`${item.product}-${item.colorKey}-${item.size}`} className="flex gap-3 py-3">
                  <img src={imageUrl(item.image, 120)} alt="" className="aspect-[4/5] w-14 shrink-0 rounded-lg bg-lavender object-cover" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-ink/80">Color {item.colorName} · Talla {item.size} · {item.quantity} × {formatPrice(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-ink">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-lavender pt-3 text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-semibold tabular-nums text-brand">{formatPrice(order.total)}</span>
            </div>
          </Card>

          <Card title="Historial">
            <ol className="space-y-3">
              {order.statusHistory.map((h, i) => (
                <li key={`${h.status}-${i}`} className="flex items-center gap-3 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <span className="min-w-36 font-medium text-ink">{ADMIN_ORDER_STATUS[h.status]?.label ?? h.status}</span>
                  <span className="text-ink/70">{formatDate(h.at)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Clienta">
            <p className="font-medium text-ink">{order.customer.name}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-brand" aria-hidden="true" />
                <a href={`mailto:${order.customer.email}`} className="break-all text-brand hover:underline">{order.customer.email}</a>
              </li>
              {order.customer.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-brand" aria-hidden="true" />
                  <a href={`tel:+503${order.customer.phone.replace(/\D/g, '')}`} className="text-brand hover:underline">{order.customer.phone}</a>
                </li>
              )}
            </ul>
            {whatsapp && ['pagado', 'listo_para_retiro'].includes(order.status) && (
              <Button as="a" href={whatsapp} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" className="mt-4 w-full">
                <MessageCircle className="size-4" /> Avisar por WhatsApp
              </Button>
            )}
          </Card>

          <Card title="Pago">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-ink/70">Tarjeta</dt><dd className="text-right text-ink">{BRAND_LABELS[order.payment.brand] ?? '—'} •••• {order.payment.last4}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink/70">Transacción</dt><dd className="break-all text-right text-ink">{order.payment.transactionId ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink/70">Proveedor</dt><dd className="text-right text-ink">{order.payment.provider === 'simulated' ? 'Simulado (sin cargo real)' : order.payment.provider}</dd></div>
              {order.payment.failureReason && (
                <div className="flex justify-between gap-2"><dt className="text-ink/70">Motivo</dt><dd className="text-right text-danger">{order.payment.failureReason.replace(/_/g, ' ')}</dd></div>
              )}
            </dl>
          </Card>

          <Card title="Retiro en tienda">
            <p className="text-sm text-ink/85">{order.pickup.address}</p>
            <p className="mt-1 text-sm text-ink/70 first-letter:uppercase">{order.pickup.hours}</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
