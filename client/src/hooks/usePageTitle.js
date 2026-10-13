import { useEffect } from 'react';
import { store } from '../config/store.js';

/** Título de la pestaña del navegador: "Iniciar sesión · Abrakadabra Fashion Shop" */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${store.name}` : store.name;
  }, [title]);
}
