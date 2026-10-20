/**
 * Ajustes de la tienda con caché en memoria (se leen en cada pedido y en cada visita).
 */
import { DEFAULT_SETTINGS } from '../config/store.js';
import { Settings } from '../models/Settings.js';

let cache = null;

/** Ajustes guardados, completados con los valores por defecto */
export async function getSettings() {
  if (cache) return cache;
  const saved = (await Settings.findById('tienda').lean()) ?? {};
  const pick = (key) => (saved[key] === undefined || saved[key] === null ? DEFAULT_SETTINGS[key] : saved[key]);
  cache = {
    announcements: saved.announcements?.length ? saved.announcements : DEFAULT_SETTINGS.announcements,
    whatsappNumber: pick('whatsappNumber'),
    address: saved.address?.line1 ? saved.address : DEFAULT_SETTINGS.address,
    hours: saved.hours?.length ? saved.hours : DEFAULT_SETTINGS.hours,
    mapsUrl: pick('mapsUrl'),
    instagramUrl: pick('instagramUrl'),
    facebookUrl: pick('facebookUrl'),
    shippingEnabled: pick('shippingEnabled'),
    shippingFee: pick('shippingFee'),
    shippingTime: pick('shippingTime'),
    updatedAt: saved.updatedAt ?? null,
  };
  return cache;
}

export async function updateSettings(data) {
  await Settings.findByIdAndUpdate('tienda', { $set: data }, { upsert: true, runValidators: true });
  cache = null;
  return getSettings();
}

/** Para pruebas: olvida la caché */
export function resetSettingsCache() {
  cache = null;
}

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

/**
 * Datos de retiro que se copian en cada pedido:
 *   address: "Alameda Manuel Enrique Araujo 201, Centro Comercial Feria Rosa, local 201-G, San Salvador, El Salvador"
 *   hours:   "lunes a viernes de 8:00 a. m. a 4:30 p. m.; sábados de 8:00 a. m. a 12:00 m."
 */
export async function getPickupInfo() {
  const { address, hours } = await getSettings();
  return {
    address: [address.line1, address.line2, address.city].filter(Boolean).join(', '),
    hours: hours.map((h) => `${lowerFirst(h.days)} de ${h.time}`).join('; '),
  };
}
