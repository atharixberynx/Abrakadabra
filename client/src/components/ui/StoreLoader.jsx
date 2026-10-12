import { StarIcon } from './StarIcon.jsx';

/**
 * Estado de carga amable. Si el servidor gratuito de Render estaba dormido,
 * la primera petición puede tardar hasta un minuto: `slow` muestra ese aviso.
 */
export function StoreLoader({ message = 'Cargando la tienda…', slow = false, className = '' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 py-16 text-center ${className}`}
    >
      <StarIcon className="size-8 animate-spin text-gold [animation-duration:2.5s]" />
      <p className="font-display text-lg text-brand">{message}</p>
      {slow && (
        <p className="max-w-xs text-sm text-ink/70">
          Estamos despertando el servidor. La primera visita puede tardar hasta un minuto, gracias
          por tu paciencia.
        </p>
      )}
    </div>
  );
}
