import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { supabase } from '../supabaseClient';
import { challanSchema, updateChallanStatusSchema } from '../validators';

const router = Router();

// GET /api/challans - List sales challans with search, filters, and pagination
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    const customerId = req.query.customer_id as string;
    const search = req.query.search as string;
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('challans')
      .select('*, customers(id, name, business_name, mobile), users!created_by(id, name, email, role)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (search) {
      query = query.ilike('challan_number', `%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const total = count || 0;

    return res.json({
      challans: data || [],
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

// POST /api/challans - Create sales challan (Draft or Confirmed) (Admin, Sales)
router.post('/', authenticateToken, requireRole(['admin', 'sales']), async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = challanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((e: any) => e.message),
      });
    }

    const { customer_id, items, status } = parseResult.data;

    // Verify customer exists
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('id, name, business_name')
      .eq('id', customer_id)
      .single();

    if (custErr || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Fetch product details & snapshots for all items
    const productIds = items.map(i => i.product_id);
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, sku, unit_price, current_stock')
      .in('id', productIds);

    if (prodErr || !products || products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more selected products could not be found' });
    }

    const productMap = new Map(products.map(p => [p.id, p]));
    const itemSnapshots: any[] = [];
    const stockCheckFailures: string[] = [];

    let totalQuantity = 0;

    for (const item of items) {
      const prod = productMap.get(item.product_id);
      if (!prod) continue;

      totalQuantity += item.quantity;

      // Stock check if status is Confirmed
      if (status === 'Confirmed' && prod.current_stock < item.quantity) {
        stockCheckFailures.push(
          `Insufficient stock for '${prod.name}' (SKU: ${prod.sku}). Available: ${prod.current_stock}, Requested: ${item.quantity}`
        );
      }

      itemSnapshots.push({
        product_id: prod.id,
        name: prod.name,
        sku: prod.sku,
        unit_price: Number(prod.unit_price),
        quantity: item.quantity,
        subtotal: Number(prod.unit_price) * item.quantity,
      });
    }

    // If stock validation failed for any item when status is Confirmed
    if (stockCheckFailures.length > 0) {
      return res.status(400).json({
        error: 'Stock validation failed. Cannot confirm challan.',
        details: stockCheckFailures,
      });
    }

    // Auto-generate unique Challan Number
    const challanNumber = `CH-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Perform stock deduction if status is Confirmed
    if (status === 'Confirmed') {
      for (const item of items) {
        const prod = productMap.get(item.product_id)!;
        const newStock = prod.current_stock - item.quantity;

        // Deduct product stock
        await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', prod.id);

        // Record stock movement (OUT)
        await supabase
          .from('stock_movements')
          .insert([
            {
              product_id: prod.id,
              quantity: item.quantity,
              movement_type: 'OUT',
              reason: `Sales Challan #${challanNumber}`,
              created_by: req.user?.id || null,
            },
          ]);
      }
    }

    // Insert Challan Record
    const { data: newChallan, error: insertErr } = await supabase
      .from('challans')
      .insert([
        {
          challan_number: challanNumber,
          customer_id,
          items: itemSnapshots,
          total_quantity: totalQuantity,
          status,
          created_by: req.user?.id || null,
        },
      ])
      .select();

    if (insertErr || !newChallan) {
      return res.status(400).json({ error: insertErr?.message || 'Failed to create sales challan' });
    }

    return res.status(201).json({
      message: `Sales Challan #${challanNumber} created successfully (${status})`,
      challan: newChallan[0],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/challans/:id - Get single challan details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('challans')
      .select('*, customers(*), users!created_by(id, name, email, role)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Sales challan not found' });
    }

    return res.json({ challan: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// PUT /api/challans/:id/status - Update Challan Status (Draft -> Confirmed / Draft -> Cancelled / Confirmed -> Cancelled)
router.put('/:id/status', authenticateToken, requireRole(['admin', 'sales', 'warehouse']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateChallanStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((e: any) => e.message),
      });
    }

    const { status: targetStatus } = parseResult.data;

    // Fetch existing challan
    const { data: challan, error: fetchErr } = await supabase
      .from('challans')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !challan) {
      return res.status(404).json({ error: 'Sales challan not found' });
    }

    if (challan.status === targetStatus) {
      return res.status(400).json({ error: `Challan is already in '${targetStatus}' status` });
    }

    const items = challan.items as any[];

    // DRAFT -> CONFIRMED workflow
    if (challan.status === 'Draft' && targetStatus === 'Confirmed') {
      const productIds = items.map(i => i.product_id);
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('id, name, sku, current_stock')
        .in('id', productIds);

      if (prodErr || !products) {
        return res.status(400).json({ error: 'Failed to verify inventory for items' });
      }

      const productMap = new Map(products.map(p => [p.id, p]));
      const stockFailures: string[] = [];

      for (const item of items) {
        const prod = productMap.get(item.product_id);
        if (!prod || prod.current_stock < item.quantity) {
          const avail = prod ? prod.current_stock : 0;
          stockFailures.push(`Insufficient stock for '${item.name}'. Available: ${avail}, Required: ${item.quantity}`);
        }
      }

      if (stockFailures.length > 0) {
        return res.status(400).json({
          error: 'Cannot confirm challan due to stock insufficiency',
          details: stockFailures,
        });
      }

      // Deduct stock & log movement
      for (const item of items) {
        const prod = productMap.get(item.product_id)!;
        const newStock = prod.current_stock - item.quantity;

        await supabase.from('products').update({ current_stock: newStock }).eq('id', prod.id);
        await supabase.from('stock_movements').insert([
          {
            product_id: prod.id,
            quantity: item.quantity,
            movement_type: 'OUT',
            reason: `Sales Challan #${challan.challan_number} Confirmation`,
            created_by: req.user?.id || null,
          },
        ]);
      }
    }

    // CONFIRMED -> CANCELLED workflow (Restore stock)
    if (challan.status === 'Confirmed' && targetStatus === 'Cancelled') {
      for (const item of items) {
        // Fetch current stock
        const { data: prod } = await supabase.from('products').select('current_stock').eq('id', item.product_id).single();
        if (prod) {
          const restoredStock = prod.current_stock + item.quantity;
          await supabase.from('products').update({ current_stock: restoredStock }).eq('id', item.product_id);

          await supabase.from('stock_movements').insert([
            {
              product_id: item.product_id,
              quantity: item.quantity,
              movement_type: 'IN',
              reason: `Sales Challan #${challan.challan_number} Cancellation Stock Restoration`,
              created_by: req.user?.id || null,
            },
          ]);
        }
      }
    }

    // Update challan status
    const { data: updatedChallan, error: updateErr } = await supabase
      .from('challans')
      .update({ status: targetStatus })
      .eq('id', id)
      .select();

    if (updateErr) {
      return res.status(400).json({ error: updateErr.message });
    }

    return res.json({
      message: `Sales Challan #${challan.challan_number} status updated to '${targetStatus}'`,
      challan: updatedChallan[0],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
