/**
 * Panel administrativo (provisional de la Fase 2).
 * Se carga con React.lazy: las clientas nunca descargan este código.
 * El layout con barra lateral y las secciones llegan en las Fases 4 a 7.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../config/store.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { apiFetch } from '../lib/api.js';
import { Button } from '../components/ui/Button.jsx';
import { StoreLoader } from '../components/ui/StoreLoader.jsx';

export default function AdminHomePage() {
  usePageTitle('Panel administrativo');
  const { user, logout } = useAuth();
  const [check, setCheck] = useState({ status: 'loading' });

  // Confirma con la API que el rol admin es válido (la verificación real ocurre ahí)
  useEffect(() => {
    apiFetch('/admin')
      .then((data) => setCheck({ status: 'ok', data }))
      .catch((err) => setCheck({ status: 'error', message: err.message }));
  }, []);

  return (
    <div className="min-h-dvh bg-lavender">
      <header className="bg-brand text-white">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4">
          <img src={store.logos.onPurple} alt={store.name} className="h-14 w-auto" />
          <Button variant="inverse" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl text-brand-dark">Panel administrativo</h1>
        <p className="mt-2 text-ink/80">Hola, {user.name}.</p>

        <div className="mt-8 rounded-card bg-white p-6 shadow-soft">
          {check.status === 'loading' && <StoreLoader message="Verificando permisos…" className="py-4" />}
          {check.status === 'ok' && (
            <p className="text-brand">✓ La API confirmó tu acceso de administración.</p>
          )}
          {check.status === 'error' && <p className="text-danger">{check.message}</p>}
          <p className="mt-4 text-sm text-ink/70">
            Productos, categorías, pedidos y ajustes se agregan en las siguientes fases.
          </p>
        </div>

        <Link to="/" className="mt-8 inline-block text-brand underline-offset-4 hover:underline">
          ← Ver la tienda
        </Link>
      </main>
    </div>
  );
}
