-- ====================================================================
-- AgriPOS SaaS — High-Performance Database Indexes
--
-- Run these SQL statements in your Supabase SQL Editor.
-- These composite indexes optimize multi-tenant query filtering by
-- business_id and accelerate sorting, pagination, and search queries
-- to sub-millisecond execution times.
-- ====================================================================

-- 1. Products & Inventory Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_business_name 
    ON public.products(business_id, name);

CREATE INDEX IF NOT EXISTS idx_products_business_category 
    ON public.products(business_id, category);

CREATE INDEX IF NOT EXISTS idx_products_business_stock 
    ON public.products(business_id, stock_quantity);

-- 2. Customer Lookup & Search Indexes
CREATE INDEX IF NOT EXISTS idx_customers_business_name 
    ON public.customers(business_id, name);

CREATE INDEX IF NOT EXISTS idx_customers_business_phone 
    ON public.customers(business_id, phone);

-- 3. Invoices & Sales Performance Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_business_created 
    ON public.invoices(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_business_customer 
    ON public.invoices(business_id, customer_phone);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id 
    ON public.invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id 
    ON public.invoice_items(product_id);

-- 4. Purchases & Suppliers Performance Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_business_name 
    ON public.suppliers(business_id, name);

CREATE INDEX IF NOT EXISTS idx_purchases_business_created 
    ON public.purchases(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id 
    ON public.purchase_items(purchase_id);

-- 5. Multi-Tenant Auth & Permissions Lookups
CREATE INDEX IF NOT EXISTS idx_business_users_user_active 
    ON public.business_users(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_business_users_business_role 
    ON public.business_users(business_id, role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role 
    ON public.role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan 
    ON public.plan_features(plan_id);

-- Verify created indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
