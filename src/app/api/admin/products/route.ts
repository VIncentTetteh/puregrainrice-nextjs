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

// GET /api/admin/products
export async function GET() {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

// POST /api/admin/products
export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const name        = clamp(body.name, 200);
  const description = clamp(body.description, 2000);
  const price       = Number(body.price);
  const weight_kg   = Number(body.weight_kg);
  const stock_qty   = Number(body.stock_qty ?? 0);
  const image_url   = clamp(body.image_url, 500);
  const is_active   = body.is_active !== false;

  if (!name || isNaN(price) || price <= 0) {
    return NextResponse.json({ error: 'Name and valid price are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{ name, description, price, weight_kg, stock_qty, image_url, is_active }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}

// PATCH /api/admin/products
export async function PATCH(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const id = typeof body.id === 'string' ? body.id : null;
  if (!id) return NextResponse.json({ error: 'Product ID required.' }, { status: 400 });

  // Build update object from provided fields only
  const updates: Record<string, unknown> = {};
  if (body.name        !== undefined) updates.name        = clamp(body.name, 200);
  if (body.description !== undefined) updates.description = clamp(body.description, 2000);
  if (body.price       !== undefined) updates.price       = Number(body.price);
  if (body.weight_kg   !== undefined) updates.weight_kg   = Number(body.weight_kg);
  if (body.stock_qty   !== undefined) updates.stock_qty   = Number(body.stock_qty);
  if (body.image_url   !== undefined) updates.image_url   = clamp(body.image_url, 500);
  if (body.is_active   !== undefined) updates.is_active   = Boolean(body.is_active);
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

// DELETE /api/admin/products
export async function DELETE(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Product ID required.' }, { status: 400 });

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
