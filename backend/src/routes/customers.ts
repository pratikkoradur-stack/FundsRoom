import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { supabase } from '../supabaseClient';
import { customerSchema, updateCustomerSchema, addCustomerNoteSchema } from '../validators';

const router = Router();

// GET /api/customers - List customers with search, status/type filters, and pagination
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('customer_type', type);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,business_name.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return res.json({
      customers: data || [],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/customers - Create customer (Admin, Sales)
router.post('/', authenticateToken, requireRole(['admin', 'sales']), async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((e: any) => e.message),
      });
    }

    const customerData = parseResult.data;

    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ message: 'Customer created successfully', customer: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/customers/:id - Get customer details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();

    if (error || !data) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json({ customer: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// PUT /api/customers/:id - Edit customer (Admin, Sales)
router.put('/:id', authenticateToken, requireRole(['admin', 'sales']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateCustomerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((e: any) => e.message),
      });
    }

    const updates = parseResult.data;

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select();

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: error?.message || 'Customer not found or update failed' });
    }

    return res.json({ message: 'Customer updated successfully', customer: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/customers/:id/notes - Add follow-up note & update follow-up date (Admin, Sales)
router.post('/:id/notes', authenticateToken, requireRole(['admin', 'sales']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = addCustomerNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((e: any) => e.message),
      });
    }

    const { note, follow_up_date } = parseResult.data;

    // Fetch current customer notes
    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('notes, follow_up_date')
      .eq('id', id)
      .single();

    if (fetchErr || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const formattedNote = `[${timestamp} by ${req.user?.name || 'Staff'}]: ${note}`;
    const updatedNotes = customer.notes ? `${customer.notes}\n\n${formattedNote}` : formattedNote;

    const updates: any = { notes: updatedNotes };
    if (follow_up_date !== undefined) {
      updates.follow_up_date = follow_up_date;
    }

    const { data: updatedCustomer, error: updateErr } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select();

    if (updateErr) {
      return res.status(400).json({ error: updateErr.message });
    }

    return res.json({ message: 'Note added successfully', customer: updatedCustomer[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
