/**
 * Galería de la página de producto.
 *  - Celular: se desliza de lado (scroll-snap) con puntos indicadores.
 *  - Escritorio: miniaturas a la izquierda y flechas.
 *  - Tocar la foto abre una vista ampliada; tocarla otra vez hace zoom y se puede mover con el dedo.
 * Cuando cambia el color elegido, el componente se reinicia (la página le pasa una `key`).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { imageSrcSet, imageUrl } from '../../lib/images.js';
import { Portal } from '../ui/Portal.jsx';

function Lightbox({ images, startIndex, alt, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const closeRef = useRef(null);
  const scrollerRef = useRef(null);
  const image = images[index];

  const go = useCallback(
    (delta) => {
      setZoomed(false);
      setIndex((i) => (i + delta + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose, go]);

  // Al hacer zoom, centra la vista en el punto tocado
  const toggleZoom = (event) => {
    const scroller = scrollerRef.current;
    if (zoomed || !scroller) return setZoomed(false);
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setZoomed(true);
    requestAnimationFrame(() => {
      scroller.scrollLeft = x * scroller.scrollWidth - scroller.clientWidth / 2;
      scroller.scrollTop = y * scroller.scrollHeight - scroller.clientHeight / 2;
    });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Fotos de ${alt}`} className="fixed inset-0 z-[60] flex flex-col bg-ink/95">
      <div className="flex items-center justify-between p-3 text-white">
        <span className="text-sm">
          {index + 1} / {images.length}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Cerrar">
          <X className="size-6" />
        </button>
      </div>

      <div ref={scrollerRef} className={`relative flex-1 ${zoomed ? 'overflow-auto' : 'flex items-center justify-center overflow-hidden'}`}>
        <img
          src={imageUrl(image.url, 1600)}
          alt={`${alt}, foto ${index + 1}`}
          onClick={toggleZoom}
          className={zoomed ? 'max-w-none cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in object-contain'}
          style={zoomed ? { width: '200%' } : undefined}
        />
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-6 p-4 text-white">
          <button type="button" onClick={() => go(-1)} className="grid size-12 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Foto anterior">
            <ChevronLeft className="size-6" />
          </button>
          <p className="text-xs text-white/80">{zoomed ? 'Toca para alejar' : 'Toca la foto para acercar'}</p>
          <button type="button" onClick={() => go(1)} className="grid size-12 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Foto siguiente">
            <ChevronRight className="size-6" />
          </button>
        </div>
      )}
    </div>
  );
}

export function ProductGallery({ images, alt }) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const trackRef = useRef(null);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const scrollTo = (i) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    setIndex(i);
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (track) setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  if (images.length === 0) {
    return <div className="aspect-[4/5] rounded-card bg-lavender" aria-label="Sin fotos" />;
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:items-start">
      {images.length > 1 && (
        <ul className="hidden gap-3 md:flex md:w-20 md:flex-col" aria-label="Miniaturas">
          {images.map((image, i) => (
            <li key={image.id ?? image.url}>
              <button
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === index}
                className={`block aspect-[4/5] w-full overflow-hidden rounded-xl border-2 transition ${i === index ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img src={imageUrl(image.url, 160)} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative flex-1">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="scrollbar-none relative flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto rounded-card bg-lavender"
        >
          {images.map((image, i) => (
            <button
              key={image.id ?? image.url}
              type="button"
              onClick={() => {
                setIndex(i);
                setLightboxOpen(true);
              }}
              className="relative h-full w-full shrink-0 snap-center cursor-zoom-in"
              aria-label={`Ampliar foto ${i + 1} de ${images.length}`}
            >
              <img
                src={imageUrl(image.url, 960)}
                srcSet={imageSrcSet(image.url)}
                sizes="(min-width: 768px) 50vw, 100vw"
                alt={`${alt}, foto ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>

        <span className="pointer-events-none absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white/85 text-brand shadow-soft">
          <ZoomIn className="size-4" aria-hidden="true" />
        </span>

        {images.length > 1 && (
          <>
            <button type="button" onClick={() => scrollTo((index - 1 + images.length) % images.length)} className="absolute top-1/2 left-2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-brand shadow-soft hover:bg-white md:grid" aria-label="Foto anterior">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => scrollTo((index + 1) % images.length)} className="absolute top-1/2 right-2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-brand shadow-soft hover:bg-white md:grid" aria-label="Foto siguiente">
              <ChevronRight className="size-5" />
            </button>
            <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
              {images.map((image, i) => (
                <span key={image.id ?? image.url} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-brand' : 'w-1.5 bg-brand/25'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {lightboxOpen && (
        <Portal>
          <Lightbox images={images} startIndex={index} alt={alt} onClose={closeLightbox} />
        </Portal>
      )}
    </div>
  );
}
