// Email notification service for order status updates
// This is a placeholder implementation - replace with your preferred email service

type OrderDetails = Record<string, unknown>;

export async function sendOrderStatusNotification(
  customerEmail: string,
  orderId: string,
  newStatus: string,
  orderDetails?: OrderDetails
) {
  // This is a placeholder implementation
  // You can integrate with services like:
  // - SendGrid
  // - Resend
  // - Nodemailer
  // - Amazon SES

  console.log('Sending email notification:', {
    to: customerEmail,
    orderId,
    newStatus,
    orderDetails
  });

  // Always generate the email HTML (even if not sent)
  const emailHtml = getEmailTemplate(orderId, newStatus);
  console.log('Generated email HTML:', emailHtml);

  // Example implementation with fetch (replace with your email service)
  try {
    // Replace this with your actual email service
    // Uncomment and configure for your email service
    // const response = await fetch('YOUR_EMAIL_SERVICE_ENDPOINT', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     to: customerEmail,
    //     subject: `Order Update - ${orderId}`,
    //     html: emailHtml
    //   })
    // })

    console.log('Email notification queued successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return { success: false, error };
  }
}

function getEmailTemplate(orderId: string, status: string) {
  const statusMessages = {
    confirmed: 'Your order has been confirmed and is being prepared.',
    shipped: 'Great news! Your order has been shipped and is on its way.',
    delivered: 'Your order has been delivered. We hope you enjoy your rice!',
    cancelled: 'Unfortunately, your order has been cancelled.'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Update - ${orderId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h1 style="color: #333; margin-bottom: 20px;">Order Update</h1>
        
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          Hello! We have an update on your order.
        </p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-bottom: 10px;">Order #${orderId.slice(-8)}</h2>
          <p style="font-size: 18px; color: #333; font-weight: bold; margin-bottom: 10px;">
            Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
          </p>
          <p style="color: #666; margin-bottom: 0;">
            ${statusMessages[status as keyof typeof statusMessages] || 'Your order status has been updated.'}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Order Details
          </a>
        </div>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; text-align: center;">
          Thank you for choosing PureGrain Rice!
        </p>
      </div>
    </body>
    </html>
  `
}
