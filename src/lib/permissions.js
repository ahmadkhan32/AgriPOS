// ============================================================
// PERMISSIONS SYSTEM
// ============================================================

export const PERMISSIONS = {
  SALES_VIEW:        'sales.view',
  SALES_CREATE:      'sales.create',
  SALES_EDIT:        'sales.edit',
  SALES_DELETE:      'sales.delete',
  SALES_DISCOUNT:    'sales.discount',
  PRODUCTS_VIEW:     'products.view',
  PRODUCTS_CREATE:   'products.create',
  PRODUCTS_EDIT:     'products.edit',
  PRODUCTS_DELETE:   'products.delete',
  PRODUCTS_COST:     'products.cost',
  INVENTORY_VIEW:    'inventory.view',
  INVENTORY_ADJUST:  'inventory.adjust',
  PURCHASES_VIEW:    'purchases.view',
  PURCHASES_CREATE:  'purchases.create',
  PURCHASES_EDIT:    'purchases.edit',
  CUSTOMERS_VIEW:    'customers.view',
  CUSTOMERS_CREATE:  'customers.create',
  CUSTOMERS_EDIT:    'customers.edit',
  CUSTOMERS_DELETE:  'customers.delete',
  SUPPLIERS_VIEW:    'suppliers.view',
  SUPPLIERS_CREATE:  'suppliers.create',
  SUPPLIERS_EDIT:    'suppliers.edit',
  REPORTS_VIEW:      'reports.view',
  REPORTS_FINANCIAL: 'reports.financial',
  REPORTS_EXPORT:    'reports.export',
  USERS_VIEW:        'users.view',
  USERS_CREATE:      'users.create',
  USERS_EDIT:        'users.edit',
  USERS_DELETE:      'users.delete',
  SETTINGS_VIEW:     'settings.view',
  SETTINGS_EDIT:     'settings.edit',
}

// Default permissions for system roles
export const DEFAULT_ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  manager: [
    'sales.view','sales.create','sales.edit','sales.discount',
    'products.view','products.create','products.edit',
    'inventory.view','inventory.adjust',
    'purchases.view','purchases.create',
    'customers.view','customers.create','customers.edit',
    'suppliers.view','suppliers.create',
    'reports.view','reports.financial',
    'settings.view',
  ],
  cashier: [
    'sales.view','sales.create','sales.discount',
    'products.view',
    'inventory.view',
    'customers.view','customers.create',
  ],
  storekeeper: [
    'products.view','products.create','products.edit',
    'inventory.view','inventory.adjust',
    'purchases.view','purchases.create',
    'suppliers.view',
  ],
  accountant: [
    'sales.view',
    'purchases.view',
    'customers.view',
    'suppliers.view',
    'reports.view','reports.financial','reports.export',
  ],
}

/**
 * Check if a user has a specific permission
 * @param {string[]} userPermissions - array of permission IDs the user has
 * @param {string} permission - the permission to check
 * @returns {boolean}
 */
export function hasPermission(userPermissions, permission) {
  if (!userPermissions || !Array.isArray(userPermissions)) return false
  return userPermissions.includes(permission)
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(userPermissions, permissionList) {
  return permissionList.every(p => hasPermission(userPermissions, p))
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(userPermissions, permissionList) {
  return permissionList.some(p => hasPermission(userPermissions, p))
}
