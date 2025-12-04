import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authLib from '@/lib/auth';
import { syncSupabaseSessionToken } from '@/integrations/supabase/client';

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
        syncSupabaseSessionToken();
      } else {
        setUser(null);
        setSession(null);
        setRoles([]);
        syncSupabaseSessionToken();
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
      setSession(null);
      setRoles([]);
      syncSupabaseSessionToken();
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
      syncSupabaseSessionToken();
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
    syncSupabaseSessionToken();
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
