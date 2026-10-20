/**
 * Datos de la tienda que la administradora edita en Panel › Ajustes (anuncios, WhatsApp,
 * dirección, horario, mapa, redes y envíos), combinados con los valores por defecto de config/store.js.
 *
 *   const info = useStoreInfo();
 *   info.fullAddress, info.hoursText, info.whatsappUrl('Hola…'), info.maps.directionsUrl…
 *
 * Mientras cargan los ajustes (o si la API no responde), se usan los valores por defecto,
 * así la tienda nunca se ve vacía. Se actualiza sola cuando el panel guarda cambios.
 */
import { createContext, useContext, useMemo } from 'react';
import { store } from '../config/store.js';
import { useFetch } from '../hooks/useFetch.js';

const StoreInfoContext = createContext(null);

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

/** "https://www.instagram.com/abrakadabraes/" → "@abrakadabraes" */
function handleFromUrl(url) {
  const last = url.replace(/\/+$/, '').split('/').pop();
  return last ? `@${last}` : '';
}

function buildStoreInfo(settings) {
  const s = settings ?? {};
  const address = s.address?.line1 ? s.address : store.address;
  const hours = s.hours?.length ? s.hours : store.hours;
  const fullAddress = [address.line1, address.line2, address.city].filter(Boolean).join(', ');
  const whatsappNumber = s.whatsappNumber || store.whatsapp.number;
  const socialUrls = settings
    ? [
        { name: 'Instagram', url: s.instagramUrl },
        { name: 'Facebook', url: s.facebookUrl },
      ]
    : store.social;

  return {
    ...store,
    announcements: s.announcements?.length ? s.announcements : store.announcements,
    address,
    fullAddress,
    hours,
    // "Lunes a viernes de 8:00 a. m. a 4:30 p. m.; sábados de 8:00 a. m. a 12:00 m."
    hoursText: hours.map((h, i) => `${i === 0 ? h.days : lowerFirst(h.days)} de ${h.time}`).join('; '),
    maps: {
      directionsUrl: s.mapsUrl || store.maps.directionsUrl,
      // Mapa embebido sin API key, a partir de la dirección vigente
      embedUrl: `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`,
    },
    whatsapp: { ...store.whatsapp, number: whatsappNumber },
    shipping: {
      enabled: s.shippingEnabled ?? store.shipping.enabled,
      fee: s.shippingFee ?? store.shipping.fee,
      time: s.shippingTime || store.shipping.time,
    },
    social: socialUrls.filter((n) => n.url).map((n) => ({ ...n, handle: n.handle ?? handleFromUrl(n.url) })),
    /** Enlace de WhatsApp de la tienda con un mensaje prellenado */
    whatsappUrl: (message = '') => `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`,
  };
}

export function StoreInfoProvider({ children }) {
  const { data } = useFetch('/settings');
  const info = useMemo(() => buildStoreInfo(data?.settings), [data]);
  return <StoreInfoContext.Provider value={info}>{children}</StoreInfoContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStoreInfo() {
  const context = useContext(StoreInfoContext);
  if (!context) throw new Error('useStoreInfo debe usarse dentro de <StoreInfoProvider>');
  return context;
}
