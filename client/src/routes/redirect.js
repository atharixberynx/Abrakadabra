/**
 * A dónde ir después de iniciar sesión o registrarse.
 * - Si la persona venía de una página protegida (p. ej. /checkout), vuelve ahí.
 * - Si no, las admins van al panel y las clientas a "Mi cuenta".
 * Solo se aceptan rutas internas que empiecen con "/" (nunca "//otro-sitio.com"), y las del
 * panel solo para cuentas admin.
 */
export function getRedirectTarget(location, user) {
  const isAdmin = user?.role === 'admin';
  const from = location.state?.from;
  const path = from ? `${from.pathname}${from.search ?? ''}` : null;
  const internal = path && path.startsWith('/') && !path.startsWith('//');
  // Una página del panel solo se recuerda si quien entra es admin; si no, mostraría "No tienes acceso"
  const allowed = internal && (isAdmin || !path.startsWith('/admin'));
  if (allowed) return path;
  return isAdmin ? '/admin' : '/cuenta';
}
