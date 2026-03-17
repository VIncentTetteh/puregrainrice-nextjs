import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/products — public, returns active products with sale prices
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, sale_price, weight_kg, is_active')
    .eq('is_active', true)
    .order('weight_kg', { ascending: true });

  if (error) return NextResponse.json({ products: [] });
  return NextResponse.json({ products: data });
}
