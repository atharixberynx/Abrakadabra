/**
 * Carrusel de banners de la página de inicio (se administran en Panel › Inicio).
 *  - La imagen LLENA todo el carrusel: si su proporción no coincide, se recortan los bordes.
 *  - Si el banner tiene título, subtítulo o botón, se escriben encima con las fuentes de la marca.
 *  - Cambia solo cada 6 s; se pausa al pasar el cursor, al enfocar, con el botón de pausa,
 *    en pestañas ocultas y si la persona prefiere menos movimiento.
 *  - En el celular se puede deslizar con el dedo.
 * Si no hay banners activos, se muestra la portada de texto (TextHero).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { store } from '../../config/store.js';
import { useFetch } from '../../hooks/useFetch.js';
import { imageUrl } from '../../lib/images.js';

const AUTOPLAY_MS = 6000;
const SWIPE_MIN_PX = 40;

/** Envuelve el banner en un enlace interno, externo o en nada */
function SlideLink({ link, label, children }) {
  const className = 'absolute inset-0 block';
  if (!link) return <div className={className} role={label ? 'img' : undefined} aria-label={label}>{children}</div>;
  if (link.startsWith('/')) {
    return <Link to={link} className={className} aria-label={label}>{children}</Link>;
  }
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
      {children}
    </a>
  );
}

function BannerPicture({ banner, className, eager }) {
  return (
    <picture>
      {banner.imageMobile && <source media="(max-width: 767px)" srcSet={imageUrl(banner.imageMobile, 1080)} />}
      <img
        src={imageUrl(banner.imageDesktop, 1920)}
        alt=""
        className={className}
        loading={eager ? 'eager' : 'lazy'}
        {...(eager && { fetchpriority: 'high' })}
        draggable={false}
      />
    </picture>
  );
}

/** Texto opcional sobre la imagen (título, subtítulo y botón) */
function BannerText({ banner }) {
  const { title, subtitle, buttonText, textTheme } = banner;
  if (!title && !subtitle && !buttonText) return null;
  const dark = textTheme === 'dark';
  return (
    <>
      {/* Degradado para que el texto claro se lea sobre cualquier foto */}
      {!dark && <span className="absolute inset-0 bg-linear-to-r from-brand-dark/75 via-brand-dark/35 to-transparent" aria-hidden="true" />}
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 sm:px-10">
        <div className={`max-w-[65%] md:max-w-xl ${dark ? 'text-brand-dark' : 'text-white'}`}>
          {title && <h2 className="font-display text-xl leading-tight font-light sm:text-3xl md:text-4xl lg:text-5xl">{title}</h2>}
          {subtitle && <p className={`mt-3 hidden text-base sm:block md:text-lg ${dark ? 'text-ink/85' : 'text-white/90'}`}>{subtitle}</p>}
          {buttonText && (
            // Es un <span>: todo el banner ya es el enlace
            <span className={`mt-3 inline-flex h-9 items-center rounded-full px-4 text-xs font-medium sm:mt-6 sm:h-12 sm:px-8 sm:text-base ${dark ? 'bg-brand text-white' : 'bg-white text-brand'}`}>
              {buttonText}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

/** Portada de texto (cuando no hay banners) */
export function TextHero() {
  const { hero } = store;
  return (
    <section className="relative overflow-hidden bg-lavender">
      <picture>
        <source media="(min-width: 768px)" srcSet={hero.imageDesktop} />
        <img src={hero.imageMobile} alt="" className="absolute inset-0 size-full object-cover" />
      </picture>
      <div className="relative mx-auto flex min-h-[380px] max-w-7xl flex-col justify-center px-4 py-12 text-center md:min-h-[420px] md:text-left">
        <div className="md:max-w-xl">
          <h1 className="font-display text-4xl leading-tight font-light text-brand-dark sm:text-5xl">{hero.title}</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-ink/85 md:mx-0">{hero.subtitle}</p>
          <Link to="/catalogo" className="mt-8 inline-flex h-12 items-center rounded-full bg-brand px-8 font-medium text-white hover:bg-brand-dark">
            {hero.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HeroCarousel() {
  const { data, loading } = useFetch('/banners');
  const banners = data?.banners ?? [];
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const touchStartX = useRef(null);

  const count = banners.length;
  const current = count ? index % count : 0; // por si cambia la cantidad de banners
  const go = useCallback((delta) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (count < 2 || userPaused || hovered || reduceMotion) return undefined;
    const timer = setInterval(() => {
      if (!document.hidden) go(1);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, userPaused, hovered, go]);

  // Alto: en el celular, proporción 16:9 (o cuadrado si algún banner trae imagen de celular)
  const hasMobileImages = banners.some((b) => b.imageMobile);
  const height = `${hasMobileImages ? 'h-[100vw] max-h-[560px]' : 'h-[56.25vw]'} md:h-[360px] lg:h-[430px]`;

  if (loading) return <div className={`${height} animate-pulse bg-lavender`} aria-hidden="true" />;
  if (count === 0) return <TextHero />;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Novedades de la tienda"
      className={`relative overflow-hidden bg-brand-dark ${height}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > SWIPE_MIN_PX) go(delta < 0 ? 1 : -1);
        touchStartX.current = null;
      }}
    >
      {/* El eslogan sigue presente para lectores de pantalla y buscadores */}
      <h1 className="sr-only">{store.slogan}</h1>

      {banners.map((banner, i) => {
        const active = i === current;
        return (
          <div
            key={banner.id}
            role="group"
            aria-roledescription="banner"
            aria-label={`${i + 1} de ${count}`}
            aria-hidden={!active}
            {...(!active && { inert: '' })}
            className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Si el banner tiene texto visible, ese es su nombre; si es solo imagen, se usa la descripción */}
            <SlideLink link={banner.link} label={banner.title || banner.subtitle || banner.buttonText ? undefined : banner.alt}>
              <BannerPicture banner={banner} className="absolute inset-0 size-full object-cover object-[center_40%]" eager={i === 0} />
              <BannerText banner={banner} />
            </SlideLink>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="absolute top-1/2 left-3 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-brand shadow-soft hover:bg-white md:grid" aria-label="Banner anterior">
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute top-1/2 right-3 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-brand shadow-soft hover:bg-white md:grid" aria-label="Banner siguiente">
            <ChevronRight className="size-6" />
          </button>
          <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver banner ${i + 1}`}
                aria-current={i === current}
                className={`h-2 rounded-full shadow transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/90'}`}
              />
            ))}
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              className="ml-2 grid size-7 place-items-center rounded-full bg-white/85 text-brand shadow hover:bg-white"
              aria-label={userPaused ? 'Reanudar el carrusel' : 'Pausar el carrusel'}
            >
              {userPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
