/** Secciones del menú del panel administrativo */
import { ClipboardList, Images, LayoutDashboard, Settings, Shirt, Tags, Users } from 'lucide-react';

// `soon`: secciones que se habilitan en fases siguientes
export const ADMIN_NAV = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/inicio', label: 'Inicio', icon: Images }, // banners del carrusel de la tienda
  { to: '/admin/productos', label: 'Productos', icon: Shirt },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/clientas', label: 'Clientas', icon: Users },
  { to: '/admin/ajustes', label: 'Ajustes', icon: Settings, soon: true },
];
