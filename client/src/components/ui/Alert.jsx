/** Mensaje destacado: error (rojo accesible), éxito (morado) o información (lavanda) */
const VARIANTS = {
  error: 'border-danger/20 bg-danger-soft text-danger',
  success: 'border-brand/20 bg-lavender text-brand-dark',
  info: 'border-brand/10 bg-lavender text-ink',
};

export function Alert({ variant = 'info', children, className = '' }) {
  if (!children) return null;
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
