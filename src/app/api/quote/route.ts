import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { name, email, phone, quantity, message } = await req.json();

    // HTML email template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Quote Request</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .field-group {
            margin-bottom: 25px;
            border-left: 4px solid #667eea;
            padding-left: 15px;
          }
          .field-label {
            font-weight: 600;
            color: #555;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
            display: block;
          }
          .field-value {
            font-size: 16px;
            color: #333;
            background-color: #f8f9fa;
            padding: 10px 15px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
          }
          .message-field {
            border-left: 4px solid #28a745;
          }
          .message-value {
            background-color: #f8fff9;
            border: 1px solid #d4edda;
            min-height: 60px;
            white-space: pre-wrap;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 0;
            color: #6c757d;
            font-size: 12px;
          }
          .timestamp {
            color: #999;
            font-size: 12px;
            text-align: right;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
          }
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            .content {
              padding: 20px;
            }
            .header {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📋 New Quote Request</h1>
            <p>You have received a new quote request from your website</p>
          </div>
          
          <div class="content">
            <div class="field-group">
              <span class="field-label">👤 Customer Name</span>
              <div class="field-value">${name}</div>
            </div>
            
            <div class="field-group">
              <span class="field-label">📧 Email Address</span>
              <div class="field-value">
                <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
              </div>
            </div>
            
            <div class="field-group">
              <span class="field-label">📱 Phone Number</span>
              <div class="field-value">
                <a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a>
              </div>
            </div>
            
            <div class="field-group">
              <span class="field-label">📦 Quantity Requested</span>
              <div class="field-value">${quantity}</div>
            </div>
            
            <div class="field-group message-field">
              <span class="field-label">💬 Additional Message</span>
              <div class="field-value message-value">${message || 'No additional message provided.'}</div>
            </div>
            
            <div class="timestamp">
              Received on ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </div>
          </div>
          
          <div class="footer">
            <p>This quote request was submitted through your website contact form.</p>
            <p>Please respond to the customer within 24 hours for the best experience.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text fallback
    const textTemplate = `
🔷 NEW QUOTE REQUEST 🔷

👤 Customer Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone}
📦 Quantity: ${quantity}

💬 Message:
${message || 'No additional message provided.'}

⏰ Received: ${new Date().toLocaleString()}

---
This quote request was submitted through your website.
Please respond within 24 hours for the best customer experience.
    `;

    // Send notification to you (business owner)
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: process.env.EMAIL_FROM!,
      subject: `🔔 New Quote Request from ${name}`,
      replyTo: email,
      html: htmlTemplate,
      text: textTemplate,
    });

    // Send confirmation to customer
    const customerTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote Request Confirmation</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .confirmation-box {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .details-summary {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>✅ Quote Request Received</h1>
            <p>Thank you for your interest in our services!</p>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            
            <div class="confirmation-box">
              <h2 style="color: #155724; margin-top: 0;">Your quote request has been successfully submitted!</h2>
              <p style="margin-bottom: 0;">We've received your request and will get back to you within 24 hours.</p>
            </div>
            
            <p>Here's a summary of your request:</p>
            
            <div class="details-summary">
              <p><strong>Quantity:</strong> ${quantity}</p>
              ${message ? `<p><strong>Your Message:</strong><br>${message}</p>` : ''}
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>Our team will review your request and send you a detailed quote soon. If you have any urgent questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>Your Business Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated confirmation email.</p>
            <p>If you didn't submit this request, please contact us immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const customerTextTemplate = `
✅ QUOTE REQUEST CONFIRMATION

Hi ${name},

Thank you for your quote request! We've successfully received your submission and will get back to you within 24 hours.

SUMMARY:
Quantity: ${quantity}
${message ? `Message: ${message}` : ''}
Submitted: ${new Date().toLocaleString()}

Our team will review your request and send you a detailed quote soon.

Best regards,
PurePlatter Foods Team

---
This is an automated confirmation. If you didn't submit this request, please contact us immediately.
    `;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `✅ Quote Request Confirmation - We'll be in touch soon!`,
      html: customerTemplate,
      text: customerTextTemplate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quote request error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}