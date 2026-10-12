/**
 * Página temporal de la Fase 1: muestra la identidad visual (paleta, tipografía,
 * botones, insignias) y el estado de conexión con la API.
 * Se reemplaza por la página de inicio real en la Fase 3.
 */
import { store } from '../config/store.js';
import { useApiHealth } from '../hooks/useApiHealth.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { StarDivider, StarIcon } from '../components/ui/StarIcon.jsx';
import { StoreLoader } from '../components/ui/StoreLoader.jsx';

const PALETTE = [
  { token: 'brand', hex: '#59378D', className: 'bg-brand', use: 'Principal' },
  { token: 'brand-dark', hex: '#3F2566', className: 'bg-brand-dark', use: 'Hover y texto' },
  { token: 'brand-soft', hex: '#795393', className: 'bg-brand-soft', use: 'Secundario' },
  { token: 'lavender', hex: '#F3EEF8', className: 'bg-lavender', use: 'Fondos alternos' },
  { token: 'gold', hex: '#EDC246', className: 'bg-gold', use: 'Solo acento' },
  { token: 'ink', hex: '#2A1A40', className: 'bg-ink', use: 'Texto principal' },
];

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

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <div className="bg-brand px-4 py-2 text-center text-xs tracking-wider text-white sm:text-sm">
        {store.announcements[0]} <span aria-hidden="true">·</span> {store.announcements[1]}
      </div>

      <header className="border-b border-lavender">
        <div className="mx-auto flex h-20 max-w-6xl items-center px-4">
          <img src={store.logos.onWhite} alt={store.name} className="h-14 w-auto" />
        </div>
      </header>

      <main>
        <section className="bg-lavender px-4 py-16 text-center sm:py-24">
          <StarIcon className="mx-auto mb-4 size-6 text-gold" />
          <h1 className="font-display text-3xl font-light text-brand-dark sm:text-5xl">
            {store.slogan}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink/80">{store.tagline}</p>
          <Button className="mt-8" size="lg" disabled title="Disponible en la Fase 3">
            Ver catálogo
          </Button>
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
                  <p className="text-ink/70">{color.hex}</p>
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

      <footer className="bg-brand px-4 py-10 text-center text-white">
        <img src={store.logos.onPurple} alt={store.name} className="mx-auto h-24 w-auto" />
        <p className="mt-4 text-sm text-white/85">{store.fullAddress}</p>
      </footer>
    </div>
  );
}
