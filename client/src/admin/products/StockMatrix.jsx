/**
 * Matriz de existencias: filas = colores, columnas = tallas.
 *  - La casilla de cada celda indica si esa combinación SE OFRECE.
 *  - El número es cuántas unidades hay (0 = se muestra como agotada).
 *  - Las casillas de cada fila y columna activan o desactivan todo un color o toda una talla,
 *    para casos como "el rojo solo viene en S y M" o "la XL solo en negro".
 */
import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { cellKey } from './productForm.js';

const checkboxClass = 'size-4 cursor-pointer rounded accent-brand';

export function StockMatrix({ colors, sizes, stock, onChange }) {
  const [bulkValue, setBulkValue] = useState('');

  if (colors.length === 0 || sizes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-brand/30 bg-lavender/40 px-4 py-6 text-center text-sm text-ink/80">
        Agrega al menos un color y una talla para escribir las existencias.
      </p>
    );
  }

  const isOffered = (colorKey, size) => cellKey(colorKey, size) in stock;
  const valueOf = (colorKey, size) => Number(stock[cellKey(colorKey, size)]) || 0;

  const setCells = (cells, offered) => {
    const next = { ...stock };
    for (const [colorKey, size] of cells) {
      const key = cellKey(colorKey, size);
      if (offered && !(key in next)) next[key] = '';
      if (!offered) delete next[key];
    }
    onChange(next);
  };

  const setValue = (colorKey, size, value) => {
    // Solo dígitos: evita negativos, decimales y letras
    onChange({ ...stock, [cellKey(colorKey, size)]: value.replace(/\D/g, '').slice(0, 4) });
  };

  const rowCells = (color) => sizes.map((size) => [color.key, size]);
  const colCells = (size) => colors.map((color) => [color.key, size]);
  const allCells = colors.flatMap(rowCells);
  const allOn = (cells) => cells.every(([c, s]) => isOffered(c, s));

  const applyToAll = () => {
    if (bulkValue === '') return;
    const next = { ...stock };
    for (const key of Object.keys(next)) next[key] = bulkValue;
    onChange(next);
  };

  const offeredKeys = Object.keys(stock).filter((key) => {
    const [colorKey, size] = key.split('|');
    return colors.some((c) => c.key === colorKey) && sizes.includes(size);
  });
  const soldOutCount = offeredKeys.filter((key) => !(Number(stock[key]) > 0)).length;
  const total = offeredKeys.reduce((sum, key) => sum + (Number(stock[key]) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setCells(allCells, true)} disabled={allOn(allCells)}>
          Ofrecer todas las combinaciones
        </Button>
        <div className="flex items-center gap-2">
          <label htmlFor="bulk-stock" className="text-sm text-ink/80">Poner</label>
          <input
            id="bulk-stock"
            inputMode="numeric"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="0"
            className="h-9 w-16 rounded-lg border border-brand/25 px-2 text-center text-sm focus:border-brand focus:outline-none"
          />
          <span className="text-sm text-ink/80">unidades en todas</span>
          <Button variant="ghost" size="sm" onClick={applyToAll} disabled={bulkValue === ''}>
            Aplicar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand/15" tabIndex={0} role="region" aria-label="Matriz de existencias">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-lavender/60">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-lavender px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink/80">
                Color \ Talla
              </th>
              {sizes.map((size) => (
                <th key={size} scope="col" className="px-2 py-2 text-center">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-ink" title={`Ofrecer o quitar la talla ${size} en todos los colores`}>
                    <input type="checkbox" className={checkboxClass} checked={allOn(colCells(size))} onChange={(e) => setCells(colCells(size), e.target.checked)} />
                    {size}
                  </label>
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-ink/80">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-lavender">
            {colors.map((color) => (
              <tr key={color.key}>
                <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-normal">
                  <label className="flex cursor-pointer items-center gap-2" title={`Ofrecer o quitar ${color.name || 'este color'} en todas las tallas`}>
                    <input type="checkbox" className={checkboxClass} checked={allOn(rowCells(color))} onChange={(e) => setCells(rowCells(color), e.target.checked)} />
                    <span className="size-5 shrink-0 rounded-full border border-ink/20" style={{ backgroundColor: color.hex }} />
                    <span className="max-w-32 truncate text-ink">{color.name || 'Sin nombre'}</span>
                  </label>
                </th>
                {sizes.map((size) => {
                  const offered = isOffered(color.key, size);
                  const label = `${color.name || 'color'} talla ${size}`;
                  return (
                    <td key={size} className={`px-2 py-2 ${offered ? '' : 'bg-ink/[0.03]'}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          className={checkboxClass}
                          checked={offered}
                          onChange={(e) => setCells([[color.key, size]], e.target.checked)}
                          aria-label={`Ofrecer ${label}`}
                        />
                        {offered ? (
                          <input
                            inputMode="numeric"
                            value={stock[cellKey(color.key, size)]}
                            onChange={(e) => setValue(color.key, size, e.target.value)}
                            placeholder="0"
                            aria-label={`Unidades de ${label}`}
                            className={`h-9 w-14 rounded-lg border px-1 text-center focus:border-brand focus:outline-none ${
                              Number(stock[cellKey(color.key, size)]) > 0 ? 'border-brand/25' : 'border-gold bg-gold/10'
                            }`}
                          />
                        ) : (
                          <span className="w-14 text-center text-xs text-ink/70" aria-hidden="true">No</span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right font-semibold text-brand-dark">
                  {sizes.reduce((sum, size) => sum + (isOffered(color.key, size) ? valueOf(color.key, size) : 0), 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-brand/15 bg-lavender/40">
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-lavender px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink/80">Total</th>
              {sizes.map((size) => (
                <td key={size} className="px-2 py-2 text-center font-semibold text-brand-dark">
                  {colors.reduce((sum, color) => sum + (isOffered(color.key, size) ? valueOf(color.key, size) : 0), 0)}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-bold text-brand-dark">{total}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ul className="space-y-1 text-xs text-ink/80">
        <li><strong>Casilla marcada</strong>: la combinación se vende en la tienda. <strong>“No”</strong>: no existe en ese color y talla.</li>
        {soldOutCount > 0 && (
          <li className="text-brand-dark">
            ⚠️ {soldOutCount} {soldOutCount === 1 ? 'combinación tiene' : 'combinaciones tienen'} 0 unidades (resaltadas en dorado) y se
            mostrarán como agotadas.
          </li>
        )}
      </ul>
    </div>
  );
}
