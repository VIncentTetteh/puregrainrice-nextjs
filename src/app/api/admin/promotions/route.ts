import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';
import { clamp } from '@/lib/sanitize';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !isAdminUser(user.email)) return null;
  return supabase;
}

// GET /api/admin/promotions
export async function GET() {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promotions: data });
}

// POST /api/admin/promotions
export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const code           = clamp(body.code, 50)?.toUpperCase().replace(/\s+/g, '');
  const description    = clamp(body.description, 500);
  const discount_type  = body.discount_type === 'fixed' ? 'fixed' : 'percentage';
  const discount_value = Number(body.discount_value);
  const min_order_amount = body.min_order_amount ? Number(body.min_order_amount) : null;
  const max_uses       = body.max_uses ? Number(body.max_uses) : null;
  const expires_at     = body.expires_at ? new Date(body.expires_at).toISOString() : null;
  const is_active      = body.is_active !== false;

  if (!code) return NextResponse.json({ error: 'Promo code is required.' }, { status: 400 });
  if (isNaN(discount_value) || discount_value <= 0) {
    return NextResponse.json({ error: 'Valid discount value is required.' }, { status: 400 });
  }
  if (discount_type === 'percentage' && discount_value > 100) {
    return NextResponse.json({ error: 'Percentage discount cannot exceed 100%.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('promotions')
    .insert([{ code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active, used_count: 0 }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Promo code already exists.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ promotion: data }, { status: 201 });
}

// PATCH /api/admin/promotions
export async function PATCH(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const id = typeof body.id === 'string' ? body.id : null;
  if (!id) return NextResponse.json({ error: 'Promotion ID required.' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.code        !== undefined) updates.code        = String(body.code).toUpperCase().replace(/\s+/g, '');
  if (body.description !== undefined) updates.description = clamp(body.description, 500);
  if (body.discount_type  !== undefined) updates.discount_type  = body.discount_type;
  if (body.discount_value !== undefined) updates.discount_value = Number(body.discount_value);
  if (body.min_order_amount !== undefined) updates.min_order_amount = body.min_order_amount ? Number(body.min_order_amount) : null;
  if (body.max_uses    !== undefined) updates.max_uses    = body.max_uses ? Number(body.max_uses) : null;
  if (body.expires_at  !== undefined) updates.expires_at  = body.expires_at ? new Date(body.expires_at).toISOString() : null;
  if (body.is_active   !== undefined) updates.is_active   = Boolean(body.is_active);
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('promotions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promotion: data });
}

// DELETE /api/admin/promotions
export async function DELETE(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Promotion ID required.' }, { status: 400 });

  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
