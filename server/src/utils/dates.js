/**
 * Fechas en hora de El Salvador (UTC-6, sin horario de verano).
 * Sirven para "pedidos de hoy" y "ventas del mes" aunque el servidor esté en otra zona horaria.
 */
const SV_OFFSET_MS = -6 * 60 * 60 * 1000;

/** Convierte un instante a la "hora de pared" de El Salvador (como objeto Date en UTC) */
const toSv = (date) => new Date(date.getTime() + SV_OFFSET_MS);
const fromSv = (svDate) => new Date(svDate.getTime() - SV_OFFSET_MS);

export function startOfDaySV(date = new Date()) {
  const sv = toSv(date);
  return fromSv(new Date(Date.UTC(sv.getUTCFullYear(), sv.getUTCMonth(), sv.getUTCDate())));
}

export function startOfMonthSV(date = new Date(), monthOffset = 0) {
  const sv = toSv(date);
  return fromSv(new Date(Date.UTC(sv.getUTCFullYear(), sv.getUTCMonth() + monthOffset, 1)));
}

/** Mismo instante del mes anterior (para comparar el mes en curso con el mismo tramo del pasado) */
export function sameMomentLastMonthSV(date = new Date()) {
  const sv = toSv(date);
  const lastMonth = new Date(Date.UTC(sv.getUTCFullYear(), sv.getUTCMonth() - 1, 1));
  const daysInLastMonth = new Date(Date.UTC(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(sv.getUTCDate(), daysInLastMonth);
  return fromSv(
    new Date(
      Date.UTC(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth(), day, sv.getUTCHours(), sv.getUTCMinutes(), sv.getUTCSeconds()),
    ),
  );
}

/** "2026-10-13" (fecha local de El Salvador) → inicio y fin de ese día como instantes */
export function svDayRange(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const start = fromSv(new Date(Date.UTC(y, m - 1, d)));
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}
