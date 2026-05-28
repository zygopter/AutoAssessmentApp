import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Build the app user object from a Supabase session by joining the profile row.
  const hydrateUser = async (session) => {
    if (!session) return null;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error || !profile) {
      // Token in localStorage but no matching profile (deleted user, RLS issue,
      // etc.). Purge the stale token so the client doesn't keep replaying it.
      console.warn('[AuthContext] session stale (profile missing), signing out');
      await supabase.auth.signOut();
      return null;
    }
    return { ...profile, email: session.user.email };
  };

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(async ({ data }) => {
        const u = await hydrateUser(data.session);
        if (active) {
          setUser(u);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[AuthContext] getSession failed:', err);
        if (active) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = await hydrateUser(session);
        if (active) setUser(u);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const u = await hydrateUser(data.session);
    setUser(u);
    return u;
  };

  const register = async ({ name, email, password, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) throw new Error(error.message);
    // If "Confirm email" is disabled, we get a session immediately.
    // Otherwise the user must confirm before login.
    if (!data.session) {
      throw new Error("Vérifie tes emails pour confirmer ton compte avant de te connecter.");
    }
    const u = await hydrateUser(data.session);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const AuthConsumer = ({ children }) => {
  const { user, loading, login, logout, register } = useAuth();
  const isLoggedIn = !!user;
  return children({ isLoggedIn, user, loading, login, logout, register });
};
