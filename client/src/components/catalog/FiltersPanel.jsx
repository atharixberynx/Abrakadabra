/**
 * Filtros del catálogo: categoría, talla, color, precio y "solo lo nuevo".
 * Se usa en la barra lateral (escritorio) y en la hoja de filtros (celular).
 * No guarda estado propio: lee y escribe los filtros de la URL a través de props.
 */
import { Check } from 'lucide-react';
import { store } from '../../config/store.js';
import { PRICE_RANGES, findPriceRange } from './priceRanges.js';

function Group({ title, children }) {
  return (
    <fieldset className="border-b border-lavender pb-6">
      <legend className="mb-3 font-display text-sm uppercase tracking-brand text-brand-dark">{title}</legend>
      {children}
    </fieldset>
  );
}

const chip = (active) =>
  `rounded-full border px-4 py-2 text-sm transition ${
    active ? 'border-brand bg-brand text-white' : 'border-brand/25 bg-white text-ink hover:border-brand'
  }`;

export function FiltersPanel({ filters, options, categories, onChange }) {
  const sizes = options?.sizes?.length ? options.sizes : store.sizes;
  const colors = options?.colors ?? [];
  const activeRange = findPriceRange(filters.min, filters.max);

  const toggleInList = (key, value) => {
    const list = filters[key];
    onChange({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  };

  return (
    <div className="space-y-6">
      <Group title="Categoría">
        <ul className="space-y-1">
          {[{ slug: '', name: 'Todas las prendas' }, ...categories].map((category) => {
            const active = filters.categoria === category.slug;
            return (
              <li key={category.slug || 'todas'}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ categoria: category.slug })}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    active ? 'bg-lavender font-semibold text-brand-dark' : 'text-ink hover:bg-lavender/60'
                  }`}
                >
                  {category.name}
                  {active && <Check className="size-4 text-brand" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group title="Talla">
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={filters.talla.includes(size)}
              onClick={() => toggleInList('talla', size)}
              className={`${chip(filters.talla.includes(size))} min-w-12`}
            >
              {size}
            </button>
          ))}
        </div>
      </Group>

      {colors.length > 0 && (
        <Group title="Color">
          <ul className="grid grid-cols-2 gap-1 lg:grid-cols-1">
            {colors.map((color) => {
              const active = filters.color.some((c) => c.toLowerCase() === color.name.toLowerCase());
              return (
                <li key={color.name}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onChange({
                        color: active
                          ? filters.color.filter((c) => c.toLowerCase() !== color.name.toLowerCase())
                          : [...filters.color, color.name],
                      })
                    }
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                      active ? 'bg-lavender font-semibold text-brand-dark' : 'text-ink hover:bg-lavender/60'
                    }`}
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border ${active ? 'ring-2 ring-brand ring-offset-1' : 'border-ink/20'}`}
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="truncate">{color.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Group>
      )}

      <Group title="Precio">
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range) => {
            const active = activeRange?.id === range.id;
            return (
              <button
                key={range.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange(active ? { min: '', max: '' } : { min: String(range.min ?? ''), max: String(range.max ?? '') })
                }
                className={chip(active)}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </Group>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={filters.nuevos}
          onChange={(e) => onChange({ nuevos: e.target.checked ? '1' : '' })}
          className="size-5 rounded accent-brand"
        />
        Solo lo nuevo
      </label>
    </div>
  );
}
