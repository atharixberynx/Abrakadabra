/**
 * Campo de contraseña con botón "Mostrar / Ocultar" y, opcionalmente,
 * la lista de requisitos que se marca mientras se escribe.
 */
import { forwardRef, useState } from 'react';
import { TextField } from './TextField.jsx';
import { PASSWORD_RULES } from '../../schemas/auth.js';

export const PasswordField = forwardRef(function PasswordField(
  { showRules = false, value = '', ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <TextField
        ref={ref}
        type={visible ? 'text' : 'password'}
        endAdornment={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand hover:bg-lavender"
            aria-pressed={visible}
          >
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        }
        {...props}
      />
      {showRules && (
        <ul className="mt-2 space-y-1 text-sm" aria-label="Requisitos de la contraseña">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(value);
            return (
              <li key={rule.id} className={`flex items-center gap-2 ${ok ? 'text-brand' : 'text-ink/70'}`}>
                <span
                  aria-hidden="true"
                  className={`grid size-4 place-items-center rounded-full text-[10px] ${ok ? 'bg-brand text-white' : 'border border-ink/30'}`}
                >
                  {ok ? '✓' : ''}
                </span>
                {rule.label}
                <span className="sr-only">{ok ? '(cumplido)' : '(pendiente)'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
