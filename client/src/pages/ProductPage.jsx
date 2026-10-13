/**
 * Página de producto.
 *  - Elegir un color muestra las fotos ligadas a ese color.
 *  - Las tallas sin existencias en el color elegido aparecen deshabilitadas.
 *  - La cantidad se limita al stock de la combinación color + talla.
 */
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Check, MessageCircle, Store } from 'lucide-react';
import { store, whatsappUrl } from '../config/store.js';
import { ProductGallery } from '../components/product/ProductGallery.jsx';
import { Price } from '../components/product/Price.jsx';
import { ProductSection } from '../components/product/ProductSection.jsx';
import { ColorPicker, QuantityStepper, SizePicker } from '../components/product/VariantPickers.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StoreLoader } from '../components/ui/StoreLoader.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { isOnSale } from '../lib/format.js';
import { imagesForColor } from '../lib/images.js';
import { useCartStore } from '../store/cartStore.js';

const LOW_STOCK = 2;

function ProductDetail({ product }) {
  const [params] = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);

  const stockOf = (colorKey, size) =>
    product.variants.find((v) => v.colorKey === colorKey && v.size === size)?.stock ?? 0;
  const colorHasStock = (colorKey) => product.variants.some((v) => v.colorKey === colorKey && v.stock > 0);

  // Color inicial: el de la URL (?color=) si existe; si no, el primero con existencias
  const [colorKey, setColorKey] = useState(() => {
    const fromUrl = params.get('color');
    if (product.colors.some((c) => c.key === fromUrl)) return fromUrl;
    return (product.colors.find((c) => colorHasStock(c.key)) ?? product.colors[0])?.key ?? null;
  });
  // Si solo hay una talla (p. ej. "Única"), se elige sola
  const [size, setSize] = useState(product.sizes.length === 1 ? product.sizes[0] : null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(null);
  const [added, setAdded] = useState(false);

  const color = product.colors.find((c) => c.key === colorKey);
  const stock = size ? stockOf(colorKey, size) : 0;
  const images = imagesForColor(product.images, colorKey);

  const chooseColor = (key) => {
    setColorKey(key);
    setAdded(false);
    // Si la talla elegida no existe en el nuevo color, se deselecciona
    if (size && stockOf(key, size) <= 0) setSize(product.sizes.length === 1 ? product.sizes[0] : null);
    setQuantity(1);
  };

  const chooseSize = (value) => {
    setSize(value);
    setSizeError(null);
    setAdded(false);
    setQuantity((q) => Math.min(q, stockOf(colorKey, value)) || 1);
  };

  const handleAdd = () => {
    if (!size) {
      setSizeError('Elige una talla para continuar');
      return;
    }
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: images[0]?.url ?? null,
        colorKey,
        colorName: color?.name ?? '',
        size,
        price: product.price,
        maxStock: stock,
      },
      quantity,
    );
    setAdded(true);
  };

  const productUrl = `${window.location.origin}/producto/${product.slug}`;
  const whatsappMessage = [
    `Hola, me interesa este producto: ${product.name}`,
    color && `Color: ${color.name}`,
    size && `Talla: ${size}`,
    productUrl,
  ]
    .filter(Boolean)
    .join('\n');

  const colorSoldOut = colorKey && !colorHasStock(colorKey);

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
      {/* key: al cambiar de color, la galería vuelve a la primera foto */}
      <div className="md:sticky md:top-32 md:self-start">
        <ProductGallery key={colorKey ?? 'all'} images={images} alt={`${product.name}${color ? ` en ${color.name}` : ''}`} />
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {product.isNewArrival && <Badge variant="new">Nuevo</Badge>}
            {isOnSale(product) && <Badge variant="sale">¡Oferta!</Badge>}
            {!product.inStock && <Badge variant="muted">Agotado</Badge>}
          </div>
          <Link to={`/catalogo?categoria=${product.category.slug}`} className="text-sm uppercase tracking-brand text-brand-soft hover:text-brand">
            {product.category.name}
          </Link>
          <h1 className="product-name mt-1 text-2xl leading-snug text-ink sm:text-3xl">{product.name}</h1>
          <Price product={product} size="lg" className="mt-3" />
        </div>

        {product.colors.length > 0 && (
          <ColorPicker colors={product.colors} value={colorKey} onChange={chooseColor} isAvailable={colorHasStock} />
        )}

        {product.sizes.length > 0 && (
          <div>
            <SizePicker
              sizes={product.sizes}
              value={size}
              onChange={chooseSize}
              getStock={(s) => stockOf(colorKey, s)}
              error={sizeError}
            />
            {colorSoldOut && (
              <p className="mt-2 text-sm text-ink/80">
                Este color está agotado por ahora. Elige otro color o consúltanos por WhatsApp.
              </p>
            )}
            {size && stock > 0 && stock <= LOW_STOCK && (
              <p className="mt-2 text-sm font-medium text-brand">
                ¡{stock === 1 ? 'Última unidad' : `Últimas ${stock} unidades`} en esta talla y color!
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper value={quantity} max={Math.max(stock, 1)} onChange={setQuantity} disabled={!size || stock <= 0} />
          <Button size="lg" className="flex-1 px-5 whitespace-nowrap" onClick={handleAdd} disabled={!product.inStock || colorSoldOut}>
            {product.inStock ? 'Agregar al carrito' : 'Agotado'}
          </Button>
        </div>

        {added && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-lavender px-4 py-3 text-sm text-brand-dark">
            <span className="flex items-center gap-2">
              <Check className="size-4" aria-hidden="true" /> Agregado al carrito
            </span>
            <Link to="/carrito" className="font-semibold text-brand underline-offset-4 hover:underline">
              Ver carrito
            </Link>
          </div>
        )}

        <Button
          as="a"
          href={whatsappUrl(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="lg"
          className="w-full"
        >
          <MessageCircle className="size-5" /> Consultar por WhatsApp
        </Button>

        <div className="flex gap-3 rounded-xl border border-lavender p-4 text-sm">
          <Store className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">Disponible para retiro en tienda</p>
            <p className="mt-0.5 text-ink/80">
              {store.address.line2}, {store.address.city}.{' '}
              <Link to="/retiro-en-tienda" className="text-brand underline-offset-4 hover:underline">
                ¿Cómo funciona?
              </Link>
            </p>
          </div>
        </div>

        {product.description && (
          <div>
            <h2 className="mb-2 font-display text-lg text-brand-dark">Descripción</h2>
            <p className="leading-relaxed whitespace-pre-line text-ink/85">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { data, loading, error, slow } = useFetch(`/products/${slug}`);
  const product = data?.product;
  usePageTitle(product?.name ?? (error ? 'Producto no encontrado' : 'Cargando…'));

  if (loading) return <StoreLoader message="Cargando la prenda…" slow={slow} className="min-h-[60dvh]" />;

  if (error || !product) {
    return (
      <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl text-brand-dark">
          {error?.status === 404 ? 'No encontramos esta prenda' : 'No pudimos cargar la prenda'}
        </h1>
        <p className="text-ink/80">{error?.status === 404 ? 'Puede que ya no esté disponible.' : error?.message}</p>
        <Button as={Link} to="/catalogo">Ver el catálogo</Button>
      </main>
    );
  }

  return (
    <main className="space-y-16 pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-ink/70">
          <Link to="/" className="hover:text-brand">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <Link to={`/catalogo?categoria=${product.category.slug}`} className="hover:text-brand">
            {product.category.name}
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink">{product.name}</span>
        </nav>
        {/* key: si se navega a otro producto, el detalle se reinicia */}
        <ProductDetail key={product.id} product={product} />
      </div>

      <ProductSection
        title="También te puede gustar"
        path={`/products/${product.slug}/related?limit=4`}
        to={`/catalogo?categoria=${product.category.slug}`}
      />
    </main>
  );
}
