import { useFetch } from './useFetch.js';

/** Categorías activas, en el orden definido por el admin */
export function useCategories() {
  const { data, loading, error } = useFetch('/categories');
  return { categories: data?.categories ?? [], loading, error };
}
