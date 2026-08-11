import { z } from 'zod';

// Auth Validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

// Customer Validation
export const customerSchema = z.object({
  name: z.string().min(2, 'Customer contact name must be at least 2 characters'),
  mobile: z.string().min(8, 'Mobile number must be at least 8 characters'),
  email: z.string().email('Invalid email address').optional().nullable(),
  business_name: z.string().min(2, 'Business name is required'),
  gst_number: z.string().optional().nullable(),
  customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']),
  address: z.string().optional().nullable(),
  status: z.enum(['Lead', 'Active', 'Inactive']).default('Lead'),
  follow_up_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = customerSchema.partial();

export const addCustomerNoteSchema = z.object({
  note: z.string().min(1, 'Note content is required'),
  follow_up_date: z.string().optional().nullable(),
});

// Product Validation
export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU code is required'),
  category: z.string().min(2, 'Category is required'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  current_stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  min_stock_alert: z.number().int().min(0, 'Min stock alert cannot be negative').default(10),
  location: z.string().optional().nullable(),
});

export const updateProductSchema = productSchema.partial();

// Manual Stock Adjustment Validation
export const stockAdjustmentSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  movement_type: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason for stock movement is required'),
});

// Sales Challan Validation
export const challanItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int().positive('Item quantity must be at least 1'),
});

export const challanSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID format'),
  items: z.array(challanItemSchema).min(1, 'Challan must contain at least one item'),
  status: z.enum(['Draft', 'Confirmed']).default('Draft'),
});

export const updateChallanStatusSchema = z.object({
  status: z.enum(['Draft', 'Confirmed', 'Cancelled']),
});
