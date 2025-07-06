'use server'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { Resend } from 'resend';
import { ShippingAddress } from '@/types/ShippingAddress';

const resend = new Resend(process.env.RESEND_API_KEY!);

// interface ShippingAddress {
//   email: string
//   full_name?: string
//   phone?: string
// }

interface OrderItem {
  product_id: string
  product_weight_kg: string
  quantity: number
  unit_price: number
  total_price: number
  
}

interface Order {
  id: string
  status: string
  created_at: string
  shipping_address?: ShippingAddress
  user_email?: string
  user_full_name?: string
  user_phone?: string
  order_items: OrderItem[]
  [key: string]: unknown
}

// Helper function to get status-specific styling and messaging
type StatusConfig = {
  color: string;
  bgColor: string;
  icon: string;
  message: string;
  nextStep: string;
};

const getStatusConfig = (status: string): StatusConfig => {
  const configs: Record<string, StatusConfig> = {
    pending: {
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: '⏳',
      message: "We've received your order and it's being processed.",
      nextStep: "You'll receive another update once your order is confirmed."
    },
    confirmed: {
      color: '#3b82f6',
      bgColor: '#dbeafe',
      icon: '✅',
      message: 'Great news! Your order has been confirmed.',
      nextStep: "We're now preparing your items for shipment."
    },
    processing: {
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      icon: '📦',
      message: "Your order is currently being prepared for shipment.",
      nextStep: "You'll receive tracking information once it ships."
    },
    shipped: {
      color: '#10b981',
      bgColor: '#d1fae5',
      icon: '🚚',
      message: 'Your order is on its way!',
      nextStep: 'Track your package using the information provided.'
    },
    delivered: {
      color: '#059669',
      bgColor: '#a7f3d0',
      icon: '🎉',
      message: 'Your order has been delivered successfully!',
      nextStep: "We hope you love your purchase. Don't forget to leave a review!"
    },
    cancelled: {
      color: '#ef4444',
      bgColor: '#fecaca',
      icon: '❌',
      message: 'Your order has been cancelled.',
      nextStep: 'If you have any questions, please contact our support team.'
    }
  };

  return configs[status.toLowerCase()] || {
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: '📋',
    message: `Your order status has been updated to: ${status}`,
    nextStep: "We'll keep you informed of any further updates."
  };
};

