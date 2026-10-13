/**
 * Bloques de la página de inicio. Todos los textos salen de config/store.js.
 */
import { Link } from 'react-router-dom';
import { Clock, MapPin, MessageCircle, Palette, Ruler, Store, Tag } from 'lucide-react';
import { store, whatsappUrl } from '../../config/store.js';
import { useCategories } from '../../hooks/useCategories.js';
import { imageUrl } from '../../lib/images.js';
import { Button } from '../ui/Button.jsx';
import { StarDivider, StarIcon } from '../ui/StarIcon.jsx';
import { SectionHeader } from '../product/ProductSection.jsx';

/** Mosaico de categorías con imagen y nombre */
export function CategoryMosaic() {
  const { categories, loading } = useCategories();
  const visible = categories.filter((c) => c.productCount > 0);

  return (
    <section className="mx-auto max-w-7xl px-4" aria-labelledby="categorias-titulo">
      <h2 id="categorias-titulo" className="text-center text-2xl text-brand-dark sm:text-3xl">
        Compra por categoría
      </h2>
      <StarDivider className="mt-3 mb-8" />
      {/* Celular: fila deslizable · Escritorio: cuadrícula de 4 */}
      <ul className="scrollbar-none relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-5 sm:overflow-visible sm:px-0">
        {loading
          ? Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="aspect-[4/5] w-[38%] shrink-0 animate-pulse rounded-card bg-lavender sm:w-auto" aria-hidden="true" />
            ))
          : visible.map((category) => (
              <li key={category.id} className="w-[38%] shrink-0 snap-start sm:w-auto">
                <Link to={`/catalogo?categoria=${category.slug}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-card bg-lavender">
                    {category.image?.url && (
                      <img
                        src={imageUrl(category.image.url, 480)}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="product-name mt-2.5 text-center text-sm text-ink group-hover:text-brand">
                    {category.name}
                  </p>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}

const BENEFIT_ICONS = { sizes: Ruler, colors: Palette, price: Tag, store: Store };

/** Diferenciadores de la marca */
export function Benefits() {
  return (
    <section className="bg-lavender">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 lg:grid-cols-4">
        {store.benefits.map((benefit) => {
          const Icon = BENEFIT_ICONS[benefit.icon] ?? StarIcon;
          return (
            <li key={benefit.title} className="flex flex-col items-center text-center">
              <span className="grid size-14 place-items-center rounded-full bg-white text-brand shadow-soft">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-display text-lg text-brand-dark">{benefit.title}</h3>
              <p className="mt-1 text-sm text-ink/80">{benefit.text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Dirección, horario y mapa de la sucursal */
export function VisitUs() {
  return (
    <section id="visitanos" className="mx-auto max-w-7xl scroll-mt-28 px-4">
      <div className="grid overflow-hidden rounded-card border border-lavender shadow-soft md:grid-cols-2">
        <div className="p-6 sm:p-10">
          <SectionHeader title="Visítanos" subtitle="Pruébate tus prendas en nuestra tienda" />
          <ul className="space-y-5">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
              <address className="not-italic text-ink/85">
                {store.address.line1}
                <br />
                {store.address.line2}
                <br />
                {store.address.city}
              </address>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
              <dl className="text-ink/85">
                {store.hours.map((h) => (
                  <div key={h.days}>
                    <dt className="inline font-medium text-ink">{h.days}: </dt>
                    <dd className="inline">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </li>
          </ul>
          <Button as="a" href={store.maps.directionsUrl} target="_blank" rel="noopener noreferrer" className="mt-8">
            <MapPin className="size-4" /> Cómo llegar
          </Button>
        </div>
        <iframe
          title={`Ubicación de ${store.name} en Google Maps`}
          src={store.maps.embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-72 w-full border-0 md:h-full md:min-h-80"
        />
      </div>
    </section>
  );
}

/** Invitación a comprar por mayoreo por WhatsApp */
export function Wholesale() {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="relative overflow-hidden rounded-card bg-brand px-6 py-12 text-center text-white sm:px-12">
        <StarIcon className="absolute top-6 left-6 size-6 text-gold" />
        <StarIcon className="absolute right-8 bottom-8 size-4 text-gold" />
        <h2 className="text-2xl sm:text-3xl">¿Vendes ropa? Compra por mayoreo</h2>
        <p className="mx-auto mt-3 max-w-lg text-white/90">
          Tenemos precios especiales para emprendedoras y tiendas. Escríbenos y te enviamos el
          catálogo de mayoreo.
        </p>
        <Button
          as="a"
          href={whatsappUrl(store.whatsapp.wholesaleMessage)}
          target="_blank"
          rel="noopener noreferrer"
          variant="gold"
          size="lg"
          className="mt-8"
        >
          <MessageCircle className="size-5" /> Escríbenos por WhatsApp
        </Button>
      </div>
    </section>
  );
}
