/**
 * Contenido de las páginas informativas (paginas-informativas.json) y relleno de marcadores.
 *
 *   const fill = useFillPlaceholders();
 *   fill('Visítanos en {direccion}') → 'Visítanos en Alameda Manuel Enrique Araujo 201, …'
 */
import { useCallback } from 'react';
import content from './paginas-informativas.json';
import { useStoreInfo } from '../context/StoreInfoContext.jsx';

export const pages = content;

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

/** "50377771234" → "+503 7777-1234" */
function formatWhatsapp(number) {
  const digits = number.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('503')) return `+503 ${digits.slice(3, 7)}-${digits.slice(7)}`;
  return `+${digits}`;
}

export function useFillPlaceholders() {
  const info = useStoreInfo();
  return useCallback(
    (text = '') =>
      text
        .replaceAll('{tienda}', info.name)
        .replaceAll('{direccion}', info.fullAddress)
        // El horario va a mitad de frase ("en nuestro horario: lunes a viernes…"): empieza en minúscula
        .replaceAll('{horario}', `${lowerFirst(info.hoursText)}${info.hoursText.endsWith('.') ? '' : '.'}`)
        .replaceAll('{whatsapp}', formatWhatsapp(info.whatsapp.number)),
    [info],
  );
}
