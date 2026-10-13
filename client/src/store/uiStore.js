/**
 * Avisos emergentes (toasts) y diálogos de confirmación, usables desde cualquier parte:
 *
 *   toast.success('Producto guardado');
 *   toast.error('No se pudo guardar');
 *   if (await confirmDialog({ title: '¿Eliminar?', message: '…', danger: true })) { … }
 */
import { create } from 'zustand';

let nextId = 1;
const TOAST_MS = 4500;

export const useUiStore = create((set, get) => ({
  toasts: [],
  dialog: null, // { title, message, confirmLabel, cancelLabel, danger, resolve }

  showToast: (message, type = 'success') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().dismissToast(id), TOAST_MS);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  openDialog: (options) =>
    new Promise((resolve) => {
      set({ dialog: { confirmLabel: 'Confirmar', cancelLabel: 'Cancelar', ...options, resolve } });
    }),
  closeDialog: (result) => {
    get().dialog?.resolve(result);
    set({ dialog: null });
  },
}));

export const toast = {
  success: (message) => useUiStore.getState().showToast(message, 'success'),
  error: (message) => useUiStore.getState().showToast(message, 'error'),
};

export const confirmDialog = (options) => useUiStore.getState().openDialog(options);
