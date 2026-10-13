/**
 * Panel › Resumen (versión de la Fase 4: accesos rápidos).
 * En la Fase 6 se agregan pedidos de hoy, pendientes de retiro, ventas del mes y poco stock.
 */
import { Link } from 'react-router-dom';
import { Plus, Shirt, Tags } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { CloudinaryWarning, PageHeader } from '../components/AdminUi.jsx';

function Shortcut({ to, icon: Icon, title, text }) {
  return (
    <Link to={to} className="flex items-start gap-4 rounded-card bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-lavender text-brand">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block font-display text-lg text-brand-dark">{title}</span>
        <span className="mt-0.5 block text-sm text-ink/80">{text}</span>
      </span>
    </Link>
  );
}

export default function DashboardPage() {
  usePageTitle('Panel administrativo');
  const { user } = useAuth();
  const { data: low } = useFetch('/admin/products?stock=bajo&limit=1', { cache: false });
  const { data: out } = useFetch('/admin/products?stock=agotado&limit=1', { cache: false });

  return (
    <>
      <PageHeader title={`Hola, ${user.name.split(' ')[0]}`} description="Qué quieres hacer hoy en la tienda." />
      <CloudinaryWarning />

      {(low?.total > 0 || out?.total > 0) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {low?.total > 0 && (
            <Link to="/admin/productos?stock=bajo" className="rounded-full bg-gold/25 px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-gold/40">
              {low.total} {low.total === 1 ? 'producto con' : 'productos con'} poco stock →
            </Link>
          )}
          {out?.total > 0 && (
            <Link to="/admin/productos?stock=agotado" className="rounded-full bg-danger-soft px-4 py-2 text-sm font-semibold text-danger hover:brightness-95">
              {out.total} {out.total === 1 ? 'producto agotado' : 'productos agotados'} →
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Shortcut to="/admin/productos/nuevo" icon={Plus} title="Nuevo producto" text="Agrega una prenda con sus colores, tallas, existencias y fotos." />
        <Shortcut to="/admin/productos" icon={Shirt} title="Productos" text="Edita precios, existencias y visibilidad." />
        <Shortcut to="/admin/categorias" icon={Tags} title="Categorías" text="Ordena el menú y elige las imágenes del inicio." />
      </div>

      <p className="mt-8 text-sm text-ink/70">Las métricas de pedidos y ventas se agregan en la Fase 6.</p>
    </>
  );
}
