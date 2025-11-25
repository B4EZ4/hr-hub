// Utilidades de autenticación custom
const SESSION_TOKEN_KEY = 'session_token';
const SESSION_EXPIRES_KEY = 'session_expires';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  department?: string;
  position?: string;
  status: string;
}

export interface Session {
  token: string;
  expires_at: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
  roles: string[];
}

// Guardar sesión en localStorage
export const saveSession = (session: Session, user: User) => {
  localStorage.setItem(SESSION_TOKEN_KEY, session.token);
  localStorage.setItem(SESSION_EXPIRES_KEY, session.expires_at);
  localStorage.setItem('user', JSON.stringify(user));
};

// Obtener token de sesión
export const getSessionToken = (): string | null => {
  return localStorage.getItem(SESSION_TOKEN_KEY);
};

// Verificar si sesión está expirada
export const isSessionExpired = (): boolean => {
  const expiresAt = localStorage.getItem(SESSION_EXPIRES_KEY);
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
};

// Limpiar sesión
export const clearSession = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_EXPIRES_KEY);
  localStorage.removeItem('user');
};

// Login
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth?action=login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ username, password }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al iniciar sesión');
  }

  const data: AuthResponse = await response.json();
  saveSession(data.session, data.user);
  return data;
};

// Signup
export const signup = async (userData: {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  department?: string;
  position?: string;
}): Promise<{ message: string; user: User }> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth?action=signup`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'x-session-token': getSessionToken() || '',
      },
      body: JSON.stringify(userData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al registrar usuario');
  }

  return await response.json();
};

// Logout
export const logout = async (): Promise<void> => {
  const token = getSessionToken();
  if (!token) return;

  try {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth?action=logout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'x-session-token': token,
        },
      }
    );
  } finally {
    clearSession();
  }
};

// Verificar sesión actual
export const verifySession = async (): Promise<AuthResponse | null> => {
  const token = getSessionToken();

  if (!token || isSessionExpired()) {
    clearSession();
    return null;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth?action=verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'x-session-token': token,
        },
      }
    );

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = await response.json();
    return {
      user: data.user,
      session: { token, expires_at: localStorage.getItem(SESSION_EXPIRES_KEY) || '' },
      roles: data.roles
    };
  } catch (error) {
    clearSession();
    return null;
  }
};
