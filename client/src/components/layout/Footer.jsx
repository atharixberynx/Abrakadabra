/**
 * Footer en columnas: sobre la tienda, ayuda, contacto, redes y mapa.
 * Todos los datos salen de config/store.js.
 */
import { Link } from 'react-router-dom';
import { Clock, MapPin, MessageCircle } from 'lucide-react';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';
import { FacebookIcon, InstagramIcon } from '../ui/SocialIcons.jsx';
import { StarIcon } from '../ui/StarIcon.jsx';

// Páginas informativas (textos en content/paginas-informativas.json)
const HELP_LINKS = [
  { to: '/retiro-en-tienda', label: 'Retiro en tienda' },
  { to: '/politica-de-cambios', label: 'Cambios y devoluciones' },
  { to: '/guia-de-tallas', label: 'Guía de tallas' },
  { to: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
  { to: '/sobre-nosotras', label: 'Sobre nosotras' },
];

const SOCIAL_ICONS = { Instagram: InstagramIcon, Facebook: FacebookIcon };

function ColumnTitle({ children }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display text-sm uppercase tracking-brand text-white">
      <StarIcon className="size-3 text-gold" />
      {children}
    </h2>
  );
}

export function Footer() {
  const store = useStoreInfo();
  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={store.logos.onPurple} alt={store.name} className="h-24 w-auto" />
          <p className="mt-4 text-sm leading-relaxed text-white/85">{store.description}</p>
          <p className="mt-3 font-display text-lg font-light">{store.slogan}</p>
        </div>

        <div>
          <ColumnTitle>Ayuda</ColumnTitle>
          <ul className="space-y-2.5 text-sm">
            {HELP_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-white/85 underline-offset-4 hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnTitle>Contacto</ColumnTitle>
          <ul className="space-y-4 text-sm text-white/85">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <span>
                {store.address.line1}
                <br />
                {store.address.line2}
                <br />
                {store.address.city}
              </span>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <span>
                {store.hours.map((h) => (
                  <span key={h.days} className="block">
                    {h.days}: {h.time}
                  </span>
                ))}
              </span>
            </li>
            <li>
              <a
                href={store.whatsappUrl('Hola, tengo una consulta sobre la tienda.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-brand transition hover:bg-lavender"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <ColumnTitle>Síguenos</ColumnTitle>
          <ul className="mb-6 flex gap-3">
            {store.social.map((network) => {
              const Icon = SOCIAL_ICONS[network.name];
              return (
                <li key={network.name}>
                  <a
                    href={network.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-11 place-items-center rounded-full border border-white/30 transition hover:bg-white hover:text-brand"
                    aria-label={`${network.name} ${network.handle}`}
                  >
                    {Icon && <Icon />}
                  </a>
                </li>
              );
            })}
          </ul>
          <iframe
            title={`Mapa de ${store.name}`}
            src={store.maps.embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-40 w-full rounded-card border-0"
          />
        </div>
      </div>

      <div className="border-t border-white/15">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-white/80">
          © {new Date().getFullYear()} {store.name} · San Salvador, El Salvador
        </p>
      </div>
    </footer>
  );
}
