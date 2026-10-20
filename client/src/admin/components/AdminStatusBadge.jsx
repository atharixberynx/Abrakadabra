import { Store, Truck } from 'lucide-react';
import { ADMIN_ORDER_STATUS, DELIVERY_LABELS } from '../../lib/orders.js';

export function AdminStatusBadge({ status }) {
  const info = ADMIN_ORDER_STATUS[status] ?? { label: status, className: 'bg-lavender text-brand-dark' };
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${info.className}`}>{info.label}</span>;
}

/** "Envío a domicilio" o "Retiro en tienda", con ícono */
export function DeliveryBadge({ method, short = false }) {
  const Icon = method === 'envio' ? Truck : Store;
  const label = short ? (method === 'envio' ? 'Envío' : 'Retiro') : DELIVERY_LABELS[method];
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-ink/85">
      <Icon className="size-4 shrink-0 text-brand" aria-hidden="true" /> {label}
    </span>
  );
}
