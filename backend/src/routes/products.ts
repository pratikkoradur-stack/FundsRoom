import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { supabase } from '../supabaseClient';
import { productSchema, updateProductSchema, stockAdjustmentSchema } from '../validators';

const router = Router();

// GET /api/products - List products with search, category filter, low stock alert filter, and pagination
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const lowStock = req.query.low_stock === 'true';
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = (page - 1) * limit;

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: allProducts, count, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    let productsList = allProducts || [];

    // Filter low stock in-memory or query if requested
    if (lowStock) {
      productsList = productsList.filter(p => p.current_stock <= p.min_stock_alert);
    }

    const total = lowStock ? productsList.length : (count || 0);
    const paginatedProducts = productsList.slice(offset, offset + limit);

    return res.json({
      products: paginatedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/products - Create product (Admin, Warehouse)
router.post('/', authenticateToken, requireRole(['admin', 'warehouse']), async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((e: any) => e.message),
      });
    }

    const productData = parseResult.data;

    // Check SKU uniqueness
    const { data: existingSku } = await supabase
      .from('products')
      .select('id')
      .eq('sku', productData.sku)
      .maybeSingle();

    if (existingSku) {
      return res.status(400).json({ error: `Product SKU '${productData.sku}' already exists` });
    }

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();

    if (error || !data) {
      return res.status(400).json({ error: error?.message || 'Failed to create product' });
    }

    const newProduct = data[0];

    // If initial stock is provided > 0, log initial stock movement
    if (newProduct.current_stock > 0) {
      await supabase.from('stock_movements').insert([
        {
          product_id: newProduct.id,
          quantity: newProduct.current_stock,
          movement_type: 'IN',
          reason: 'Initial catalog creation stock',
          created_by: req.user?.id || null,
        },
      ]);
    }

    return res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/products/:id - Single product details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// PUT /api/products/:id - Update product details (Admin, Warehouse)
router.put('/:id', authenticateToken, requireRole(['admin', 'warehouse']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((e: any) => e.message),
      });
    }

    const updates = parseResult.data;

    // If SKU is being updated, check uniqueness
    if (updates.sku) {
      const { data: existingSku } = await supabase
        .from('products')
        .select('id')
        .eq('sku', updates.sku)
        .neq('id', id)
        .maybeSingle();

      if (existingSku) {
        return res.status(400).json({ error: `Product SKU '${updates.sku}' is already taken by another product` });
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: error?.message || 'Product not found or update failed' });
    }

    return res.json({ message: 'Product updated successfully', product: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/products/:id/stock - Manual Stock Adjustment (IN / OUT) (Admin, Warehouse)
router.post('/:id/stock', authenticateToken, requireRole(['admin', 'warehouse']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = stockAdjustmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((e: any) => e.message),
      });
    }

    const { quantity, movement_type, reason } = parseResult.data;

    // Fetch product
    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('id, name, current_stock')
      .eq('id', id)
      .single();

    if (fetchErr || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (movement_type === 'OUT' && product.current_stock < quantity) {
      return res.status(400).json({
        error: `Insufficient stock for '${product.name}'. Current available stock: ${product.current_stock}, requested withdrawal: ${quantity}.`,
      });
    }

    const newStock = movement_type === 'IN' 
      ? product.current_stock + quantity 
      : product.current_stock - quantity;

    // Update product stock
    const { data: updatedProduct, error: updateErr } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', id)
      .select();

    if (updateErr) {
      return res.status(400).json({ error: updateErr.message });
    }

    // Insert stock movement record
    const { error: logErr } = await supabase
      .from('stock_movements')
      .insert([
        {
          product_id: id,
          quantity,
          movement_type,
          reason,
          created_by: req.user?.id || null,
        },
      ]);

    if (logErr) {
      console.warn('Failed to insert stock movement log:', logErr.message);
    }

    return res.json({
      message: `Stock updated successfully (${movement_type} ${quantity} units)`,
      product: updatedProduct[0],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/products/:id/movements - Get stock movement log for a product
router.get('/:id/movements', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, users!created_by(name, email, role)')
      .eq('product_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ movements: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
