/**
 * Rutas de la aplicación.
 * - Tienda pública dentro de StoreLayout (barra de anuncio, header y footer).
 * - Inicio de sesión y registro con su propio diseño.
 * - Panel admin en /admin, cargado con React.lazy para que las clientas no lo descarguen.
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { StoreLayout } from './components/layout/StoreLayout.jsx';
import { StoreLoader } from './components/ui/StoreLoader.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CartPage from './pages/CartPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import AccountPage from './pages/account/AccountPage.jsx';

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
// Guía de marca: solo existe en desarrollo (no se incluye en la versión publicada)
const BrandGuidePage = import.meta.env.DEV ? lazy(() => import('./pages/dev/BrandGuidePage.jsx')) : null;

export const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/catalogo', element: <CatalogPage /> },
      { path: '/producto/:slug', element: <ProductPage /> },
      { path: '/carrito', element: <CartPage /> },
      {
        path: '/cuenta',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      ...(BrandGuidePage
        ? [{ path: '/guia-de-marca', element: <Suspense fallback={<StoreLoader />}><BrandGuidePage /></Suspense> }]
        : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/iniciar-sesion', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  {
    path: '/admin/*',
    element: (
      <ProtectedRoute role="admin">
        <Suspense fallback={<StoreLoader message="Cargando el panel…" className="min-h-dvh" />}>
          <AdminApp />
        </Suspense>
      </ProtectedRoute>
    ),
  },
]);
