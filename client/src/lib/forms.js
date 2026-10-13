/**
 * Muestra en el formulario los errores que devuelve la API.
 * Si el backend indica el campo (details[].field), el error aparece bajo ese campo;
 * si no, se muestra como mensaje general.
 *
 * Devuelve el mensaje general (o null si todos los errores tenían campo).
 */
export function applyApiErrors(err, setError, knownFields) {
  const fieldErrors = (err.details ?? []).filter((d) => knownFields.includes(d.field));
  fieldErrors.forEach((detail) => setError(detail.field, { message: detail.message }));
  return fieldErrors.length ? null : err.message;
}
