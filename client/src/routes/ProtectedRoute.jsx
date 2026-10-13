/**
 * Protege rutas en el frontend. Es solo para la experiencia de usuario:
 * la seguridad real la aplica la API en cada endpoint.
 *
 *   <ProtectedRoute>            → exige sesión iniciada (/cuenta, /checkout)
 *   <ProtectedRoute role="admin"> → exige rol admin (/admin)
 */
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StoreLoader } from '../components/ui/StoreLoader.jsx';

export function ProtectedRoute({ role, children }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <StoreLoader message="Cargando tu cuenta…" className="min-h-[60dvh]" />;

  if (status === 'anonymous') {
    // Se recuerda la página para regresar después de iniciar sesión
    return <Navigate to="/iniciar-sesion" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return (
      <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl text-brand-dark">No tienes acceso a esta sección</h1>
        <p className="text-ink/80">Esta área es solo para el equipo de la tienda.</p>
        <Button as={Link} to="/">
          Volver a la tienda
        </Button>
      </main>
    );
  }

  return children;
}
