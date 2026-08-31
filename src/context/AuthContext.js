"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isSuperAdmin } from "@/lib/superAdmin";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [businessUser, setBusinessUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Load business user profile + permissions from Supabase
  const loadBusinessUser = async (authUser) => {
    if (!authUser) {
      setBusinessUser(null);
      setPermissions([]);
      return;
    }
    // Super admin has no business user record
    if (isSuperAdmin(authUser)) {
      setBusinessUser(null);
      setPermissions([]);
      return;
    }
    try {
      const { data: bu } = await supabase
        .from('business_users')
        .select(`
          *,
          business:businesses(*),
          role:roles(
            *,
            role_permissions(
              permission_id
            )
          )
        `)
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .single();

      if (bu) {
        setBusinessUser(bu);
        // Extract permissions from the role
        const perms = bu.role?.role_permissions?.map(rp => rp.permission_id) || [];
        // Admins get all permissions
        if (bu.is_admin) {
          const { data: allPerms } = await supabase
            .from('permissions')
            .select('id');
          setPermissions(allPerms?.map(p => p.id) || perms);
        } else {
          setPermissions(perms);
        }
      }
    } catch (err) {
      console.error('Error loading business user:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadBusinessUser(session.user);
          }
          setInitialized(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setBusinessUser(null);
        setPermissions([]);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadBusinessUser(session.user);
        }
      }
    });

    return () => {
      mounted = false;
      if (data?.subscription) data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    setUser(null);
    setBusinessUser(null);
    setPermissions([]);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = useMemo(() => ({
    user,
    session,
    loading,
    initialized,
    businessUser,
    businessId: businessUser?.business_id ?? null,
    business: businessUser?.business ?? null,
    role: businessUser?.role ?? null,
    permissions,
    isAdmin: businessUser?.is_admin ?? false,
    isSuperAdmin: isSuperAdmin(user),
    signIn,
    signOut,
  }), [user, session, loading, initialized, businessUser, permissions]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      loading: true,
      initialized: false,
      businessUser: null,
      businessId: null,
      business: null,
      role: null,
      permissions: [],
      isAdmin: false,
      isSuperAdmin: false,
      signIn: async () => {},
      signOut: async () => {},
    };
  }
  return context;
}

export function useRequireAuth(redirectTo = "/login") {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, initialized, router, redirectTo]);

  if (loading || !initialized) return null;
  return user;
}
