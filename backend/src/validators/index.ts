import { z } from 'zod';

// ── Auth Validation ───────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address format')
    .max(254, 'Email address is too long'),  // RFC 5321 max
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
});

// ── Customer Validation ───────────────────────────────────────────────────────
export const customerSchema = z.object({
  name: z
    .string()
    .min(2, 'Customer contact name must be at least 2 characters')
    .max(255, 'Name is too long'),
  mobile: z
    .string()
    .min(8, 'Mobile number must be at least 8 characters')
    .max(20, 'Mobile number is too long'),
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email is too long')
    .optional()
    .nullable(),
  business_name: z
    .string()
    .min(2, 'Business name is required')
    .max(255, 'Business name is too long'),
  gst_number: z
    .string()
    .max(50, 'GST number is too long')
    .optional()
    .nullable(),
  customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']),
  address: z
    .string()
    .max(500, 'Address is too long')
    .optional()
    .nullable(),
  status: z.enum(['Lead', 'Active', 'Inactive']).default('Lead'),
  follow_up_date: z
    .string()
    .max(20, 'Follow-up date format is invalid')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(5000, 'Notes must not exceed 5000 characters')
    .optional()
    .nullable(),
});

export const updateCustomerSchema = customerSchema.partial();

export const addCustomerNoteSchema = z.object({
  note: z
    .string()
    .min(1, 'Note content is required')
    .max(2000, 'Note must not exceed 2000 characters'),
  follow_up_date: z
    .string()
    .max(20, 'Follow-up date format is invalid')
    .optional()
    .nullable(),
});

// ── Product Validation ────────────────────────────────────────────────────────
export const productSchema = z.object({
  name: z
    .string()
    .min(2, 'Product name is required')
    .max(255, 'Product name is too long'),
  sku: z
    .string()
    .min(2, 'SKU code is required')
    .max(100, 'SKU code is too long'),
  category: z
    .string()
    .min(2, 'Category is required')
    .max(100, 'Category name is too long'),
  unit_price: z.number().min(0, 'Unit price cannot be negative').max(99_999_999, 'Unit price is unrealistically large'),
  current_stock: z.number().int().min(0, 'Stock cannot be negative').max(9_999_999, 'Stock quantity is too large').default(0),
  min_stock_alert: z.number().int().min(0, 'Min stock alert cannot be negative').max(9_999_999, 'Min stock alert is too large').default(10),
  location: z
    .string()
    .max(100, 'Warehouse location name is too long')
    .optional()
    .nullable(),
});

export const updateProductSchema = productSchema.partial();

// ── Manual Stock Adjustment Validation ───────────────────────────────────────
export const stockAdjustmentSchema = z.object({
  quantity: z
    .number()
    .int()
    .positive('Quantity must be greater than zero')
    .max(9_999_999, 'Stock adjustment quantity is too large'),
  movement_type: z.enum(['IN', 'OUT']),
  reason: z
    .string()
    .min(2, 'Reason for stock movement is required')
    .max(500, 'Reason is too long'),
});

// ── Sales Challan Validation ──────────────────────────────────────────────────
export const challanItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format'),
  quantity: z
    .number()
    .int()
    .positive('Item quantity must be at least 1')
    .max(9_999_999, 'Item quantity is too large'),
});

export const challanSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID format'),
  items: z
    .array(challanItemSchema)
    .min(1, 'Challan must contain at least one item')
    .max(50, 'A single challan cannot contain more than 50 line items'),
  status: z.enum(['Draft', 'Confirmed']).default('Draft'),
});

export const updateChallanStatusSchema = z.object({
  status: z.enum(['Draft', 'Confirmed', 'Cancelled']),
});
