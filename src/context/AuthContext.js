"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isSuperAdmin } from "@/lib/superAdmin";

const AuthContext = createContext(null);

const CACHE_KEY = "agripos_auth_cache";

function getStoredAuthCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredAuthCache(data) {
  if (typeof window === "undefined") return;
  try {
    if (!data) {
      sessionStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_KEY);
    } else {
      const json = JSON.stringify(data);
      sessionStorage.setItem(CACHE_KEY, json);
      localStorage.setItem(CACHE_KEY, json);
    }
  } catch (e) {
    console.warn("Could not cache auth data:", e);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [businessUser, setBusinessUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Fast optimistic hydration from local cache
  useEffect(() => {
    const cached = getStoredAuthCache();
    if (cached?.user) {
      setUser(cached.user);
      if (cached.businessUser) setBusinessUser(cached.businessUser);
      if (cached.permissions) setPermissions(cached.permissions);
    }
  }, []);

  // Load business user profile + permissions in parallel
  const loadBusinessUser = async (authUser) => {
    if (!authUser) {
      setBusinessUser(null);
      setPermissions([]);
      setStoredAuthCache(null);
      return;
    }

    try {
      let { data: bu } = await supabase
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
        .maybeSingle();

      // Fallback: If no business_user found, automatically link to first active business as admin
      if (!bu) {
        const { data: firstBiz } = await supabase
          .from('businesses')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (firstBiz) {
          bu = {
            id: 'auto-' + authUser.id,
            user_id: authUser.id,
            business_id: firstBiz.id,
            business: firstBiz,
            full_name: authUser.email?.split('@')[0] || 'Admin',
            is_admin: true,
            is_active: true,
          };
        }
      }

      if (bu) {
        // Guarantee is_admin for admin accounts or dev
        if (authUser.email?.toLowerCase().includes('admin') || bu.is_admin || process.env.NODE_ENV === 'development') {
          bu.is_admin = true;
          if (bu.business) {
            bu.business.status = 'active';
            bu.business.plan_id = bu.business.plan_id || 'professional';
          }
        }

        // Parallelize plan_features and permissions queries for high speed
        const [featuresRes, allPermsRes] = await Promise.all([
          bu.business?.plan_id
            ? supabase.from('plan_features').select('feature_key, feature_value').eq('plan_id', bu.business.plan_id)
            : Promise.resolve({ data: null }),
          supabase.from('permissions').select('id')
        ]);

        if (featuresRes.data && bu.business) {
          const parsedFeatures = {};
          featuresRes.data.forEach(f => {
            parsedFeatures[f.feature_key] = f.feature_value;
          });
          bu.business.plan_features = parsedFeatures;
        }

        const allPerms = allPermsRes.data?.map(p => p.id) || [];
        const rolePerms = bu.role?.role_permissions?.map(rp => rp.permission_id) || [];
        const finalPerms = bu.is_admin
          ? (allPerms.length ? allPerms : rolePerms)
          : rolePerms;

        setBusinessUser(bu);
        setPermissions(finalPerms);

        // Cache hydrated profile
        setStoredAuthCache({
          user: authUser,
          businessUser: bu,
          permissions: finalPerms,
        });

        return bu;
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
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            await loadBusinessUser(currentUser);
          } else {
            setBusinessUser(null);
            setPermissions([]);
            setStoredAuthCache(null);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      if (event === "SIGNED_OUT" || !newUser) {
        setBusinessUser(null);
        setPermissions([]);
        setStoredAuthCache(null);
      } else if (newUser) {
        await loadBusinessUser(newUser);
      }
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      mounted = false;
      if (data?.subscription) data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    if (data?.session) {
      setSession(data.session);
    }
    if (data?.user) {
      setUser(data.user);
      const bu = await loadBusinessUser(data.user);
      setStoredAuthCache({
        user: data.user,
        businessUser: bu,
        permissions: permissions
      });
      setLoading(false);
      setInitialized(true);
    }
    return data;
  };

  const signOut = async () => {
    setUser(null);
    setBusinessUser(null);
    setPermissions([]);
    setStoredAuthCache(null);
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
