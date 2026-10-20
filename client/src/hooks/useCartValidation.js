/**
 * Revalida el carrito con el backend cada vez que cambia (precios, stock, disponibilidad).
 * Aplica sola los ajustes simples (precio nuevo, cantidad máxima) y devuelve los avisos
 * de cada línea para mostrarlos.
 *
 *   const { status, result, notices, revalidate } = useCartValidation();
 *   status: 'idle' | 'checking' | 'ready' | 'error'
 *   notices: avisos que se quedan visibles (precio que cambió, cantidad ajustada)
 */
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import { formatPrice } from '../lib/format.js';
import { useCartStore } from '../store/cartStore.js';

export const BLOCKING_ISSUES = ['no_disponible', 'agotado', 'stock_insuficiente'];

export function cartPayload(items) {
  return items.map(({ productId, colorKey, size, quantity, price }) => ({ productId, colorKey, size, quantity, price }));
}

export function useCartValidation() {
  const items = useCartStore((s) => s.items);
  const applyValidation = useCartStore((s) => s.applyValidation);
  const [state, setState] = useState({ status: 'idle', result: null, error: null });
  const [notices, setNotices] = useState({});
  const [round, setRound] = useState(0); // revalidate() fuerza otra revisión (p. ej. si cambió el costo de envío)
  // Firma del carrito: solo se revalida si cambian productos, variantes o cantidades
  const signature = items.map((i) => `${i.key}:${i.quantity}`).join(',');

  useEffect(() => {
    const currentItems = useCartStore.getState().items;
    if (currentItems.length === 0) return undefined; // carrito vacío: se resuelve abajo, sin pedir nada
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, status: 'checking' }));
      apiFetch('/cart/validate', { method: 'POST', body: { items: cartPayload(currentItems) }, signal: controller.signal })
        .then((result) => {
          // Los avisos se guardan antes de aplicar los ajustes, porque después ya no aparecen
          const found = {};
          for (const line of result.lines) {
            if (line.issues.includes('precio_cambio')) {
              found[`precio:${line.key}`] = `El precio de ${line.name} cambió de ${formatPrice(line.previousPrice)} a ${formatPrice(line.unitPrice)}.`;
            }
            if (line.issues.includes('stock_insuficiente') && line.availableQuantity > 0) {
              found[`stock:${line.key}`] = `Solo quedan ${line.availableQuantity} de ${line.name} (${line.colorName}, talla ${line.size}): ajustamos la cantidad.`;
            }
          }
          if (Object.keys(found).length) setNotices((prev) => ({ ...prev, ...found }));
          applyValidation(result.lines);
          setState({ status: 'ready', result, error: null });
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setState({ status: 'error', result: null, error });
        });
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [signature, round, applyValidation]);

  const revalidate = () => setRound((r) => r + 1);
  if (items.length === 0) {
    return { status: 'ready', result: { ok: false, lines: [], total: 0 }, error: null, issuesByKey: new Map(), blocked: false, notices: [], revalidate };
  }
  const issuesByKey = new Map((state.result?.lines ?? []).map((l) => [l.key, l]));
  const blocked = (state.result?.lines ?? []).some((l) => l.issues.some((i) => BLOCKING_ISSUES.includes(i)));
  return { ...state, issuesByKey, blocked, notices: Object.values(notices), revalidate };
}
