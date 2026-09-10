-- ============================================================
-- AGRI POS SaaS - SUPPLEMENTAL MIGRATIONS
-- Run this AFTER schema.sql AND schema-saas.sql
-- Safe to run multiple times (IF NOT EXISTS + DROP POLICY IF EXISTS everywhere)
-- ============================================================

-- ============================================================
-- app_config: global key/value configuration store
-- MUST be created BEFORE is_super_admin() because LANGUAGE sql
-- functions validate table references at definition time in PostgreSQL.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Seed the super-admin email (update value here if email changes)
INSERT INTO public.app_config (key, value)
VALUES ('super_admin_email', 'superadmin@agripos.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- HELPER: is_super_admin()
-- Checks if the currently authenticated user's email matches
-- the super_admin_email stored in app_config.
-- Uses auth.email() which is natively supported by Supabase.
-- app_config must already exist above before this function runs.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.app_config
    WHERE  key   = 'super_admin_email'
      AND  value = auth.email()
  );
$$;

-- ============================================================
-- 1. plan_features: configuration-driven limits per plan
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plan_features (
    id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id       TEXT        NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    feature_key   TEXT        NOT NULL,
    feature_value TEXT        NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (plan_id, feature_key)
);

-- Seed feature limits for all plans
INSERT INTO public.plan_features (plan_id, feature_key, feature_value) VALUES
    ('starter',      'max_products',  '1000'),
    ('starter',      'max_users',     '2'),
    ('starter',      'max_customers', '1000'),
    ('starter',      'max_suppliers', '100'),
    ('starter',      'reports',       'basic'),

    ('business',     'max_products',  '10000'),
    ('business',     'max_users',     '5'),
    ('business',     'max_customers', '10000'),
    ('business',     'max_suppliers', '500'),
    ('business',     'reports',       'advanced'),

    ('professional', 'max_products',  'unlimited'),
    ('professional', 'max_users',     '15'),
    ('professional', 'max_customers', 'unlimited'),
    ('professional', 'max_suppliers', 'unlimited'),
    ('professional', 'reports',       'advanced')
ON CONFLICT (plan_id, feature_key) DO UPDATE
    SET feature_value = EXCLUDED.feature_value;


-- ============================================================
-- 2. subscriptions: add missing columns (idempotent)
--    start_date / end_date / auto_renew already defined in
--    schema-saas.sql; ADD COLUMN IF NOT EXISTS is a no-op.
--    cancelled_at is the only genuinely new column.
-- ============================================================
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS auto_renew   BOOLEAN     DEFAULT false;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS end_date     TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS start_date   TIMESTAMPTZ;


-- ============================================================
-- 3. subscription_history: plan/status change audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    old_plan_id TEXT,
    new_plan_id TEXT,
    action      TEXT        NOT NULL,
    old_status  TEXT,
    new_status  TEXT,
    changed_by  UUID        REFERENCES auth.users(id),
    reason      TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_history_business ON public.subscription_history(business_id);
CREATE INDEX IF NOT EXISTS idx_sub_history_created  ON public.subscription_history(created_at DESC);


-- ============================================================
-- 4. super_admin_audit_logs: Super Admin administrative actions
--
--    NOTE: The existing audit_logs table (in schema.sql) tracks
--    row-level data changes (CREATE/UPDATE/DELETE on records).
--    This separate table tracks Super Admin platform actions
--    (plan overrides, business suspension, etc.) to avoid
--    schema conflicts with the existing audit_logs table.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.super_admin_audit_logs (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id    UUID        NOT NULL REFERENCES auth.users(id),
    action      TEXT        NOT NULL,
    business_id UUID        REFERENCES public.businesses(id),
    details     JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sa_audit_admin   ON public.super_admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_sa_audit_created ON public.super_admin_audit_logs(created_at DESC);


-- ============================================================
-- 5. Enable Row Level Security
-- ============================================================
ALTER TABLE public.app_config             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_audit_logs ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. RLS Policies (idempotent: DROP before CREATE)
-- ============================================================

-- app_config: all authenticated users can read; only super-admin can write
DROP POLICY IF EXISTS "app_config_auth_read"         ON public.app_config;
DROP POLICY IF EXISTS "app_config_super_admin_write" ON public.app_config;
CREATE POLICY "app_config_auth_read"
    ON public.app_config FOR SELECT
    TO authenticated USING (true);
CREATE POLICY "app_config_super_admin_write"
    ON public.app_config FOR ALL
    TO authenticated USING (public.is_super_admin());

-- plan_features: readable by all authenticated users; writable by super-admin
DROP POLICY IF EXISTS "plan_features_auth_read"         ON public.plan_features;
DROP POLICY IF EXISTS "plan_features_super_admin_write" ON public.plan_features;
CREATE POLICY "plan_features_auth_read"
    ON public.plan_features FOR SELECT
    TO authenticated USING (true);
CREATE POLICY "plan_features_super_admin_write"
    ON public.plan_features FOR ALL
    TO authenticated USING (public.is_super_admin());

-- subscription_history: businesses read their own; super-admin does all
DROP POLICY IF EXISTS "sub_history_business_read"   ON public.subscription_history;
DROP POLICY IF EXISTS "sub_history_super_admin_all" ON public.subscription_history;
CREATE POLICY "sub_history_business_read"
    ON public.subscription_history FOR SELECT
    TO authenticated
    USING (
        business_id IN (
            SELECT business_id
            FROM   public.business_users
            WHERE  user_id   = auth.uid()
              AND  is_active = true
        )
    );
CREATE POLICY "sub_history_super_admin_all"
    ON public.subscription_history FOR ALL
    TO authenticated USING (public.is_super_admin());

-- super_admin_audit_logs: super-admin only
DROP POLICY IF EXISTS "sa_audit_logs_super_admin_all" ON public.super_admin_audit_logs;
CREATE POLICY "sa_audit_logs_super_admin_all"
    ON public.super_admin_audit_logs FOR ALL
    TO authenticated USING (public.is_super_admin());
