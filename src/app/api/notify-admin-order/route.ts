import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const order = await req.json();

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: process.env.ADMIN_EMAIL!, // Set this in your .env
      subject: `New Order Placed: #${order.id}`,
      text: `
        A new order has been placed.

        Order ID: ${order.id}
        Customer: ${order.user_full_name || order.shipping_address?.fullName || 'N/A'}
        Email: ${order.user_email || order.shipping_address?.email || 'N/A'}
        Phone: ${order.user_phone || order.shipping_address?.phone || 'N/A'}
        Status: ${order.status || 'pending'}

        Please check the admin dashboard for full details.
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin notify error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}