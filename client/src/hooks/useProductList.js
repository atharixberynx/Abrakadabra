/**
 * Lista paginada de productos con "Cargar más".
 * Cuando cambia la consulta (filtros), vuelve a la página 1.
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';

const PAGE_SIZE = 12;

export function useProductList(query) {
  const [state, setState] = useState({ query, items: [], page: 0, total: 0, totalPages: 0, loading: true, error: null });
  const [slow, setSlow] = useState(false);

  // Nueva consulta → se reinicia la lista (patrón "ajustar estado durante el render")
  if (state.query !== query) {
    setState({ query, items: [], page: 0, total: 0, totalPages: 0, loading: true, error: null });
  }

  const fetchPage = useCallback(
    async (page, signal) => {
      const separator = query ? '&' : '';
      return apiFetch(`/products?${query}${separator}page=${page}&limit=${PAGE_SIZE}`, { signal });
    },
    [query],
  );

  useEffect(() => {
    const controller = new AbortController();
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    fetchPage(1, controller.signal)
      .then((data) =>
        setState({ query, items: data.items, page: 1, total: data.total, totalPages: data.totalPages, loading: false, error: null }),
      )
      .catch((error) => {
        if (error.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error }));
      })
      .finally(() => {
        clearTimeout(slowTimer);
        setSlow(false);
      });
    return () => {
      controller.abort();
      clearTimeout(slowTimer);
    };
  }, [query, fetchPage]);

  const loadMore = useCallback(async () => {
    const nextPage = state.page + 1;
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await fetchPage(nextPage);
      setState((s) =>
        s.query === query ? { ...s, items: [...s.items, ...data.items], page: nextPage, loading: false } : s,
      );
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, [state.page, fetchPage, query]);

  return {
    items: state.items,
    total: state.total,
    loading: state.loading,
    error: state.error,
    slow,
    hasMore: state.page < state.totalPages,
    loadMore,
  };
}
