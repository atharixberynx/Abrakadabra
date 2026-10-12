/**
 * Estrella dorada de cuatro puntas del logo. Elemento gráfico recurrente de la marca.
 * Decorativa por defecto (aria-hidden); usa `title` si debe tener significado.
 */
export function StarIcon({ className = 'size-4 text-gold', title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d="M12 0C12.9 7.6 16.4 11.1 24 12 16.4 12.9 12.9 16.4 12 24 11.1 16.4 7.6 12.9 0 12 7.6 11.1 11.1 7.6 12 0Z" />
    </svg>
  );
}

/** Separador de secciones: línea · estrella · línea */
export function StarDivider({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-12 bg-brand-soft/40" />
      <StarIcon className="size-4 text-gold" />
      <span className="h-px w-12 bg-brand-soft/40" />
    </div>
  );
}
