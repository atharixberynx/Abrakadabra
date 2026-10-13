/**
 * Sesión de la usuaria.
 *
 * Al cargar la página se intenta recuperar la sesión con el refresh token (cookie).
 * Para no hacer esa petición a cada visitante anónima, se guarda en el navegador
 * una simple bandera "hay sesión" (nunca el token).
 *
 *   const { user, status, login, logout } = useAuth();
 *   status: 'loading' | 'authenticated' | 'anonymous'
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, onSessionExpired, refreshSession, setAccessToken } from '../lib/api.js';

const AuthContext = createContext(null);
const SESSION_FLAG = 'abk_has_session';

// Con "Recuérdame" la bandera va en localStorage (sobrevive al cerrar el navegador);
// sin él, en sessionStorage (se borra junto con la cookie de sesión).
function readFlag() {
  try {
    return localStorage.getItem(SESSION_FLAG) === '1' || sessionStorage.getItem(SESSION_FLAG) === '1';
  } catch {
    return true; // si no se puede leer, se intenta recuperar la sesión igual
  }
}

function writeFlag(hasSession, persistent = true) {
  try {
    localStorage.removeItem(SESSION_FLAG);
    sessionStorage.removeItem(SESSION_FLAG);
    if (hasSession) (persistent ? localStorage : sessionStorage).setItem(SESSION_FLAG, '1');
  } catch {
    // modo privado o almacenamiento bloqueado: no es crítico
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (readFlag() ? 'loading' : 'anonymous'));

  const startSession = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
    writeFlag(true, data.persistent !== false);
    return data.user;
  }, []);

  const endSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
    writeFlag(false);
  }, []);

  // Recuperar la sesión al cargar la página
  useEffect(() => {
    onSessionExpired(endSession);
    if (!readFlag()) return;

    let active = true;
    refreshSession()
      .then((data) => active && startSession(data))
      .catch(() => active && endSession());
    return () => {
      active = false;
    };
  }, [startSession, endSession]);

  const login = useCallback(
    async (credentials) =>
      startSession(await apiFetch('/auth/login', { method: 'POST', body: credentials })),
    [startSession],
  );

  const register = useCallback(
    async (data) => startSession(await apiFetch('/auth/register', { method: 'POST', body: data })),
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      endSession();
    }
  }, [endSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      startSession,
      setUser,
    }),
    [user, status, login, register, logout, startSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
