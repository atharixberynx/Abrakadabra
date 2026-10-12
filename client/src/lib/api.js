/**
 * Cliente HTTP de la API.
 * Siempre usa rutas relativas (/api/…): en local las reenvía el proxy de Vite y en
 * producción el rewrite de vercel.json, así la cookie de sesión es de primera parte.
 * (En la Fase 2 se agrega el token de acceso y la renovación automática de sesión.)
 */
const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch(path, { method = 'GET', body, headers, signal } = {}) {
  const isFormData = body instanceof FormData;
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      credentials: 'include',
      headers: {
        ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'No se pudo conectar con la tienda. Revisa tu conexión a internet.');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.message ?? 'Ocurrió un problema al conectar con la tienda.',
      data?.error?.details,
    );
  }
  return data;
}
