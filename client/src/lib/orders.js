/** Estados de pedido: textos y colores que ve la clienta (y el panel en la Fase 6) */

export const ORDER_STATUS = {
  pendiente_pago: { label: 'Procesando pago', className: 'bg-lavender text-brand-dark' },
  pago_rechazado: { label: 'Pago rechazado', className: 'bg-danger-soft text-danger' },
  pagado: { label: 'Pagado · lo estamos preparando', className: 'bg-lavender text-brand-dark' },
  listo_para_retiro: { label: 'Listo para retirar', className: 'bg-gold text-brand-dark' },
  entregado: { label: 'Entregado', className: 'bg-brand text-white' },
  cancelado: { label: 'Cancelado', className: 'bg-danger-soft text-danger' },
};

/** Pasos del pedido en orden (para la línea de tiempo) */
export const ORDER_STEPS = [
  { status: 'pagado', label: 'Pagado' },
  { status: 'listo_para_retiro', label: 'Listo para retirar' },
  { status: 'entregado', label: 'Entregado' },
];

const dateFormatter = new Intl.DateTimeFormat('es-SV', { dateStyle: 'long', timeStyle: 'short' });
export const formatDate = (value) => dateFormatter.format(new Date(value));
