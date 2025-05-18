import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signupWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signupWithGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getUserProfile: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signupWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error: userError } = await supabase
      .from('signup')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
        }
      ]);
  
    if (userError) throw userError;
  };

  const signupWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  const login = async (email: string, password: string) => {
    const { data: userData, error: userError } = await supabase
      .from('signup')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
  
    if (userError) {
      if (userError.code === 'PGRST116') {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw new Error('An error occurred while checking your account');
    }
  
    if (userData) {
      const customUser = {
        id: userData.id,
        email: userData.email,
        app_metadata: {},
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name
        },
        aud: 'authenticated',
        created_at: userData.created_at || new Date().toISOString()
      } as unknown as User;
      
      setUser(customUser);
      
      const customSession = {
        access_token: 'custom_token_' + userData.id,
        refresh_token: 'custom_refresh_' + userData.id,
        expires_in: 3600,
        token_type: 'bearer',
        user: customUser
      } as unknown as Session;
      
      setSession(customSession);
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  const logout = async () => {
    if (user && session) {
      await supabase.auth.signOut();
    }
    
    setUser(null);
    setSession(null);
  };

  const getUserProfile = async () => {
    if (!user) return null;
  
    if (user.email) {
      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('email', user.email)
        .single();
    
      if (!error && data) return data;
      
      if (error && error.code === 'PGRST116' && user.app_metadata?.provider === 'google') {
        const { data: newUser, error: insertError } = await supabase
          .from('signup')
          .insert([
            {
              first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
              last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              email: user.email,
              auth_provider: 'google',
              auth_id: user.id
            }
          ])
          .select()
          .single();
          
        if (insertError) throw insertError;
        return newUser;
      }
      
      if (error) throw error;
    }
    
    return {
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name,
      last_name: user.user_metadata?.last_name
    };
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated,
        signupWithEmail,
        signupWithGoogle,
        login,
        loginWithGoogle,
        logout,
        getUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};