const createOrderStatusEmail = (
  userFullName: string, 
  orderId: string, 
  status: string, 
  orderDate: string = new Date().toLocaleDateString(),
  supportEmail: string = process.env.SUPPORT_EMAIL || 'support@yourstore.com',
  trackingNumber: string | null = null,
  orderItems: OrderItem[] = []
) => {
  const config = getStatusConfig(status);
  
  // Calculate order summary
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = orderItems.reduce((sum, item) => sum + (item.total_price || item.unit_price || 0), 0);
  
  return {
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8fafc;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .header p {
                opacity: 0.9;
                font-size: 14px;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 18px;
                color: #2d3748;
                margin-bottom: 20px;
            }
            
            .status-card {
                background-color: ${config.bgColor};
                border-left: 4px solid ${config.color};
                padding: 20px;
                border-radius: 6px;
                margin: 25px 0;
                text-align: center;
            }
            
            .status-icon {
                font-size: 32px;
                margin-bottom: 10px;
                display: block;
            }
            
            .status-title {
                font-size: 20px;
                font-weight: 600;
                color: ${config.color};
                margin-bottom: 8px;
                text-transform: capitalize;
            }
            
            .status-message {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 15px;
            }
            
            .next-step {
                font-size: 14px;
                color: #718096;
                font-style: italic;
            }
            
            .order-details {
                background-color: #f7fafc;
                padding: 20px;
                border-radius: 6px;
                margin: 25px 0;
            }
            
            .order-details h3 {
                color: #2d3748;
                margin-bottom: 15px;
                font-size: 16px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .detail-label {
                color: #718096;
            }
            
            .detail-value {
                color: #2d3748;
                font-weight: 500;
            }
            
            .order-items {
                background-color: #f7fafc;
                padding: 20px;
                border-radius: 6px;
                margin: 25px 0;
            }
            
            .order-items h3 {
                color: #2d3748;
                margin-bottom: 15px;
                font-size: 16px;
            }
            
            .item {
                display: flex;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .item:last-child {
                border-bottom: none;
            }
            
            .item-image {
                width: 50px;
                height: 50px;
                border-radius: 4px;
                object-fit: cover;
                margin-right: 15px;
                background-color: #e2e8f0;
            }
            
            .item-details {
                flex: 1;
            }
            
            .item-name {
                font-weight: 500;
                color: #2d3748;
                font-size: 14px;
            }
            
            .item-quantity {
                color: #718096;
                font-size: 12px;
            }
            
            .tracking-section {
                background-color: #e6fffa;
                border: 1px solid #81e6d9;
                padding: 20px;
                border-radius: 6px;
                margin: 25px 0;
                text-align: center;
            }
            
            .tracking-number {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                color: #234e52;
                background-color: #ffffff;
                padding: 10px;
                border-radius: 4px;
                margin: 10px 0;
                letter-spacing: 1px;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 500;
                margin: 20px 0;
            }
            
            .footer {
                background-color: #f7fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer p {
                color: #718096;
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            .support-link {
                color: #667eea;
                text-decoration: none;
            }
            
            @media (max-width: 600px) {
                .content {
                    padding: 30px 20px;
                }
                
                .detail-row {
                    flex-direction: column;
                    gap: 4px;
                }
                
                .item {
                    flex-direction: column;
                    text-align: center;
                }
                
                .item-image {
                    margin: 0 0 10px 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Order Status Update</h1>
                <p>Your order has been updated</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${userFullName},
                </div>
                
                <div class="status-card">
                    <span class="status-icon">${config.icon}</span>
                    <div class="status-title">${status}</div>
                    <div class="status-message">${config.message}</div>
                    <div class="next-step">${config.nextStep}</div>
                </div>
                
                <div class="order-details">
                    <h3>Order Summary</h3>
                    <div class="detail-row">
                        <span class="detail-label">Order Number:</span>
                        <span class="detail-value">#${orderId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Order Date:</span>
                        <span class="detail-value">${orderDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Current Status:</span>
                        <span class="detail-value" style="color: ${config.color}; text-transform: capitalize;">${status}</span>
                    </div>
                    ${totalItems > 0 ? `
                    <div class="detail-row">
                        <span class="detail-label">Total Items:</span>
                        <span class="detail-value">${totalItems}</span>
                    </div>
                    ` : ''}
                    ${totalAmount > 0 ? `
                    <div class="detail-row">
                        <span class="detail-label">Order Total:</span>
                        <span class="detail-value">$${totalAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${orderItems.length > 0 ? `
                <div class="order-items">
                    <h3>Order Items</h3>
                    ${orderItems.map(item => `
                        <div class="item">
                  
                            <div class="item-details">
                                <div class="item-name">${item.product_id}</div>
                                <div class="item-quantity">Quantity: ${item.quantity}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${trackingNumber ? `
                <div class="tracking-section">
                    <h3 style="color: #234e52; margin-bottom: 10px;">📦 Tracking Information</h3>
                    <p style="color: #4a5568; margin-bottom: 10px;">Track your package with this number:</p>
                    <div class="tracking-number">${trackingNumber}</div>
                    <a href="#" class="cta-button">Track Your Package</a>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}/orders/${orderId}" class="cta-button">View Order Details</a>
                </div>
            </div>
            
            <div class="footer">
                <p>Need help? Contact our support team at <a href="mailto:${supportEmail}" class="support-link">${supportEmail}</a></p>
                <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Your Store'}. All rights reserved.</p>
                <p style="font-size: 12px; margin-top: 15px;">
                    You're receiving this email because you placed an order with us.
                </p>
            </div>
        </div>
    </body>
    </html>
    `,
    text: `
Order Status Update - Order #${orderId}

Hello ${userFullName},

Your order status has been updated to: ${status.toUpperCase()}

${config.message}
${config.nextStep}

Order Summary:
- Order Number: #${orderId}
- Order Date: ${orderDate}
- Current Status: ${status}
${totalItems > 0 ? `- Total Items: ${totalItems}` : ''}
${totalAmount > 0 ? `- Order Total: $${totalAmount.toFixed(2)}` : ''}
${trackingNumber ? `- Tracking Number: ${trackingNumber}` : ''}

${orderItems.length > 0 ? `
Order Items:
${orderItems.map(item => `- ${item.product_id} (Qty: ${item.quantity})`).join('\n')}
` : ''}

Need assistance? Contact us at ${supportEmail}

Thank you for your business!
${process.env.COMPANY_NAME || 'Your Store'}
    `
  };
};

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
      requireAdmin(user.email)
    } catch {
      return NextResponse.json({ error: 'Access denied: Admin privileges required' }, { status: 403 })
    }
    let { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_weight_kg,
          quantity,
          unit_price,
          total_price
        )
      `)
      .order('created_at', { ascending: false })

    
      if (error) {
        console.log('Detailed query failed, trying basic schema for admin orders...', error.message)
        error = null
      }

    // if (error) {
    //   console.log('Detailed query failed, trying basic schema for admin orders...', error.message)
    //   const basicResult = await supabase
    //     .from('orders')
    //     .select(`
    //       *,
    //       order_items (
    //         id,
    //         product_id,
    //         quantity,
    //         price
    //       )
    //     `)
    //     .order('created_at', { ascending: false })
    //   orders = basicResult.data
    //   error = basicResult.error
    // }

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders', details: error.message }, { status: 500 })
    }

    if (orders) {
      orders = orders.map((order: Order) => ({
        ...order,
        shipping_address: order.shipping_address || {
          email: order.user_email || '',
          full_name: order.user_full_name || '',
          phone: order.user_phone || ''
        },
        order_items: (order.order_items || []).map((item: OrderItem) => ({
          ...item,
          price: item.unit_price,
          products: {
            name: item.product_id
          }
        }))
      }))
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (err: unknown) {
    console.error('Error in orders API:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status, notes, trackingNumber } = await request.json()
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
      requireAdmin(user.email)
    } catch {
      return NextResponse.json({ error: 'Access denied: Admin privileges required' }, { status: 403 })
    }

    // Fetch order with items for email
    const { error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
        )
      `)
      .eq('id', orderId)
      .single()

    if (fetchError) {
      console.error('Error fetching order for email:', fetchError)
    }

    const updateData: { status: string; updated_at: string; admin_notes?: string; tracking_number?: string } = {
      status,
      updated_at: new Date().toISOString()
    }
    if (notes) {
      updateData.admin_notes = notes
    }
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    const userEmail = data?.user_email
    const userFullName = data?.user_full_name || 'Customer'
    const orderDate = data?.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString()

    if (data && userEmail) {
      try {
        const emailData = createOrderStatusEmail(
          userFullName,
          orderId,
          status,
          orderDate,
          process.env.EMAIL_TO || 'info@pureplatterfoods.com',
          trackingNumber || null,
        )

        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: userEmail,
          subject: `Order #${orderId} Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          html: emailData.html,
          text: emailData.text,
        });
        
        console.log(`Status update email sent to ${userEmail} for order ${orderId}`)
      } catch (emailError) {
        console.error('Error sending status update email:', emailError)
        // Don't fail the order update if email fails
      }
    }

    return NextResponse.json({ order: data })
  } catch (err: unknown) {
    console.error('Error in order update API:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}