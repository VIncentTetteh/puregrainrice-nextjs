import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { escapeHtml } from '@/lib/sanitize';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    // Require an authenticated session — only the order owner can trigger this
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const orderId = typeof body?.id === 'string' ? body.id : null;

    if (!orderId) {
      return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
    }

    // Verify the order belongs to the authenticated user before notifying admin
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_full_name, user_email, user_phone, status, total_amount')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to:   process.env.ADMIN_EMAIL!,
      subject: `New Order: #${escapeHtml(order.id).slice(-8).toUpperCase()}`,
      text: [
        'A new order has been placed.',
        '',
        `Order ID : ${order.id}`,
        `Customer : ${order.user_full_name || 'N/A'}`,
        `Email    : ${order.user_email || 'N/A'}`,
        `Phone    : ${order.user_phone || 'N/A'}`,
        `Amount   : GH₵${Number(order.total_amount).toFixed(2)}`,
        `Status   : ${order.status}`,
        '',
        'Please check the admin dashboard for full details.',
      ].join('\n'),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
