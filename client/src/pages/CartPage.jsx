/**
 * Carrito (versión básica de la Fase 3).
 * En la Fase 5 se agregan la revalidación de precios y stock con el backend y el checkout.
 */
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { QuantityStepper } from '../components/product/VariantPickers.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StarIcon } from '../components/ui/StarIcon.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { formatPrice } from '../lib/format.js';
import { imageUrl } from '../lib/images.js';
import { selectCartSubtotal, useCartStore } from '../store/cartStore.js';

export default function CartPage() {
  usePageTitle('Carrito');
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl text-brand-dark">Tu carrito</h1>
      <ul className="divide-y divide-lavender border-y border-lavender">
        {items.map((item) => (
          <li key={item.key} className="flex gap-4 py-5">
            <Link to={`/producto/${item.slug}?color=${item.colorKey}`} className="w-20 shrink-0 sm:w-24">
              <img src={imageUrl(item.image, 200)} alt="" className="aspect-[4/5] w-full rounded-xl bg-lavender object-cover" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex justify-between gap-3">
                <div>
                  <Link to={`/producto/${item.slug}?color=${item.colorKey}`} className="product-name text-sm text-ink hover:text-brand">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-ink/80">
                    {item.colorName} · Talla {item.size}
                  </p>
                </div>
                <p className="font-semibold text-brand">{formatPrice(item.price * item.quantity)}</p>
              </div>
              <div className="flex items-center justify-between">
                <QuantityStepper value={item.quantity} max={item.maxStock ?? 20} onChange={(q) => updateQuantity(item.key, q)} />
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
        ))}
      </ul>
      <div className="mt-6 flex flex-col items-end gap-2">
        <p className="text-lg">
          Subtotal: <span className="font-semibold text-brand">{formatPrice(subtotal)}</span>
        </p>
        <p className="text-sm text-ink/70">Sin costo de envío: retiras tu pedido en la tienda.</p>
        <p className="mt-4 rounded-xl bg-lavender px-4 py-3 text-sm text-brand-dark">
          El pago en línea se habilita en la siguiente fase del proyecto.
        </p>
      </div>
    </main>
  );
}
