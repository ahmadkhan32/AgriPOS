-- ============================================================
-- AGRI POS - SUPABASE DATABASE SCHEMA
-- Production-ready POS and Inventory Management System
-- Idempotent: safe to run multiple times (IF NOT EXISTS everywhere)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SHOP SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('pesticide', 'fertilizer', 'seed')),
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('KG', 'Gram', 'Liter', 'ML', 'Piece')),
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast product search
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============================================================
-- CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  address TEXT,
  total_purchase DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for phone search (critical for fast lookup)
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ============================================================
-- INVOICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_address TEXT,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  due_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for invoice date queries
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- ============================================================
-- INVOICE ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  product_unit VARCHAR(20),
  quantity DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  item_total DECIMAL(10, 2) NOT NULL
);

-- Create index for invoice items lookup
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Allow public read access
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - Drop if exists, then recreate
-- ============================================================

-- Shop Settings
DROP POLICY IF EXISTS "shop_settings_public_read" ON shop_settings;
DROP POLICY IF EXISTS "shop_settings_auth_write" ON shop_settings;
CREATE POLICY "shop_settings_public_read" ON shop_settings FOR SELECT USING (true);
CREATE POLICY "shop_settings_auth_write" ON shop_settings FOR ALL USING (auth.role() = 'authenticated');

-- Products
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_auth_write" ON products;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_auth_write" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Customers
DROP POLICY IF EXISTS "customers_public_read" ON customers;
DROP POLICY IF EXISTS "customers_auth_write" ON customers;
CREATE POLICY "customers_public_read" ON customers FOR SELECT USING (true);
CREATE POLICY "customers_auth_write" ON customers FOR ALL USING (auth.role() = 'authenticated');

-- Invoices
DROP POLICY IF EXISTS "invoices_public_read" ON invoices;
DROP POLICY IF EXISTS "invoices_auth_write" ON invoices;
CREATE POLICY "invoices_public_read" ON invoices FOR SELECT USING (true);
CREATE POLICY "invoices_auth_write" ON invoices FOR ALL USING (auth.role() = 'authenticated');

-- Invoice Items
DROP POLICY IF EXISTS "invoice_items_public_read" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_auth_write" ON invoice_items;
CREATE POLICY "invoice_items_public_read" ON invoice_items FOR SELECT USING (true);
CREATE POLICY "invoice_items_auth_write" ON invoice_items FOR ALL USING (auth.role() = 'authenticated');

-- Audit Logs
DROP POLICY IF EXISTS "audit_logs_public_read" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_auth_write" ON audit_logs;
CREATE POLICY "audit_logs_public_read" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_logs_auth_write" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET FOR SHOP LOGO
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-logos', 'shop-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "shop_logos_public_access" ON storage.objects;
CREATE POLICY "shop_logos_public_access" ON storage.objects
  FOR ALL USING (bucket_id = 'shop-logos');

-- ============================================================
-- FUNCTION TO LOG CHANGES
-- ============================================================
CREATE OR REPLACE FUNCTION log_change(
  p_table_name VARCHAR,
  p_record_id UUID,
  p_action VARCHAR,
  p_field_name VARCHAR DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, field_name, old_value, new_value, change_reason)
  VALUES (p_table_name, p_record_id, p_action, p_field_name, p_old_value, p_new_value, p_change_reason);
END;
$$;

-- ============================================================
-- FUNCTION TO UPDATE PRODUCT STOCK
-- ============================================================
CREATE OR REPLACE FUNCTION update_product_stock(
  p_product_id UUID,
  p_quantity DECIMAL(10, 2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_stock DECIMAL(10, 2);
  v_new_stock DECIMAL(10, 2);
BEGIN
  SELECT stock_quantity INTO v_old_stock FROM products WHERE id = p_product_id;
  v_new_stock := v_old_stock - p_quantity;
  
  UPDATE products
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;
  
  PERFORM log_change('products', p_product_id, 'UPDATE', 'stock_quantity', v_old_stock::TEXT, v_new_stock::TEXT, 'Stock sold via invoice');
END;
$$;

-- ============================================================
-- FUNCTION TO UPDATE CUSTOMER TOTALS
-- ============================================================
CREATE OR REPLACE FUNCTION update_customer_totals(
  p_customer_id UUID,
  p_purchase_amount DECIMAL(10, 2),
  p_paid_amount DECIMAL(10, 2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers
  SET total_purchase = total_purchase + p_purchase_amount,
      total_paid     = total_paid + p_paid_amount,
      total_due      = (total_purchase + p_purchase_amount) - (total_paid + p_paid_amount),
      updated_at     = NOW()
  WHERE id = p_customer_id;
END;
$$;