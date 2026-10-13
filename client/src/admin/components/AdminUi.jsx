/** Piezas visuales comunes del panel: encabezado de página, tarjeta de sección y estados */
import { AlertTriangle } from 'lucide-react';
import { StoreLoader } from '../../components/ui/StoreLoader.jsx';
import { useFetch } from '../../hooks/useFetch.js';

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl text-brand-dark sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink/80">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, children, className = '', id, error }) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-card bg-white p-5 shadow-soft sm:p-6 ${error ? 'ring-2 ring-danger/60' : ''} ${className}`}>
      {title && (
        <div className="mb-5">
          <h2 className="text-lg text-brand-dark">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink/80">{description}</p>}
          {error && (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function LoadingState({ message = 'Cargando…' }) {
  return <StoreLoader message={message} className="py-20" />;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded-card bg-white p-8 text-center shadow-soft">
      <p className="text-ink/80">{error?.message ?? 'Ocurrió un error.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 font-medium text-brand underline">
          Reintentar
        </button>
      )}
    </div>
  );
}

/** Aviso si falta configurar Cloudinary (las fotos no se pueden subir) */
export function CloudinaryWarning() {
  const { data } = useFetch('/admin', { cache: false });
  if (!data || data.imageUploadsEnabled) return null;
  return (
    <div role="status" className="mb-6 flex gap-3 rounded-xl border border-gold bg-gold/15 px-4 py-3 text-sm text-ink">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-brand-dark" aria-hidden="true" />
      <p>
        <strong>La subida de fotos todavía no está configurada.</strong> Crea una cuenta gratuita en Cloudinary y agrega sus
        credenciales en <code className="rounded bg-white px-1">server/.env</code> (ver README). Mientras tanto puedes crear y
        editar productos sin fotos.
      </p>
    </div>
  );
}
