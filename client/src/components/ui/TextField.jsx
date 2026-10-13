/**
 * Campo de texto con etiqueta, ayuda y mensaje de error accesibles.
 * Compatible con React Hook Form:
 *   <TextField label="Correo" type="email" error={errors.email?.message} {...register('email')} />
 */
import { forwardRef, useId } from 'react';

export const inputClassName =
  'h-12 w-full rounded-xl border bg-white px-4 text-base text-ink transition placeholder:text-ink/50 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-lavender disabled:text-ink/70';

export const TextField = forwardRef(function TextField(
  { label, error, hint, className = '', endAdornment, ...inputProps },
  ref,
) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${inputClassName} ${error ? 'border-danger' : 'border-brand/20 focus:border-brand'} ${endAdornment ? 'pr-24' : ''}`}
          {...inputProps}
        />
        {endAdornment && <div className="absolute inset-y-0 right-2 flex items-center">{endAdornment}</div>}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink/70">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
