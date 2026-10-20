/** Estados de pedido: textos y colores que ven la clienta y el panel */

export const ORDER_STATUS = {
  pendiente_pago: { label: 'Procesando pago', className: 'bg-lavender text-brand-dark' },
  pago_rechazado: { label: 'Pago rechazado', className: 'bg-danger-soft text-danger' },
  pagado: { label: 'Pagado · lo estamos preparando', className: 'bg-lavender text-brand-dark' },
  listo_para_retiro: { label: 'Listo para retirar', className: 'bg-gold text-brand-dark' },
  enviado: { label: 'En camino', className: 'bg-gold text-brand-dark' },
  entregado: { label: 'Entregado', className: 'bg-brand text-white' },
  cancelado: { label: 'Cancelado', className: 'bg-danger-soft text-danger' },
};

/** Los pedidos de antes del envío a domicilio no traen `delivery`: son retiro en tienda */
export const deliveryMethodOf = (order) => order.delivery?.method ?? order.deliveryMethod ?? 'retiro';

export const DELIVERY_LABELS = { retiro: 'Retiro en tienda', envio: 'Envío a domicilio' };

/** Pasos del pedido en orden (para la línea de tiempo), según el tipo de entrega */
export function orderSteps(method) {
  return [
    { status: 'pagado', label: 'Pagado' },
    method === 'envio' ? { status: 'enviado', label: 'En camino' } : { status: 'listo_para_retiro', label: 'Listo para retirar' },
    { status: 'entregado', label: 'Entregado' },
  ];
}

/** "Colonia Las Delicias, pasaje 3, casa 14, Santa Tecla, La Libertad Sur, La Libertad" */
export function shippingAddressText(delivery) {
  return [delivery.address, delivery.district, delivery.municipality, delivery.department].filter(Boolean).join(', ');
}

const dateFormatter = new Intl.DateTimeFormat('es-SV', { dateStyle: 'long', timeStyle: 'short' });
export const formatDate = (value) => dateFormatter.format(new Date(value));

/** Etiquetas del panel (más operativas que las de la clienta) */
export const ADMIN_ORDER_STATUS = {
  pendiente_pago: { label: 'Procesando pago', className: 'bg-lavender text-brand-dark' },
  pago_rechazado: { label: 'Pago rechazado', className: 'bg-danger-soft text-danger' },
  pagado: { label: 'Por preparar', className: 'bg-gold/30 text-brand-dark' },
  listo_para_retiro: { label: 'Listo para retiro', className: 'bg-lavender text-brand-dark' },
  enviado: { label: 'En camino', className: 'bg-lavender text-brand-dark' },
  entregado: { label: 'Entregado', className: 'bg-brand text-white' },
  cancelado: { label: 'Cancelado', className: 'bg-ink/10 text-ink' },
};

const CANCEL = { status: 'cancelado', label: 'Cancelar pedido', variant: 'danger' };

/** Acciones disponibles en el panel según la entrega y el estado actual */
const NEXT_ACTIONS = {
  retiro: {
    pagado: [{ status: 'listo_para_retiro', label: 'Marcar como listo para retiro', variant: 'primary' }, CANCEL],
    listo_para_retiro: [{ status: 'entregado', label: 'Marcar como entregado', variant: 'primary' }, CANCEL],
  },
  envio: {
    pagado: [{ status: 'enviado', label: 'Marcar como enviado', variant: 'primary' }, CANCEL],
    enviado: [{ status: 'entregado', label: 'Marcar como entregado', variant: 'primary' }, CANCEL],
  },
};

export const nextActions = (order) => NEXT_ACTIONS[deliveryMethodOf(order)][order.status] ?? [];

const shortDateFormatter = new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const formatShortDate = (value) => shortDateFormatter.format(new Date(value));
