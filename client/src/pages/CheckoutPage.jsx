/**
 * Checkout: resumen, datos de la clienta, entrega (retiro en tienda o envío) y pago con tarjeta.
 *  - Requiere sesión (ProtectedRoute). Sin cuenta, se pide iniciar sesión y se vuelve aquí.
 *  - En modo de prueba no se realiza ningún cargo real.
 *  - El total lo calcula el backend con los precios de la base de datos y el costo de envío vigente.
 */
import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CreditCard, Lock } from 'lucide-react';
import { useStoreInfo } from '../context/StoreInfoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DeliveryOptions } from '../components/checkout/DeliveryOptions.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Portal } from '../components/ui/Portal.jsx';
import { StoreLoader } from '../components/ui/StoreLoader.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { cartPayload, useCartValidation } from '../hooks/useCartValidation.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { apiFetch } from '../lib/api.js';
import { BRAND_LABELS, TEST_CARDS, detectBrand, formatCardNumber, formatExpiry, validateCard } from '../lib/card.js';
import { initialShipping, validateShipping } from '../lib/delivery.js';
import { formatPrice } from '../lib/format.js';
import { imageUrl } from '../lib/images.js';
import { useCartStore } from '../store/cartStore.js';

function Step({ number, title, children }) {
  return (
    <section className="scroll-mt-40 rounded-card border border-lavender bg-white p-5 shadow-soft sm:p-6" aria-labelledby={`paso-${number}`}>
      <h2 id={`paso-${number}`} className="mb-4 flex items-center gap-3 text-xl text-brand-dark">
        <span className="grid size-8 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const CARD_FIELDS = { 'card.number': 'number', 'card.name': 'name', 'card.expiry': 'expiry', 'card.cvv': 'cvv' };

export default function CheckoutPage() {
  usePageTitle('Pagar');
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const items = useCartStore((s) => s.items);
  const validation = useCartValidation();
  const store = useStoreInfo();

  const [deliveryMethod, setDeliveryMethod] = useState('retiro');
  const [shipping, setShipping] = useState(() => initialShipping(user));
  const [shippingErrors, setShippingErrors] = useState({});
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [cardErrors, setCardErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const idempotencyKey = useRef(null);

  // La cuenta admin no compra; el carrito explica por qué
  if (isAdmin || items.length === 0) return <Navigate to="/carrito" replace />;

  const result = validation.result;
  const testMode = result?.paymentTestMode ?? true;
  const brand = detectBrand(card.number);
  // El costo de envío vigente llega con la revisión del carrito (si no, el de los ajustes cargados)
  const shippingInfo = result?.shipping ?? store.shipping;
  const method = shippingInfo.enabled ? deliveryMethod : 'retiro';
  const shippingFee = method === 'envio' ? shippingInfo.fee : 0;
  const subtotal = result?.total ?? 0;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  const updateShipping = (next) => {
    setShipping(next);
    // Los errores ya marcados se corrigen mientras se escribe
    if (Object.keys(shippingErrors).length) {
      const fresh = validateShipping(next);
      setShippingErrors((prev) => Object.fromEntries(Object.keys(prev).filter((k) => fresh[k]).map((k) => [k, fresh[k]])));
    }
  };

  const update = (field, value) => {
    setCard((c) => ({ ...c, [field]: value }));
    if (cardErrors[field]) setCardErrors((e) => ({ ...e, [field]: undefined }));
  };

  const fillTestCard = () => {
    const year = String(new Date().getFullYear() + 3).slice(-2);
    setCard({ number: TEST_CARDS[0].number, name: user.name, expiry: `12/${year}`, cvv: '123' });
    setCardErrors({});
  };

  const pay = async (event) => {
    event.preventDefault();
    setPayError(null);
    const errors = validateCard(card);
    const deliveryErrors = method === 'envio' ? validateShipping(shipping) : {};
    setCardErrors(errors);
    setShippingErrors(deliveryErrors);
    if (Object.keys(deliveryErrors).length) {
      document.getElementById('paso-2')?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (Object.keys(errors).length) return;

    setPaying(true);
    // Una clave por intento: si la petición se repite (doble clic, red), no se cobra dos veces
    idempotencyKey.current ??= crypto.randomUUID();
    const delivery = method === 'envio' ? { method, ...shipping, expectedFee: shippingInfo.fee } : { method };
    try {
      const { order } = await apiFetch('/orders/checkout', {
        method: 'POST',
        body: { items: cartPayload(items), delivery, card, idempotencyKey: idempotencyKey.current },
      });
      // El carrito se vacía al llegar a la confirmación: vaciarlo aquí haría que esta página
      // redirigiera al carrito (vacío) antes de llegar al pedido
      navigate(`/pedido/${order.orderNumber}`, { replace: true, state: { clearCart: true } });
    } catch (err) {
      idempotencyKey.current = null; // el próximo intento es una compra nueva
      if (err.status === 400 && err.details) {
        const fieldErrors = {};
        const deliveryFieldErrors = {};
        for (const d of err.details) {
          if (CARD_FIELDS[d.field]) fieldErrors[CARD_FIELDS[d.field]] = d.message;
          else if (d.field?.startsWith('delivery.')) deliveryFieldErrors[d.field.slice('delivery.'.length)] = d.message;
        }
        setCardErrors(fieldErrors);
        setShippingErrors(deliveryFieldErrors);
      }
      // 409 por stock lleva al carrito; si cambió el costo de envío, la revisión del carrito trae el nuevo
      const shippingChanged = err.status === 409 && /envío/.test(err.message);
      if (shippingChanged) validation.revalidate();
      setPayError({ message: err.message, stock: err.status === 409 && !shippingChanged });
    } finally {
      setPaying(false);
    }
  };

  if (!result && validation.status !== 'error') return <StoreLoader message="Preparando tu pedido…" className="min-h-[60dvh]" />;

  const lines = (result?.lines ?? []).filter((l) => l.unitPrice !== undefined);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-3xl text-brand-dark">Finalizar compra</h1>
      <p className="mb-6 flex items-center gap-2 text-sm text-ink/80"><Lock className="size-4 text-brand" aria-hidden="true" /> Tus datos viajan cifrados. No guardamos el número de tu tarjeta.</p>

      {validation.blocked && (
        <Alert variant="error" className="mb-6">
          Algunos productos de tu carrito cambiaron o se agotaron. <Link to="/carrito" className="font-semibold underline">Revisa tu carrito</Link> antes de pagar.
        </Alert>
      )}
      {validation.notices.length > 0 && (
        <Alert variant="info" className="mb-6">
          <ul className="space-y-1">{validation.notices.map((n) => <li key={n}>{n}</li>)}</ul>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Step number={1} title="Tus datos">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-ink/70">Nombre</dt><dd className="font-medium text-ink">{user.name}</dd></div>
              <div><dt className="text-ink/70">Correo</dt><dd className="break-all font-medium text-ink">{user.email}</dd></div>
              <div><dt className="text-ink/70">Teléfono</dt><dd className="font-medium text-ink">{user.phone || '—'}</dd></div>
            </dl>
            <Link to="/cuenta" className="mt-3 inline-block text-sm text-brand underline-offset-4 hover:underline">Editar mis datos</Link>
          </Step>

          <Step number={2} title="Entrega">
            <DeliveryOptions
              method={method}
              onMethodChange={setDeliveryMethod}
              shipping={shipping}
              onShippingChange={updateShipping}
              errors={shippingErrors}
              shippingInfo={shippingInfo}
              store={store}
            />
          </Step>

          <Step number={3} title="Pago con tarjeta">
            {testMode && (
              <div className="mb-5 rounded-xl border border-gold bg-gold/15 p-4 text-sm text-ink">
                <p className="font-semibold text-brand-dark">Modo de prueba: no se realizará ningún cargo real.</p>
                <p className="mt-1">Usa una tarjeta de prueba para simular el pago:</p>
                <ul className="mt-2 space-y-0.5 font-mono text-xs">
                  {TEST_CARDS.map((t) => <li key={t.number}>{t.number} → <span className="font-sans">{t.result}</span></li>)}
                </ul>
                <Button variant="secondary" size="sm" className="mt-3" onClick={fillTestCard}>
                  Usar tarjeta de prueba
                </Button>
              </div>
            )}

            <form onSubmit={pay} noValidate className="space-y-4">
              {payError && (
                <Alert variant="error">
                  {payError.message}
                  {payError.stock && <> <Link to="/carrito" className="font-semibold underline">Ir al carrito</Link></>}
                </Alert>
              )}
              <TextField
                label="Número de tarjeta"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) => update('number', formatCardNumber(e.target.value))}
                error={cardErrors.number}
                endAdornment={
                  <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${brand ? 'bg-lavender text-brand-dark' : 'text-ink/60'}`}>
                    <CreditCard className="size-4" aria-hidden="true" /> {brand ? BRAND_LABELS[brand] : ''}
                  </span>
                }
              />
              <TextField label="Nombre en la tarjeta" autoComplete="cc-name" value={card.name} onChange={(e) => update('name', e.target.value)} error={cardErrors.name} maxLength={60} />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Vencimiento (MM/AA)" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={card.expiry} onChange={(e) => update('expiry', formatExpiry(e.target.value))} error={cardErrors.expiry} />
                <TextField label="CVV" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={card.cvv} onChange={(e) => update('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))} error={cardErrors.cvv} />
              </div>
              <p className="text-xs text-ink/70">Aceptamos Visa y Mastercard.</p>

              <Button type="submit" size="lg" className="w-full" disabled={paying || validation.blocked || validation.status === 'checking'}>
                <Lock className="size-4" /> {paying ? 'Procesando pago…' : `Pagar ${formatPrice(total)}`}
              </Button>
            </form>
          </Step>
        </div>

        <aside className="h-fit space-y-4 rounded-card border border-lavender bg-white p-5 shadow-soft lg:sticky lg:top-36" aria-label="Resumen del pedido">
          <h2 className="text-xl text-brand-dark">Tu pedido</h2>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.key} className="flex gap-3">
                <img src={imageUrl(line.image, 120)} alt="" className="aspect-[4/5] w-14 shrink-0 rounded-lg bg-lavender object-cover" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="product-name text-xs text-ink">{line.name}</p>
                  <p className="text-ink/80">{line.colorName} · {line.size} · ×{line.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-brand">{formatPrice(line.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-lavender pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink/80">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-ink/80">{method === 'envio' ? 'Envío a domicilio' : 'Retiro en tienda'}</dt>
              <dd className="font-medium text-brand">{method === 'envio' ? formatPrice(shippingFee) : 'Gratis'}</dd>
            </div>
            <div className="flex justify-between text-lg"><dt className="font-semibold">Total</dt><dd className="font-semibold text-brand">{formatPrice(total)}</dd></div>
          </dl>
          <Link to="/carrito" className="block text-center text-sm text-brand underline-offset-4 hover:underline">Editar carrito</Link>
        </aside>
      </div>

      {/* Mientras el "banco" responde (1 a 2 segundos) */}
      {paying && (
        <Portal>
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/85 backdrop-blur-sm" role="alert" aria-live="assertive">
            <StoreLoader message="Procesando tu pago…" />
            <span className="sr-only">No cierres esta ventana.</span>
          </div>
        </Portal>
      )}
    </main>
  );
}
