/**
 * Carrito. Cualquiera puede armarlo sin cuenta; para pagar se pide iniciar sesión.
 * Se revalida con el backend al abrirlo y al cambiar cantidades (precio y stock reales).
 */
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Store, Trash2 } from 'lucide-react';
import { useStoreInfo } from '../context/StoreInfoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { QuantityStepper } from '../components/product/VariantPickers.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StarIcon } from '../components/ui/StarIcon.jsx';
import { useCartValidation } from '../hooks/useCartValidation.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { formatPrice } from '../lib/format.js';
import { imageUrl } from '../lib/images.js';
import { useCartStore } from '../store/cartStore.js';

const ISSUE_TEXT = {
  no_disponible: 'Este producto ya no está disponible. Elimínalo para continuar.',
  agotado: 'Se agotó en este color y talla. Elimínalo para continuar.',
};

export default function CartPage() {
  usePageTitle('Carrito');
  const navigate = useNavigate();
  const { status: authStatus, isAdmin } = useAuth();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const validation = useCartValidation();
  const store = useStoreInfo();

  if (isAdmin) {
    return (
      <main className="mx-auto flex min-h-[50dvh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <StarIcon className="size-7 text-gold" />
        <h1 className="text-3xl text-brand-dark">La cuenta admin no compra</h1>
        <p className="text-ink/80">Puedes recorrer la tienda como la ven las clientas. Para probar una compra, usa una cuenta de clienta.</p>
        <Button as={Link} to="/admin">Ir al panel</Button>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[50dvh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <StarIcon className="size-7 text-gold" />
        <h1 className="text-3xl text-brand-dark">Tu carrito está vacío</h1>
        <p className="text-ink/80">Descubre las prendas nuevas y arma tu look.</p>
        <Button as={Link} to="/catalogo" size="lg">Ver catálogo</Button>
      </main>
    );
  }

  const subtotal = items.reduce((sum, item) => {
    const line = validation.issuesByKey.get(item.key);
    const blocked = line?.issues.some((i) => i === 'agotado' || i === 'no_disponible');
    return blocked ? sum : sum + item.price * item.quantity;
  }, 0);
  const checking = validation.status !== 'ready' && validation.status !== 'error';

  const goToCheckout = () => {
    if (authStatus === 'authenticated') return navigate('/checkout');
    // Sin cuenta: se pide iniciar sesión o registrarse y luego se vuelve al checkout
    navigate('/iniciar-sesion', { state: { from: { pathname: '/checkout' }, reason: 'checkout' } });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl text-brand-dark">Tu carrito</h1>

      {validation.notices.length > 0 && (
        <Alert variant="info" className="mb-6">
          <ul className="space-y-1">
            {validation.notices.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </Alert>
      )}
      {validation.status === 'error' && (
        <Alert variant="error" className="mb-6">
          No pudimos revisar los precios y existencias ahora ({validation.error.message}). Lo intentaremos de nuevo al pagar.
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="divide-y divide-lavender border-y border-lavender">
          {items.map((item) => {
            const line = validation.issuesByKey.get(item.key);
            const problem = line?.issues.find((i) => ISSUE_TEXT[i]);
            return (
              <li key={item.key} className={`flex gap-4 py-5 ${problem ? 'opacity-90' : ''}`}>
                <Link to={`/producto/${item.slug}?color=${item.colorKey}`} className="w-20 shrink-0 sm:w-24">
                  <img src={imageUrl(item.image, 200)} alt="" className={`aspect-[4/5] w-full rounded-xl bg-lavender object-cover ${problem ? 'grayscale' : ''}`} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/producto/${item.slug}?color=${item.colorKey}`} className="product-name text-sm text-ink hover:text-brand">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-ink/80">
                        {item.colorName} · Talla {item.size} · {formatPrice(item.price)} c/u
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-brand">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  {problem && (
                    <p className="flex items-start gap-1.5 text-sm text-danger" role="alert">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {ISSUE_TEXT[problem]}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <QuantityStepper
                      value={item.quantity}
                      max={item.maxStock ?? 20}
                      onChange={(q) => updateQuantity(item.key, q)}
                      disabled={Boolean(problem)}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-ink/80 hover:bg-lavender hover:text-danger"
                    >
                      <Trash2 className="size-4" aria-hidden="true" /> Eliminar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit space-y-4 rounded-card border border-lavender p-5 shadow-soft lg:sticky lg:top-36">
          <h2 className="text-xl text-brand-dark">Resumen</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink/80">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/80">Envío</dt><dd className="font-medium text-brand">Gratis · retiro en tienda</dd></div>
            <div className="flex justify-between border-t border-lavender pt-3 text-lg"><dt className="font-semibold">Total</dt><dd className="font-semibold text-brand">{formatPrice(subtotal)}</dd></div>
          </dl>

          <div className="flex gap-3 rounded-xl bg-lavender/60 p-3 text-sm">
            <Store className="size-5 shrink-0 text-brand" aria-hidden="true" />
            <p className="text-ink/85">Retiras tu pedido en {store.address.line2}, {store.address.city}.</p>
          </div>

          <Button size="lg" className="w-full" onClick={goToCheckout} disabled={checking || validation.blocked}>
            {checking ? 'Revisando existencias…' : 'Continuar al pago'}
          </Button>
          {validation.blocked && <p className="text-center text-sm text-danger">Elimina los productos no disponibles para continuar.</p>}
          {authStatus !== 'authenticated' && !validation.blocked && (
            <p className="text-center text-xs text-ink/70">Para pagar necesitas una cuenta. Tu carrito se guarda mientras inicias sesión.</p>
          )}
          <Link to="/catalogo" className="block text-center text-sm text-brand underline-offset-4 hover:underline">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </main>
  );
}
