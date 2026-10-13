/**
 * Cliente HTTP de la API.
 *
 * - Siempre usa rutas relativas (/api/…): en local las reenvía el proxy de Vite y en
 *   producción el rewrite de vercel.json, así la cookie de sesión es de primera parte.
 * - El token de acceso vive SOLO en memoria (esta variable), nunca en localStorage.
 * - Si una petición responde 401, renueva la sesión una vez con el refresh token
 *   (cookie httpOnly) y repite la petición. Varias renovaciones simultáneas se
 *   agrupan en una sola.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

let accessToken = null;
let refreshPromise = null;
let sessionExpiredHandler = null;

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function setAccessToken(token) {
  accessToken = token;
}

/** AuthContext registra aquí qué hacer cuando la sesión ya no se puede renovar */
export function onSessionExpired(handler) {
  sessionExpiredHandler = handler;
}

async function rawRequest(path, { method = 'GET', body, headers, signal } = {}) {
  const isFormData = body instanceof FormData;
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      credentials: 'include',
      headers: {
        ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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

/** Pide un token de acceso nuevo usando la cookie. Devuelve { user, accessToken } */
export function refreshSession() {
  refreshPromise ??= rawRequest('/auth/refresh', { method: 'POST' })
    .then((data) => {
      accessToken = data.accessToken;
      return data;
    })
    .catch((err) => {
      accessToken = null;
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  try {
    return await rawRequest(path, options);
  } catch (err) {
    // Las rutas de /auth manejan sus propios 401 (p. ej. contraseña incorrecta)
    const shouldRefresh = err.status === 401 && !path.startsWith('/auth/');
    if (!shouldRefresh) throw err;

    try {
      await refreshSession();
    } catch {
      sessionExpiredHandler?.();
      throw err;
    }
    return rawRequest(path, options);
  }
}
