import { StarIcon } from './StarIcon.jsx';

/**
 * Insignias de producto.
 *  - new:  dorada con estrella ("Nuevo"). Texto morado oscuro sobre dorado (contraste AA).
 *  - sale: morada ("¡Oferta!").
 *  - soft: lavanda, para chips informativos.
 */
const VARIANTS = {
  new: 'bg-gold text-brand-dark',
  sale: 'bg-brand text-white',
  soft: 'bg-lavender text-brand-dark',
  muted: 'bg-ink/70 text-white',
};

export function Badge({ variant = 'soft', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${VARIANTS[variant]} ${className}`}
    >
      {variant === 'new' && <StarIcon className="size-3 text-brand-dark" />}
      {children}
    </span>
  );
}
