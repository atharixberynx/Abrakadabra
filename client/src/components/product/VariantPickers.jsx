/**
 * Selectores de la página de producto: color, talla y cantidad.
 * Funcionan como grupos de opciones accesibles (role="radiogroup").
 */
import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';

/** Círculos de color. Un color sin existencias se ve tachado, pero se puede elegir para ver sus fotos */
export function ColorPicker({ colors, value, onChange, isAvailable }) {
  const selected = colors.find((c) => c.key === value);
  return (
    <fieldset>
      <legend className="mb-3 text-sm text-ink">
        Color: <span className="font-semibold">{selected?.name ?? 'elige uno'}</span>
      </legend>
      <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const checked = color.key === value;
          const available = isAvailable(color.key);
          return (
            <button
              key={color.key}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${color.name}${available ? '' : ' (agotado)'}`}
              title={available ? color.name : `${color.name} · agotado`}
              onClick={() => onChange(color.key)}
              className={`relative size-10 overflow-hidden rounded-full border transition ${
                checked ? 'ring-2 ring-brand ring-offset-2' : 'border-ink/20 hover:ring-2 hover:ring-brand-soft hover:ring-offset-2'
              }`}
              style={{ backgroundColor: color.hex }}
            >
              {!available && (
                <span aria-hidden="true" className="absolute inset-0 m-auto h-0.5 w-[140%] -translate-x-[15%] rotate-45 bg-white shadow-[0_0_0_1px_rgba(42,26,64,0.4)]" />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Botones de talla. Las tallas sin existencias en el color elegido aparecen deshabilitadas */
export function SizePicker({ sizes, value, onChange, getStock, error }) {
  return (
    <fieldset>
      <div className="mb-3 flex items-center justify-between">
        <legend className="text-sm text-ink">
          Talla: <span className="font-semibold">{value ?? 'elige una'}</span>
        </legend>
        <Link to="/guia-de-tallas" className="text-sm text-brand underline-offset-4 hover:underline">
          Guía de tallas
        </Link>
      </div>
      <div role="radiogroup" aria-label="Talla" className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const stock = getStock(size);
          const disabled = stock <= 0;
          const checked = value === size;
          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              aria-label={`${size}${disabled ? ' (agotada en este color)' : ''}`}
              onClick={() => onChange(size)}
              className={`h-12 min-w-14 rounded-xl border px-4 text-sm font-medium transition ${
                checked
                  ? 'border-brand bg-brand text-white'
                  : disabled
                    ? 'cursor-not-allowed border-ink/10 bg-lavender/60 text-ink/50 line-through'
                    : 'border-brand/25 bg-white text-ink hover:border-brand'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** − cantidad + (limitada al stock disponible) */
export function QuantityStepper({ value, max, onChange, disabled }) {
  const button =
    'grid size-11 place-items-center text-brand transition hover:bg-lavender disabled:cursor-not-allowed disabled:text-ink/30 disabled:hover:bg-transparent';
  return (
    <div className="inline-flex items-center rounded-full border border-brand/25" role="group" aria-label="Cantidad">
      <button type="button" className={`${button} rounded-l-full`} onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Quitar una">
        <Minus className="size-4" />
      </button>
      <output className="w-10 text-center font-semibold" aria-live="polite">
        {value}
      </output>
      <button type="button" className={`${button} rounded-r-full`} onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Agregar una">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
