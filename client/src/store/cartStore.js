/**
 * Carrito de compras (Zustand), guardado en localStorage para que persista al recargar.
 *
 * Cada línea es una variante: producto + color + talla.
 * Los precios guardados aquí son solo para mostrar; el backend recalcula todo
 * con los precios de la base de datos antes de cobrar (Fase 5).
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const lineKey = ({ productId, colorKey, size }) => `${productId}|${colorKey}|${size}`;

const MAX_PER_LINE = 20;

export const useCartStore = create()(
  persist(
    (set) => ({
      items: [],

      /** item: { productId, slug, name, image, colorKey, colorName, size, price, maxStock } */
      addItem: (item, quantity = 1) =>
        set((state) => {
          const key = lineKey(item);
          const limit = Math.min(item.maxStock ?? MAX_PER_LINE, MAX_PER_LINE);
          const existing = state.items.find((line) => line.key === key);
          if (existing) {
            return {
              items: state.items.map((line) =>
                line.key === key
                  ? { ...line, ...item, quantity: Math.min(line.quantity + quantity, limit) }
                  : line,
              ),
            };
          }
          return { items: [...state.items, { ...item, key, quantity: Math.min(quantity, limit) }] };
        }),

      updateQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((line) =>
            line.key === key
              ? { ...line, quantity: Math.max(1, Math.min(quantity, line.maxStock ?? MAX_PER_LINE)) }
              : line,
          ),
        })),

      removeItem: (key) => set((state) => ({ items: state.items.filter((line) => line.key !== key) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'abk_cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Número total de prendas (para el ícono del header) */
export const selectCartCount = (state) => state.items.reduce((sum, line) => sum + line.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.items.reduce((sum, line) => sum + line.price * line.quantity, 0);
