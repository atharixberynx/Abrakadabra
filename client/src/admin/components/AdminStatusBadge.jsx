import { ADMIN_ORDER_STATUS } from '../../lib/orders.js';

export function AdminStatusBadge({ status }) {
  const info = ADMIN_ORDER_STATUS[status] ?? { label: status, className: 'bg-lavender text-brand-dark' };
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${info.className}`}>{info.label}</span>;
}
