/**
 * Barra de anuncio superior con mensajes que rotan cada 4 s.
 * Se pausa al pasar el cursor o enfocar, y no rota si la persona prefiere menos movimiento.
 */
import { useEffect, useState } from 'react';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';
import { StarIcon } from '../ui/StarIcon.jsx';

const ROTATE_MS = 4000;

export function AnnouncementBar({ className = 'bg-brand' }) {
  const messages = useStoreInfo().announcements;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (paused || reduceMotion || messages.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, messages.length]);

  return (
    <div
      className={`${className} px-4 py-2 text-center text-xs tracking-wider text-white sm:py-2.5 sm:text-sm`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p aria-live="polite" className="flex items-center justify-center gap-2">
        <StarIcon className="size-3 shrink-0 text-gold" />
        <span key={index} className="animate-[fadeIn_400ms_ease-out]">
          {messages[index]}
        </span>
        <StarIcon className="size-3 shrink-0 text-gold" />
      </p>
    </div>
  );
}
