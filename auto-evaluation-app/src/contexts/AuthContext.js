import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const authEventId = useRef(0);

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
      (_event, session) => {
        const eventId = authEventId.current + 1;
        authEventId.current = eventId;

        // Supabase warns against awaiting Supabase calls directly inside
        // onAuthStateChange. Doing the profile request synchronously from this
        // callback can keep the auth client lock open and make subsequent login
        // attempts appear to do nothing. Defer hydration to the next tick so the
        // auth event can finish first.
        setTimeout(async () => {
          try {
            const u = await hydrateUser(session);
            if (active && authEventId.current === eventId) setUser(u);
          } catch (err) {
            console.error('[AuthContext] auth state hydration failed:', err);
            if (active && authEventId.current === eventId) setUser(null);
          }
        }, 0);
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
    if (!u) throw new Error('Connexion impossible : profil utilisateur introuvable.');
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
    if (!u) throw new Error('Inscription impossible : profil utilisateur introuvable.');
    setUser(u);
    return u;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const AuthConsumer = ({ children }) => {
  const { user, loading, isAuthenticated, login, logout, register } = useAuth();
  const isLoggedIn = isAuthenticated;
  return children({ isLoggedIn, user, loading, login, logout, register });
};
