/**
 * Panel administrativo (/admin/*). Se carga con React.lazy: las clientas nunca descargan este código.
 * La protección real está en la API (requireAuth + requireRole('admin')).
 */
import { Link, Route, Routes } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { StarIcon } from '../components/ui/StarIcon.jsx';
import { AdminLayout } from './AdminLayout.jsx';
import { ADMIN_NAV } from './adminNav.js';
import BannersPage from './pages/BannersPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import { CustomerDetailPage, CustomersPage } from './pages/CustomersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductFormPage from './pages/ProductFormPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';

const PHASE_BY_SECTION = { ajustes: 7 };

function ComingSoon({ section }) {
  const item = ADMIN_NAV.find((n) => n.to === `/admin/${section}`);
  return (
    <div className="rounded-card bg-white p-10 text-center shadow-soft">
      <StarIcon className="mx-auto size-7 text-gold" />
      <h1 className="mt-3 text-2xl text-brand-dark">{item?.label ?? 'Sección'}</h1>
      <p className="mt-2 text-ink/80">Esta sección se habilita en la Fase {PHASE_BY_SECTION[section]} del proyecto.</p>
      <Button as={Link} to="/admin" variant="secondary" className="mt-6">Volver al resumen</Button>
    </div>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="inicio" element={<BannersPage />} />
        <Route path="productos" element={<ProductsPage />} />
        <Route path="productos/:id" element={<ProductFormPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="pedidos/:id" element={<OrderDetailPage />} />
        <Route path="clientas" element={<CustomersPage />} />
        <Route path="clientas/:id" element={<CustomerDetailPage />} />
        {Object.keys(PHASE_BY_SECTION).map((section) => (
          <Route key={section} path={section} element={<ComingSoon section={section} />} />
        ))}
        <Route
          path="*"
          element={
            <div className="rounded-card bg-white p-10 text-center shadow-soft">
              <h1 className="text-2xl text-brand-dark">Esta sección no existe</h1>
              <Button as={Link} to="/admin" variant="secondary" className="mt-6">Volver al resumen</Button>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
