/**
 * Rutas de la aplicación.
 * Tienda pública en "/" y panel admin en "/admin/*" (Fase 4, cargado con React.lazy).
 */
import { createBrowserRouter } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
