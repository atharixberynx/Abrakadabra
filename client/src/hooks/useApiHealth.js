import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';

/**
 * Consulta /api/health hasta que la API responda.
 * Render gratis "duerme" el servidor tras ~15 min sin uso; la primera petición
 * puede tardar 30–50 s. Mientras tanto se reintenta y se informa el estado:
 *
 *  checking → primeros segundos
 *  waking   → está tardando (probablemente despertando el servidor)
 *  online   → la API respondió
 *  offline  → no respondió después de `giveUpAfterMs`
 */
export function useApiHealth({ slowAfterMs = 3000, retryEveryMs = 4000, giveUpAfterMs = 90_000 } = {}) {
  const [state, setState] = useState({ status: 'checking', data: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer;
    const startedAt = Date.now();

    const slowTimer = setTimeout(() => {
      if (!cancelled) setState((s) => (s.status === 'checking' ? { ...s, status: 'waking' } : s));
    }, slowAfterMs);

    async function check() {
      try {
        const data = await apiFetch('/health');
        if (cancelled) return;
        clearTimeout(slowTimer);
        setState({ status: 'online', data });
      } catch {
        if (cancelled) return;
        if (Date.now() - startedAt > giveUpAfterMs) {
          clearTimeout(slowTimer);
          setState({ status: 'offline', data: null });
        } else {
          retryTimer = setTimeout(check, retryEveryMs);
        }
      }
    }

    check();
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
      clearTimeout(retryTimer);
    };
  }, [attempt, slowAfterMs, retryEveryMs, giveUpAfterMs]);

  const retry = useCallback(() => {
    setState({ status: 'checking', data: null });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
