/**
 * Colores y tallas de la prenda.
 *  - Colores: un toque en la paleta rápida agrega el color; también se puede crear uno
 *    personalizado con el selector. Cada color se puede renombrar o cambiar de tono.
 *  - Tallas: botones S, M, L, XL o "Única" (Única excluye a las demás).
 */
import { Plus, Trash2 } from 'lucide-react';
import { COLOR_PRESETS, ONE_SIZE, SIZE_OPTIONS } from './productForm.js';

export function ColorEditor({ colors, onAdd, onUpdate, onRemove }) {
  const usedNames = new Set(colors.map((c) => c.name.trim().toLowerCase()));
  const available = COLOR_PRESETS.filter((p) => !usedNames.has(p.name.toLowerCase()));

  return (
    <div className="space-y-4">
      {colors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand/30 bg-lavender/40 px-4 py-5 text-center text-sm text-ink/80">
          Esta prenda aún no tiene colores. Toca uno de la paleta para agregarlo.
        </p>
      ) : (
        <ul className="space-y-2">
          {colors.map((color) => (
            <li key={color.key} className="flex items-center gap-3 rounded-xl border border-brand/15 bg-white p-2 pr-3">
              <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-full border border-ink/20" style={{ backgroundColor: color.hex }} title="Cambiar tono">
                <span className="sr-only">Tono de {color.name || 'este color'}</span>
                <input
                  type="color"
                  value={color.hex}
                  onChange={(e) => onUpdate(color.key, { hex: e.target.value.toUpperCase() })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <input
                type="text"
                value={color.name}
                onChange={(e) => onUpdate(color.key, { name: e.target.value })}
                placeholder="Nombre del color (p. ej. Rosa palo)"
                maxLength={40}
                aria-label="Nombre del color"
                className="h-10 min-w-0 flex-1 rounded-lg border border-transparent px-2 text-sm text-ink hover:border-brand/20 focus:border-brand focus:outline-none"
              />
              <span className="hidden font-mono text-xs text-ink/70 sm:inline">{color.hex}</span>
              <button
                type="button"
                onClick={() => onRemove(color)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink/70 hover:bg-danger-soft hover:text-danger"
                aria-label={`Quitar color ${color.name}`}
                title="Quitar color"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Agregar color</p>
        <div className="flex flex-wrap gap-2">
          {available.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onAdd(preset)}
              className="flex items-center gap-2 rounded-full border border-brand/20 bg-white py-1 pr-3 pl-1 text-xs text-ink transition hover:border-brand hover:bg-lavender"
            >
              <span className="size-6 rounded-full border border-ink/15" style={{ backgroundColor: preset.hex }} />
              {preset.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onAdd({ name: '', hex: '#B39CD0' })}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-lavender"
          >
            <Plus className="size-3.5" /> Color personalizado
          </button>
        </div>
      </div>
    </div>
  );
}

export function SizeSelector({ sizes, onToggle }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tallas">
        {SIZE_OPTIONS.map((size) => {
          const active = sizes.includes(size);
          return (
            <button
              key={size}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(size)}
              className={`h-11 min-w-14 rounded-xl border px-4 text-sm font-medium transition ${
                active ? 'border-brand bg-brand text-white' : 'border-brand/25 bg-white text-ink hover:border-brand'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink/70">
        Usa “{ONE_SIZE}” para prendas o accesorios sin tallas (no se combina con S, M, L o XL).
      </p>
    </div>
  );
}
