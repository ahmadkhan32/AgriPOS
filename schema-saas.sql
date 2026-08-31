-- ============================================================
-- AGRI POS SaaS - MULTI-TENANT DATABASE SCHEMA
-- Run this AFTER the original schema.sql in Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS everywhere)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 2,
  max_branches INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 1000,
  offline_enabled BOOLEAN DEFAULT true,
  advanced_reports BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO subscription_plans (id, name, monthly_price, yearly_price, max_users, max_branches, max_products, offline_enabled, advanced_reports, sort_order) VALUES
  ('starter',      'Starter',      1999,  19990, 2,  1,    1000,    true,  false, 1),
  ('business',     'Business',     3999,  39990, 5,  2,    10000,   true,  true,  2),
  ('professional', 'Professional', 6999,  69990, 15, 5,    -1,      true,  true,  3),
  ('enterprise',   'Enterprise',   0,     0,     -1, -1,   -1,      true,  true,  4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. BUSINESSES (Multi-tenant root)
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(30),
  address TEXT,
  logo_url TEXT,
  plan_id VARCHAR(50) REFERENCES subscription_plans(id) DEFAULT 'starter',
  status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial','active','suspended','expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_code ON businesses(business_code);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);

-- ============================================================
-- 3. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) REFERENCES subscription_plans(id),
  billing_cycle VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','trial')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);

-- ============================================================
-- 4. BRANCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(30),
  is_main BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_business ON branches(business_id);

-- ============================================================
-- 5. PERMISSIONS REGISTRY
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(100) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  module VARCHAR(50) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO permissions (id, label, module, sort_order) VALUES
  ('sales.view','View Sales','Sales',10),
  ('sales.create','Create Sale','Sales',11),
  ('sales.edit','Edit Sale','Sales',12),
  ('sales.delete','Delete Sale','Sales',13),
  ('sales.discount','Apply Discount','Sales',14),
  ('products.view','View Products','Products',20),
  ('products.create','Create Product','Products',21),
  ('products.edit','Edit Product','Products',22),
  ('products.delete','Delete Product','Products',23),
  ('products.cost','View Product Cost','Products',24),
  ('inventory.view','View Inventory','Inventory',30),
  ('inventory.adjust','Adjust Stock','Inventory',31),
  ('purchases.view','View Purchases','Purchases',40),
  ('purchases.create','Create Purchase','Purchases',41),
  ('purchases.edit','Edit Purchase','Purchases',42),
  ('customers.view','View Customers','Customers',50),
  ('customers.create','Create Customer','Customers',51),
  ('customers.edit','Edit Customer','Customers',52),
  ('customers.delete','Delete Customer','Customers',53),
  ('suppliers.view','View Suppliers','Suppliers',60),
  ('suppliers.create','Create Supplier','Suppliers',61),
  ('suppliers.edit','Edit Supplier','Suppliers',62),
  ('reports.view','View Reports','Reports',70),
  ('reports.financial','View Financial Reports','Reports',71),
  ('reports.export','Export Reports','Reports',72),
  ('users.view','View Users','Users',80),
  ('users.create','Create User','Users',81),
  ('users.edit','Edit User','Users',82),
  ('users.delete','Delete User','Users',83),
  ('settings.view','View Settings','Settings',90),
  ('settings.edit','Edit Settings','Settings',91)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. ROLES (Per-business)
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_business ON roles(business_id);

-- ============================================================
-- 7. ROLE PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(100) REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- 8. BUSINESS USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  full_name VARCHAR(255),
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_business ON business_users(business_id);

-- ============================================================
-- 9. ADD business_id TO EXISTING TABLES
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- ============================================================
-- 10. SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(255),
  address TEXT,
  total_purchases DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  total_due DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_id);

-- ============================================================
-- 11. PURCHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name VARCHAR(255),
  reference_no VARCHAR(100),
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  due_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('pending','received','partial')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_business ON purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  product_unit VARCHAR(20),
  quantity DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  item_total DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);

-- ============================================================
-- 12. EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);

-- ============================================================
-- 13. HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT business_id FROM business_users
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

-- ============================================================
-- 14. RLS
-- ============================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_public_read" ON subscription_plans;
CREATE POLICY "plans_public_read" ON subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "permissions_auth_read" ON permissions;
CREATE POLICY "permissions_auth_read" ON permissions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "businesses_own_read" ON businesses;
CREATE POLICY "businesses_own_read" ON businesses
  FOR SELECT USING (id = get_my_business_id());

DROP POLICY IF EXISTS "business_users_own" ON business_users;
CREATE POLICY "business_users_own" ON business_users
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "roles_business_scope" ON roles;
CREATE POLICY "roles_business_scope" ON roles
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "role_permissions_business" ON role_permissions;
CREATE POLICY "role_permissions_business" ON role_permissions
  FOR ALL USING (role_id IN (SELECT id FROM roles WHERE business_id = get_my_business_id()));

DROP POLICY IF EXISTS "branches_business_scope" ON branches;
CREATE POLICY "branches_business_scope" ON branches
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "suppliers_business_scope" ON suppliers;
CREATE POLICY "suppliers_business_scope" ON suppliers
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "purchases_business_scope" ON purchases;
CREATE POLICY "purchases_business_scope" ON purchases
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "purchase_items_business" ON purchase_items;
CREATE POLICY "purchase_items_business" ON purchase_items
  FOR ALL USING (purchase_id IN (SELECT id FROM purchases WHERE business_id = get_my_business_id()));

DROP POLICY IF EXISTS "expenses_business_scope" ON expenses;
CREATE POLICY "expenses_business_scope" ON expenses
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "subscriptions_business" ON subscriptions;
CREATE POLICY "subscriptions_business" ON subscriptions
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_auth_write" ON products;
DROP POLICY IF EXISTS "products_business_scope" ON products;
CREATE POLICY "products_business_scope" ON products
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "customers_public_read" ON customers;
DROP POLICY IF EXISTS "customers_auth_write" ON customers;
DROP POLICY IF EXISTS "customers_business_scope" ON customers;
CREATE POLICY "customers_business_scope" ON customers
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "invoices_public_read" ON invoices;
DROP POLICY IF EXISTS "invoices_auth_write" ON invoices;
DROP POLICY IF EXISTS "invoices_business_scope" ON invoices;
CREATE POLICY "invoices_business_scope" ON invoices
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "invoice_items_public_read" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_auth_write" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_business" ON invoice_items;
CREATE POLICY "invoice_items_business" ON invoice_items
  FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE business_id = get_my_business_id()));

DROP POLICY IF EXISTS "audit_logs_public_read" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_auth_write" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_business_scope" ON audit_logs;
CREATE POLICY "audit_logs_business_scope" ON audit_logs
  FOR ALL USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "shop_settings_public_read" ON shop_settings;
DROP POLICY IF EXISTS "shop_settings_auth_write" ON shop_settings;
DROP POLICY IF EXISTS "shop_settings_business_scope" ON shop_settings;
CREATE POLICY "shop_settings_business_scope" ON shop_settings
  FOR ALL USING (business_id = get_my_business_id());
