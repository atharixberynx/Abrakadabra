/**
 * Guía de marca (solo en desarrollo, en /guia-de-marca).
 * Muestra en vivo los colores, tipografías, botones e insignias definidos en
 * src/theme/brand.css, y el estado de la API. Útil para revisar un cambio de manual de marca.
 */
import { store } from '../../config/store.js';
import { useApiHealth } from '../../hooks/useApiHealth.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { StarDivider, StarIcon } from '../../components/ui/StarIcon.jsx';
import { StoreLoader } from '../../components/ui/StoreLoader.jsx';

// Los valores hex se leen del CSS (src/theme/brand.css), así esta guía nunca se desactualiza
const PALETTE = [
  { token: 'brand', className: 'bg-brand', use: 'Principal' },
  { token: 'brand-dark', className: 'bg-brand-dark', use: 'Hover y texto' },
  { token: 'brand-soft', className: 'bg-brand-soft', use: 'Secundario' },
  { token: 'lavender', className: 'bg-lavender', use: 'Fondos alternos' },
  { token: 'gold', className: 'bg-gold', use: 'Solo acento' },
  { token: 'ink', className: 'bg-ink', use: 'Texto principal' },
];

const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim().toUpperCase();

function ApiStatus() {
  const { status, data, retry } = useApiHealth();

  if (status === 'checking' || status === 'waking') {
    return <StoreLoader slow={status === 'waking'} className="py-6" />;
  }
  if (status === 'offline') {
    return (
      <div className="space-y-3 text-center">
        <p className="text-ink/80">No pudimos conectar con la API. ¿Está corriendo el servidor?</p>
        <Button variant="secondary" size="sm" onClick={retry}>
          Reintentar
        </Button>
      </div>
    );
  }
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
      <dt className="text-ink/70">API</dt>
      <dd className="font-medium text-brand">Conectada ✓</dd>
      <dt className="text-ink/70">Base de datos</dt>
      <dd className="font-medium text-brand">{data.database}</dd>
    </dl>
  );
}

export default function BrandGuidePage() {
  return (
    <>
      <main>
        <section className="bg-lavender px-4 py-16 text-center sm:py-24">
          <StarIcon className="mx-auto mb-4 size-6 text-gold" />
          <h1 className="font-display text-3xl font-light text-brand-dark sm:text-5xl">
            {store.slogan}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink/80">{store.tagline}</p>
          <p className="mt-6 text-sm text-ink/70">Guía de marca · solo visible en desarrollo</p>
        </section>

        <section className="mx-auto max-w-6xl space-y-12 px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl text-brand">Sistema de diseño</h2>
            <StarDivider className="mt-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {PALETTE.map((color) => (
              <div key={color.token} className="overflow-hidden rounded-2xl shadow-soft">
                <div
                  className={`h-20 ${color.className} ${color.token === 'lavender' ? 'border-b border-brand/10' : ''}`}
                />
                <div className="p-3 text-sm">
                  <p className="font-semibold">{color.token}</p>
                  <p className="text-ink/70">{cssVar(`--color-${color.token}`)}</p>
                  <p className="text-xs text-ink/70">{color.use}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-lavender p-6">
              <p className="font-display text-3xl font-light text-brand">Josefin Sans · títulos</p>
              <p>Montserrat para el texto general, legible en el celular.</p>
              <p className="product-name text-sm text-ink">Palazo de vestir</p>
              <p className="font-semibold text-brand">
                $14.50{' '}
                <span className="ml-2 text-sm font-normal text-ink/70 line-through">$18.00</span>
              </p>
            </div>

            <div className="space-y-4 rounded-2xl border border-lavender p-6">
              <div className="flex flex-wrap gap-3">
                <Button>Agregar al carrito</Button>
                <Button variant="secondary">Consultar por WhatsApp</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="new">Nuevo</Badge>
                <Badge variant="sale">¡Oferta!</Badge>
                <Badge>Talla XL</Badge>
                <Badge variant="muted">Agotado</Badge>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-sm rounded-2xl bg-lavender p-6">
            <h3 className="mb-4 text-center text-lg text-brand-dark">Estado del servidor</h3>
            <ApiStatus />
          </div>
        </section>
      </main>
    </>
  );
}
