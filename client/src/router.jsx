/**
 * Rutas de la aplicación.
 * - Tienda pública dentro de StoreLayout (header + footer).
 * - Inicio de sesión y registro con su propio diseño.
 * - Panel admin en /admin, cargado con React.lazy para que las clientas no lo descarguen.
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { StoreLayout } from './components/layout/StoreLayout.jsx';
import { StoreLoader } from './components/ui/StoreLoader.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import AccountPage from './pages/account/AccountPage.jsx';

const AdminHomePage = lazy(() => import('./admin/AdminHomePage.jsx'));

export const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/cuenta',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  { path: '/iniciar-sesion', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  {
    path: '/admin/*',
    element: (
      <ProtectedRoute role="admin">
        <Suspense fallback={<StoreLoader message="Cargando el panel…" className="min-h-dvh" />}>
          <AdminHomePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <NotFoundPage /> },
]);
