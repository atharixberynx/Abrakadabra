import { formatPrice, isOnSale } from '../../lib/format.js';

/** Precio actual y, si hay oferta, el precio anterior tachado */
export function Price({ product, size = 'sm', className = '' }) {
  const sale = isOnSale(product);
  const main = size === 'lg' ? 'text-2xl' : 'text-base';
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className={`${main} font-semibold text-brand`}>
        {sale && <span className="sr-only">Precio de oferta: </span>}
        {formatPrice(product.price)}
      </span>
      {sale && (
        <s className={`${size === 'lg' ? 'text-base' : 'text-sm'} text-ink/70`}>
          <span className="sr-only">Precio anterior: </span>
          {formatPrice(product.compareAtPrice)}
        </s>
      )}
    </p>
  );
}
