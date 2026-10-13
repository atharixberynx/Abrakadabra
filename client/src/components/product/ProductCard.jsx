/**
 * Tarjeta de producto: imagen vertical 4:5 (al pasar el cursor muestra la segunda foto),
 * insignias, nombre, precio, colores y tallas disponibles.
 * Pasar el cursor o tocar un círculo de color muestra la foto de ese color.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { imageSrcSet, imageUrl, imagesForColor } from '../../lib/images.js';
import { isOnSale } from '../../lib/format.js';
import { Badge } from '../ui/Badge.jsx';
import { Price } from './Price.jsx';

const MAX_SWATCHES = 5;
const CARD_SIZES = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw';

export function ProductCard({ product }) {
  const [activeColor, setActiveColor] = useState(null);
  const images = imagesForColor(product.images, activeColor);
  const [main, second] = images;
  const href = `/producto/${product.slug}${activeColor ? `?color=${activeColor}` : ''}`;
  const extraColors = product.colors.length - MAX_SWATCHES;

  return (
    <article className="group">
      <Link
        to={href}
        className="relative block aspect-[4/5] overflow-hidden rounded-card bg-lavender"
        tabIndex={-1}
        aria-hidden="true"
      >
        {main && (
          <img
            src={imageUrl(main.url, 640)}
            srcSet={imageSrcSet(main.url)}
            sizes={CARD_SIZES}
            alt=""
            loading="lazy"
            className={`absolute inset-0 size-full object-cover transition duration-500 ${second ? 'group-hover:opacity-0' : ''} ${product.inStock ? '' : 'opacity-60'}`}
          />
        )}
        {second && (
          <img
            src={imageUrl(second.url, 640)}
            srcSet={imageSrcSet(second.url)}
            sizes={CARD_SIZES}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {product.isNewArrival && <Badge variant="new">Nuevo</Badge>}
          {isOnSale(product) && <Badge variant="sale">¡Oferta!</Badge>}
          {!product.inStock && <Badge variant="muted">Agotado</Badge>}
        </div>
      </Link>

      <div className="mt-3 space-y-1.5 px-0.5">
        <h3>
          <Link to={href} className="product-name line-clamp-2 text-[13px] leading-snug text-ink hover:text-brand">
            {product.name}
          </Link>
        </h3>

        <Price product={product} />

        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5" role="group" aria-label="Colores disponibles">
            {product.colors.slice(0, MAX_SWATCHES).map((color) => (
              <button
                key={color.key}
                type="button"
                title={color.name}
                aria-label={`Ver en ${color.name}`}
                aria-pressed={activeColor === color.key}
                onMouseEnter={() => setActiveColor(color.key)}
                onFocus={() => setActiveColor(color.key)}
                onClick={() => setActiveColor(color.key)}
                className={`size-5 rounded-full border transition ${
                  activeColor === color.key
                    ? 'ring-2 ring-brand ring-offset-2'
                    : 'border-ink/20 hover:ring-2 hover:ring-brand-soft hover:ring-offset-1'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {extraColors > 0 && <span className="text-xs text-ink/70">+{extraColors}</span>}
          </div>
        )}

        {product.sizes.length > 0 && (
          <p className="text-xs text-ink/70">
            <span className="sr-only">Tallas: </span>
            {product.sizes.map((size, i) => {
              const available = product.availableSizes.includes(size);
              return (
                <span key={size}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <span className={available ? 'text-ink' : 'line-through opacity-70'}>
                    {size}
                    {!available && <span className="sr-only"> (agotada)</span>}
                  </span>
                </span>
              );
            })}
          </p>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-[4/5] animate-pulse rounded-card bg-lavender" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-lavender" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-lavender" />
      <div className="mt-2 flex gap-1.5">
        <span className="size-5 animate-pulse rounded-full bg-lavender" />
        <span className="size-5 animate-pulse rounded-full bg-lavender" />
      </div>
    </div>
  );
}
