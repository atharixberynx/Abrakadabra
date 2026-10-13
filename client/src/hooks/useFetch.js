/**
 * Carga datos de la API (GET) con estado de carga, error y aviso de "está tardando".
 * Guarda las respuestas 30 s en memoria para que volver atrás sea instantáneo.
 *
 *   const { data, loading, error, slow, reload } = useFetch('/products?nuevos=1');
 *   Pasa `null` como ruta para no cargar nada todavía.
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';

const CACHE_TTL_MS = 30_000;
const cache = new Map();

function readCache(path) {
  const entry = cache.get(path);
  return entry && Date.now() - entry.time < CACHE_TTL_MS ? entry.data : undefined;
}

export function useFetch(path, { slowAfterMs = 4000 } = {}) {
  const cached = path ? readCache(path) : undefined;
  const [state, setState] = useState({
    path,
    data: cached,
    error: null,
    loading: Boolean(path) && cached === undefined,
  });
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Si cambia la ruta, se reinicia el estado durante el render (patrón recomendado por React)
  if (state.path !== path) {
    setState({ path, data: cached, error: null, loading: Boolean(path) && cached === undefined });
  }

  useEffect(() => {
    if (!path) return undefined;
    if (attempt === 0 && readCache(path) !== undefined) return undefined;

    const controller = new AbortController();
    const slowTimer = setTimeout(() => setSlow(true), slowAfterMs);

    apiFetch(path, { signal: controller.signal })
      .then((data) => {
        cache.set(path, { data, time: Date.now() });
        setState({ path, data, error: null, loading: false });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setState((s) => ({ ...s, error, loading: false }));
      })
      .finally(() => {
        clearTimeout(slowTimer);
        setSlow(false);
      });

    return () => {
      controller.abort();
      clearTimeout(slowTimer);
    };
  }, [path, attempt, slowAfterMs]);

  const reload = useCallback(() => {
    cache.delete(path);
    setState((s) => ({ ...s, loading: true, error: null }));
    setAttempt((n) => n + 1);
  }, [path]);

  return { data: state.data, error: state.error, loading: state.loading, slow, reload };
}

/** Borra la caché (p. ej. después de que el admin edita productos) */
export function clearFetchCache() {
  cache.clear();
}
