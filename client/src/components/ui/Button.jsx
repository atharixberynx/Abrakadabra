/**
 * Botón de la marca. Con `as` se puede renderizar como enlace:
 *   <Button as={Link} to="/catalogo">Ver catálogo</Button>
 *   <Button as="a" href={url} variant="secondary">WhatsApp</Button>
 */
import { forwardRef } from 'react';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border border-brand text-brand bg-white hover:bg-lavender',
  gold: 'bg-gold text-brand-dark hover:brightness-95',
  ghost: 'text-brand hover:bg-lavender',
  inverse: 'bg-white text-brand hover:bg-lavender',
  danger: 'bg-danger text-white hover:brightness-90',
};

const SIZES = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-8 text-base',
};

export const Button = forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', size = 'md', className = '', type, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      // Un <button> sin type dentro de un formulario lo envía por accidente
      type={Component === 'button' ? (type ?? 'button') : type}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
});
