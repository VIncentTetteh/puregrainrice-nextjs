import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clamp } from '@/lib/sanitize';
import { rateLimit, getIp } from '@/lib/rateLimit';

// POST /api/promotions/validate
// Body: { code: string, order_amount: number }
export async function POST(req: NextRequest) {
  // Rate limit: 20 validation attempts per hour per IP
  const ip = getIp(req);
  const { allowed } = rateLimit(`promo-validate:${ip}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ valid: false, error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const body = await req.json();
  const code = clamp(body.code, 50)?.toUpperCase().replace(/\s+/g, '');
  const order_amount = Number(body.order_amount) || 0;

  if (!code) {
    return NextResponse.json({ valid: false, error: 'Promo code is required.' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: promo, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (error) return NextResponse.json({ valid: false, error: 'Validation error.' }, { status: 500 });
  if (!promo) return NextResponse.json({ valid: false, error: 'Invalid or expired promo code.' });

  // Check expiry
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'This promo code has expired.' });
  }

  // Check usage limit
  if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
    return NextResponse.json({ valid: false, error: 'This promo code has reached its usage limit.' });
  }

  // Check minimum order
  if (promo.min_order_amount !== null && order_amount < promo.min_order_amount) {
    return NextResponse.json({
      valid: false,
      error: `Minimum order of GH₵${Number(promo.min_order_amount).toFixed(2)} required for this code.`,
    });
  }

  // Calculate discount
  let discount_amount = 0;
  if (promo.discount_type === 'percentage') {
    discount_amount = (order_amount * promo.discount_value) / 100;
  } else {
    discount_amount = Math.min(promo.discount_value, order_amount);
  }

  return NextResponse.json({
    valid: true,
    promo_id: promo.id,
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount_amount: Math.round(discount_amount * 100) / 100,
    description: promo.description,
  });
}
