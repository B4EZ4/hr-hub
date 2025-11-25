import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authLib from '@/lib/auth';

interface AuthContextType {
  user: authLib.User | null;
  session: authLib.Session | null;
  roles: string[];
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<authLib.User | null>(null);
  const [session, setSession] = useState<authLib.Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshSession = async () => {
    try {
      const authData = await authLib.verifySession();
      if (authData) {
        setUser(authData.user);
        setSession(authData.session);
        setRoles(authData.roles);
      } else {
        setUser(null);
        setSession(null);
        setRoles([]);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
      setSession(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const authData = await authLib.login(username, password);
      setUser(authData.user);
      setSession(authData.session);
      setRoles(authData.roles);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const signOut = async () => {
    await authLib.logout();
    setUser(null);
    setSession(null);
    setRoles([]);
    navigate('/login');
  };

  const value = {
    user,
    session,
    roles,
    loading,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
