/**
 * Rutas de la aplicación.
 * - Tienda pública dentro de StoreLayout (barra de anuncio, header y footer).
 * - Inicio de sesión y registro con su propio diseño.
 * - Panel admin en /admin.
 *
 * Rendimiento: solo la página de inicio va en el paquete principal. Las demás páginas se
 * descargan al visitarlas (React.lazy), así la primera visita desde el celular es más rápida.
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { StoreLayout } from './components/layout/StoreLayout.jsx';
import { StoreLoader } from './components/ui/StoreLoader.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const CatalogPage = lazy(() => import('./pages/CatalogPage.jsx'));
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderPage = lazy(() => import('./pages/OrderPage.jsx'));
const AccountPage = lazy(() => import('./pages/account/AccountPage.jsx'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'));
const infoPage = (name) => lazy(() => import('./pages/info/InfoPages.jsx').then((m) => ({ default: m[name] })));
const AboutPage = infoPage('AboutPage');
const PickupPage = infoPage('PickupPage');
const ReturnsPage = infoPage('ReturnsPage');
const FaqPage = infoPage('FaqPage');
const SizeGuidePage = infoPage('SizeGuidePage');
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
// Guía de marca: solo existe en desarrollo (no se incluye en la versión publicada)
const BrandGuidePage = import.meta.env.DEV ? lazy(() => import('./pages/dev/BrandGuidePage.jsx')) : null;

/** Envuelve una página diferida con el estado de carga de la tienda */
const page = (element, { fullScreen = false, message } = {}) => (
  <Suspense fallback={<StoreLoader message={message} className={fullScreen ? 'min-h-dvh' : 'min-h-[60dvh]'} />}>
    {element}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/catalogo', element: page(<CatalogPage />) },
      { path: '/producto/:slug', element: page(<ProductPage />) },
      { path: '/carrito', element: page(<CartPage />) },
      // Páginas informativas (textos en content/paginas-informativas.json)
      { path: '/sobre-nosotras', element: page(<AboutPage />) },
      { path: '/retiro-en-tienda', element: page(<PickupPage />) },
      { path: '/politica-de-cambios', element: page(<ReturnsPage />) },
      { path: '/preguntas-frecuentes', element: page(<FaqPage />) },
      { path: '/guia-de-tallas', element: page(<SizeGuidePage />) },
      { path: '/cuenta', element: <ProtectedRoute>{page(<AccountPage />)}</ProtectedRoute> },
      // Comprar exige cuenta: sin sesión, ProtectedRoute lleva a iniciar sesión y luego vuelve aquí
      { path: '/checkout', element: <ProtectedRoute>{page(<CheckoutPage />)}</ProtectedRoute> },
      { path: '/pedido/:orderNumber', element: <ProtectedRoute>{page(<OrderPage />)}</ProtectedRoute> },
      { path: '/cuenta/pedidos/:orderNumber', element: <ProtectedRoute>{page(<OrderPage />)}</ProtectedRoute> },
      ...(BrandGuidePage ? [{ path: '/guia-de-marca', element: page(<BrandGuidePage />) }] : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/iniciar-sesion', element: page(<LoginPage />, { fullScreen: true }) },
  { path: '/registro', element: page(<RegisterPage />, { fullScreen: true }) },
  {
    path: '/admin/*',
    element: <ProtectedRoute role="admin">{page(<AdminApp />, { fullScreen: true, message: 'Cargando el panel…' })}</ProtectedRoute>,
  },
]);
