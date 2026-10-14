/** Diseño común de las páginas informativas: ruta, título con estrella, introducción y contenido */
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { StarDivider, StarIcon } from '../../components/ui/StarIcon.jsx';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';

export function InfoLayout({ title, intro, notice, children, whatsappMessage }) {
  usePageTitle(title);
  const { whatsappUrl } = useStoreInfo();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Ruta de navegación" className="mb-4 text-sm text-ink/70">
        <Link to="/" className="hover:text-brand">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{title}</span>
      </nav>

      {notice}

      <header className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl text-brand-dark sm:text-4xl">
          {title} <StarIcon className="size-5 text-gold" />
        </h1>
        {intro && <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink/85">{intro}</p>}
        <StarDivider className="mt-6" />
      </header>

      <div className="mt-10 space-y-10">{children}</div>

      {whatsappMessage && (
        <aside className="mt-12 rounded-card bg-lavender p-6 text-center">
          <p className="font-display text-xl text-brand-dark">¿Te quedó alguna duda?</p>
          <p className="mt-1 text-sm text-ink/80">Escríbenos y te respondemos por WhatsApp.</p>
          <Button as="a" href={whatsappUrl(whatsappMessage)} target="_blank" rel="noopener noreferrer" className="mt-4">
            <MessageCircle className="size-4" /> Escríbenos por WhatsApp
          </Button>
        </aside>
      )}
    </main>
  );
}

export function SectionTitle({ children }) {
  return <h2 className="mb-4 text-2xl text-brand-dark">{children}</h2>;
}

/** Aviso visible solo en desarrollo (p. ej. "Borrador: por validar con la marca") */
export function DevNotice({ children }) {
  if (!import.meta.env.DEV) return null;
  return (
    <p role="note" className="mb-6 rounded-xl border-2 border-dashed border-gold bg-gold/15 px-4 py-3 text-center text-sm font-semibold text-brand-dark">
      {children}
    </p>
  );
}
