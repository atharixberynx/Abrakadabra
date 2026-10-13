/**
 * Capas globales: avisos emergentes (abajo) y diálogo de confirmación.
 * Se montan una sola vez en main.jsx y se controlan con toast() y confirmDialog().
 */
import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore.js';
import { Button } from './Button.jsx';
import { Portal } from './Portal.jsx';

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <Portal>
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-md animate-[fadeIn_250ms_ease-out] items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ${
              t.type === 'error' ? 'bg-danger text-white' : 'bg-brand-dark text-white'
            }`}
          >
            {t.type === 'error' ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
            )}
            <p className="flex-1">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="-m-1 rounded p-1 hover:bg-white/15" aria-label="Cerrar aviso">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </Portal>
  );
}

export function ConfirmHost() {
  const dialog = useUiStore((s) => s.dialog);
  const close = useUiStore((s) => s.closeDialog);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!dialog) return undefined;
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus(); // el foco empieza en "Cancelar": la opción segura
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [dialog, close]);

  if (!dialog) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-ink/50" onClick={() => close(false)} />
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          className="relative w-full max-w-md animate-[fadeIn_200ms_ease-out] rounded-card bg-white p-6 shadow-xl"
        >
          <h2 id="confirm-title" className="text-xl text-brand-dark">{dialog.title}</h2>
          {dialog.message && (
            <p id="confirm-message" className="mt-2 text-ink/80">{dialog.message}</p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button ref={cancelRef} variant="secondary" onClick={() => close(false)}>
              {dialog.cancelLabel}
            </Button>
            <Button variant={dialog.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {dialog.confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
