/**
 * A dónde ir después de iniciar sesión o registrarse.
 * - Si la persona venía de una página protegida (p. ej. /checkout), vuelve ahí.
 * - Si no, las admins van al panel y las clientas a "Mi cuenta".
 * Solo se aceptan rutas internas que empiecen con "/" (nunca "//otro-sitio.com").
 */
export function getRedirectTarget(location, user) {
  const from = location.state?.from;
  const path = from ? `${from.pathname}${from.search ?? ''}` : null;
  if (path && path.startsWith('/') && !path.startsWith('//')) return path;
  return user?.role === 'admin' ? '/admin' : '/cuenta';
}
