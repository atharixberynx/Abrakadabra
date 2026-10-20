/**
 * Pedido: confirmación justo después de pagar (/pedido/ABK-…) y detalle desde
 * "Mis pedidos" (/cuenta/pedidos/ABK-…). Solo la dueña del pedido puede verlo (lo verifica la API).
 */
import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ClipboardList, MapPin, Truck } from 'lucide-react';
import { useStoreInfo } from '../context/StoreInfoContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StarIcon } from '../components/ui/StarIcon.jsx';
import { StoreLoader } from '../components/ui/StoreLoader.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { BRAND_LABELS } from '../lib/card.js';
import { formatPrice } from '../lib/format.js';
import { imageUrl } from '../lib/images.js';
import { ORDER_STATUS, deliveryMethodOf, formatDate, orderSteps, shippingAddressText } from '../lib/orders.js';
import { useCartStore } from '../store/cartStore.js';

export function StatusBadge({ status }) {
  const info = ORDER_STATUS[status] ?? ORDER_STATUS.pagado;
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${info.className}`}>{info.label}</span>;
}

function Timeline({ status, method }) {
  if (status === 'cancelado') return <p className="text-sm text-danger">Este pedido fue cancelado.</p>;
  const steps = orderSteps(method);
  const current = steps.findIndex((s) => s.status === status);
  return (
    <ol className="flex items-center gap-2" aria-label="Progreso del pedido">
      {steps.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.status} className="flex flex-1 items-center gap-2">
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? 'bg-brand text-white' : 'bg-lavender text-ink/70'}`} aria-hidden="true">
              {done ? '✓' : i + 1}
            </span>
            <span className={`text-xs sm:text-sm ${done ? 'font-semibold text-brand-dark' : 'text-ink/70'}`}>
              {step.label}
              <span className="sr-only">{done ? ' (completado)' : ' (pendiente)'}</span>
            </span>
            {i < steps.length - 1 &&<span className={`h-0.5 flex-1 ${i < current ? 'bg-brand' : 'bg-lavender'}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clear);
  const store = useStoreInfo();
  const justPlaced = location.pathname.startsWith('/pedido/');

  // Recién pagado: se vacía el carrito una sola vez (y se quita la marca del historial)
  useEffect(() => {
    if (!location.state?.clearCart) return;
    clearCart();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, clearCart, navigate]);
  const { data, loading, error, slow } = useFetch(`/orders/mine/${orderNumber}`, { cache: false });
  const order = data?.order;
  usePageTitle(justPlaced ? '¡Gracias por tu compra!' : `Pedido ${orderNumber}`);

  if (loading) return <StoreLoader message="Cargando tu pedido…" slow={slow} className="min-h-[60dvh]" />;
  if (error || !order) {
    return (
      <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl text-brand-dark">No encontramos este pedido</h1>
        <Button as={Link} to="/cuenta">Ver mis pedidos</Button>
      </main>
    );
  }

  const method = deliveryMethodOf(order);
  const isShipping = method === 'envio';
  const shippingFee = order.delivery?.fee ?? 0;
  const subtotal = order.subtotal ?? order.total;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      {justPlaced ? (
        <section className="rounded-card bg-lavender p-6 text-center sm:p-10" aria-labelledby="gracias">
          <CheckCircle2 className="mx-auto size-12 text-brand" aria-hidden="true" />
          <h1 id="gracias" className="mt-3 flex items-center justify-center gap-2 text-3xl text-brand-dark">
            ¡Gracias por tu compra! <StarIcon className="size-5 text-gold" />
          </h1>
          {isShipping ? (
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink">
              Tu pedido <strong className="text-brand-dark">{order.orderNumber}</strong> fue confirmado. Lo enviaremos a{' '}
              {shippingAddressText(order.delivery)}. Tiempo estimado: {order.delivery.estimatedTime?.toLowerCase()}. Te avisaremos al{' '}
              <span className="whitespace-nowrap">{order.delivery.phone}</span> cuando vaya en camino.
            </p>
          ) : (
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink">
              Tu pedido <strong className="text-brand-dark">{order.orderNumber}</strong> fue confirmado. Puedes retirarlo en nuestra
              sucursal: {order.pickup.address}. Horario: {order.pickup.hours}
              {/* "12:00 m." ya termina en punto: no se repite */}
              {order.pickup.hours.endsWith('.') ? '' : '.'} Presenta tu número de pedido y tu DUI al retirar.
            </p>
          )}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {!isShipping && (
              <Button as="a" href={store.maps.directionsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className="size-4" /> Cómo llegar
              </Button>
            )}
            <Button as={Link} to="/cuenta" variant={isShipping ? 'primary' : 'secondary'}>
              <ClipboardList className="size-4" /> Ver mis pedidos
            </Button>
          </div>
        </section>
      ) : (
        <div>
          <Link to="/cuenta" className="text-sm text-brand hover:underline">← Mis pedidos</Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl text-brand-dark">Pedido {order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink/80">Realizado el {formatDate(order.createdAt)}</p>
        </div>
      )}

      <section className="rounded-card border border-lavender p-5 shadow-soft sm:p-6">
        <h2 className="mb-4 text-lg text-brand-dark">Estado</h2>
        <Timeline status={order.status} method={method} />
        {order.status === 'listo_para_retiro' && (
          <p className="mt-4 rounded-xl bg-gold/20 px-4 py-3 text-sm text-ink">¡Tu pedido está listo! Pasa por él con tu número de pedido y tu DUI.</p>
        )}
        {order.status === 'enviado' && (
          <p className="mt-4 rounded-xl bg-gold/20 px-4 py-3 text-sm text-ink">¡Tu pedido va en camino! Te contactaremos al {order.delivery.phone} para la entrega.</p>
        )}
      </section>

      <section className="rounded-card border border-lavender p-5 shadow-soft sm:p-6">
        <h2 className="mb-4 text-lg text-brand-dark">Productos</h2>
        <ul className="divide-y divide-lavender">
          {order.items.map((item) => (
            <li key={`${item.product}-${item.colorKey}-${item.size}`} className="flex gap-3 py-3">
              <img src={imageUrl(item.image, 120)} alt="" className="aspect-[4/5] w-14 shrink-0 rounded-lg bg-lavender object-cover" />
              <div className="min-w-0 flex-1 text-sm">
                <Link to={`/producto/${item.slug}?color=${item.colorKey}`} className="product-name text-xs text-ink hover:text-brand">{item.name}</Link>
                <p className="text-ink/80">{item.colorName} · Talla {item.size} · ×{item.quantity} · {formatPrice(item.unitPrice)} c/u</p>
              </div>
              <p className="text-sm font-semibold text-brand">{formatPrice(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-lavender pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-ink/80">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-ink/80">Envío</dt>
            <dd>{isShipping ? formatPrice(shippingFee) : 'Gratis · retiro en tienda'}</dd>
          </div>
          <div className="flex justify-between text-lg"><dt className="font-semibold">Total pagado</dt><dd className="font-semibold text-brand">{formatPrice(order.total)}</dd></div>
        </dl>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {isShipping ? (
          <div className="rounded-card border border-lavender p-5 shadow-soft">
            <h2 className="mb-2 flex items-center gap-2 text-lg text-brand-dark"><Truck className="size-5 text-brand" aria-hidden="true" /> Envío a domicilio</h2>
            <p className="text-sm font-medium text-ink">{order.delivery.recipientName} · {order.delivery.phone}</p>
            <p className="mt-1 text-sm text-ink/85">{shippingAddressText(order.delivery)}</p>
            {order.delivery.reference && <p className="mt-1 text-sm text-ink/80">Referencia: {order.delivery.reference}</p>}
            {order.delivery.estimatedTime && <p className="mt-2 text-xs text-ink/70">Tiempo estimado: {order.delivery.estimatedTime.toLowerCase()}</p>}
          </div>
        ) : (
          <div className="rounded-card border border-lavender p-5 shadow-soft">
            <h2 className="mb-2 text-lg text-brand-dark">Retiro en tienda</h2>
            <p className="text-sm text-ink/85">{order.pickup.address}</p>
            <p className="mt-1 text-sm text-ink/80 first-letter:uppercase">{order.pickup.hours}</p>
          </div>
        )}
        <div className="rounded-card border border-lavender p-5 shadow-soft">
          <h2 className="mb-2 text-lg text-brand-dark">Pago</h2>
          <p className="text-sm text-ink/85">
            {BRAND_LABELS[order.payment.brand] ?? 'Tarjeta'} terminada en {order.payment.last4}
          </p>
          <p className="mt-1 text-xs text-ink/70">
            Transacción {order.payment.transactionId}
            {order.payment.provider === 'simulated' && ' · modo de prueba (sin cargo real)'}
          </p>
        </div>
      </section>
    </main>
  );
}
