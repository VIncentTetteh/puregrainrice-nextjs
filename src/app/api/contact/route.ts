import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { escapeHtml, isValidEmail, clamp } from '@/lib/sanitize';
import { rateLimit, getIp } from '@/lib/rateLimit';

const resend = new Resend(process.env.RESEND_API_KEY!);

// Helper function to get priority level styling
const getPriorityConfig = (subject: string) => {
  const lowerSubject = subject.toLowerCase();
  
  if (lowerSubject.includes('urgent') || lowerSubject.includes('complaint') || lowerSubject.includes('issue')) {
    return {
      color: '#ef4444',
      bgColor: '#fecaca',
      icon: '🚨',
      priority: 'High Priority'
    };
  } else if (lowerSubject.includes('order') || lowerSubject.includes('support') || lowerSubject.includes('help')) {
    return {
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: '⚠️',
      priority: 'Medium Priority'
    };
  } else {
    return {
      color: '#10b981',
      bgColor: '#d1fae5',
      icon: '💬',
      priority: 'Normal Priority'
    };
  }
};

// Admin notification email template
const createAdminNotificationEmail = (firstName: string, lastName: string, email: string, phone: string, subject: string, message: string) => {
  const config = getPriorityConfig(subject);
  const submissionTime = new Date().toLocaleString();
  
  return {
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
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
            
            .priority-banner {
                background-color: ${config.bgColor};
                border-left: 4px solid ${config.color};
                padding: 15px 20px;
                border-radius: 6px;
                margin-bottom: 25px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .priority-icon {
                font-size: 20px;
            }
            
            .priority-text {
                font-weight: 600;
                color: ${config.color};
                font-size: 14px;
            }
            
            .customer-info {
                background-color: #f7fafc;
                padding: 20px;
                border-radius: 6px;
                margin: 25px 0;
            }
            
            .customer-info h3 {
                color: #2d3748;
                margin-bottom: 15px;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .info-row:last-child {
                border-bottom: none;
            }
            
            .info-label {
                color: #718096;
                font-weight: 500;
                min-width: 80px;
            }
            
            .info-value {
                color: #2d3748;
                font-weight: 500;
                flex: 1;
                text-align: right;
            }
            
            .contact-info {
                color: #3b82f6;
                text-decoration: none;
            }
            
            .contact-info:hover {
                text-decoration: underline;
            }
            
            .message-section {
                background-color: #ffffff;
                border: 2px solid #e2e8f0;
                padding: 20px;
                border-radius: 6px;
                margin: 25px 0;
            }
            
            .message-section h3 {
                color: #2d3748;
                margin-bottom: 15px;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .subject-line {
                background-color: #f1f5f9;
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 15px;
                font-weight: 600;
                color: #334155;
                border-left: 3px solid #3b82f6;
            }
            
            .message-content {
                color: #4a5568;
                line-height: 1.8;
                padding: 15px;
                background-color: #fafafa;
                border-radius: 4px;
                white-space: pre-wrap;
                font-size: 15px;
            }
            
            .action-buttons {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background-color: #f8fafc;
                border-radius: 6px;
            }
            
            .btn {
                display: inline-block;
                padding: 12px 24px;
                margin: 0 10px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 500;
                font-size: 14px;
                transition: transform 0.2s;
            }
            
            .btn:hover {
                transform: translateY(-2px);
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .btn-secondary {
                background-color: #e2e8f0;
                color: #4a5568;
            }
            
            .metadata {
                background-color: #f1f5f9;
                padding: 15px;
                border-radius: 6px;
                margin-top: 25px;
                font-size: 12px;
                color: #64748b;
            }
            
            .metadata-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            
            .metadata-row:last-child {
                margin-bottom: 0;
            }
            
            @media (max-width: 600px) {
                .content {
                    padding: 30px 20px;
                }
                
                .info-row, .metadata-row {
                    flex-direction: column;
                    gap: 4px;
                }
                
                .info-value {
                    text-align: left;
                }
                
                .btn {
                    display: block;
                    margin: 10px 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>📧 New Contact Form Submission</h1>
                <p>Someone has reached out through your website</p>
            </div>
            
            <div class="content">
                <div class="priority-banner">
                    <span class="priority-icon">${config.icon}</span>
                    <span class="priority-text">${config.priority}</span>
                </div>
                
                <div class="customer-info">
                    <h3>👤 Customer Information</h3>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${firstName} ${lastName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">
                            <a href="mailto:${email}" class="contact-info">${email}</a>
                        </span>
                    </div>
                    ${phone ? `
                    <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">
                            <a href="tel:${phone}" class="contact-info">${phone}</a>
                        </span>
                    </div>
                    ` : ''}
                    <div class="info-row">
                        <span class="info-label">Submitted:</span>
                        <span class="info-value">${submissionTime}</span>
                    </div>
                </div>
                
                <div class="message-section">
                    <h3>💬 Message Details</h3>
                    <div class="subject-line">
                        <strong>Subject:</strong> ${subject}
                    </div>
                    <div class="message-content">${message}</div>
                </div>
                
                <div class="action-buttons">
                    <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" class="btn btn-primary">
                        ✉️ Reply to Customer
                    </a>
                    <a href="tel:${phone}" class="btn btn-secondary">
                        📞 Call Customer
                    </a>
                </div>
                
                <div class="metadata">
                    <div class="metadata-row">
                        <span>Form submitted via:</span>
                        <span>${process.env.NEXT_PUBLIC_APP_URL || 'Website Contact Form'}</span>
                    </div>
                    <div class="metadata-row">
                        <span>Submission ID:</span>
                        <span>${Date.now().toString(36).toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `,
    text: `
NEW CONTACT FORM SUBMISSION - ${config.priority}

Customer Information:
- Name: ${firstName} ${lastName}
- Email: ${email}
${phone ? `- Phone: ${phone}` : ''}
- Submitted: ${submissionTime}

Subject: ${subject}

Message:
${message}

Reply to this customer at: ${email}
${phone ? `Or call them at: ${phone}` : ''}

---
Submission ID: ${Date.now().toString(36).toUpperCase()}
Form submitted via: ${process.env.NEXT_PUBLIC_APP_URL || 'Website Contact Form'}
    `
  };
};

// Customer confirmation email template
const createCustomerConfirmationEmail = (firstName: string, lastName: string, subject: string) => {
  const expectedResponse = subject.toLowerCase().includes('urgent') ? '24 hours' : '1-2 business days';
  
  return {
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting Us</title>
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
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
            }
            
            .header-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .header h1 {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .header p {
                opacity: 0.9;
                font-size: 16px;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 18px;
                color: #2d3748;
                margin-bottom: 25px;
            }
            
            .confirmation-card {
                background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
                border: 1px solid #81e6d9;
                padding: 25px;
                border-radius: 8px;
                margin: 25px 0;
                text-align: center;
            }
            
            .confirmation-icon {
                font-size: 32px;
                margin-bottom: 15px;
            }
            
            .confirmation-title {
                font-size: 20px;
                font-weight: 600;
                color: #065f46;
                margin-bottom: 10px;
            }
            
            .confirmation-message {
                color: #047857;
                font-size: 16px;
                margin-bottom: 15px;
            }
            
            .response-time {
                background-color: #ffffff;
                padding: 12px 20px;
                border-radius: 6px;
                color: #065f46;
                font-weight: 500;
                display: inline-block;
            }
            
            .next-steps {
                background-color: #f7fafc;
                padding: 25px;
                border-radius: 8px;
                margin: 30px 0;
            }
            
            .next-steps h3 {
                color: #2d3748;
                margin-bottom: 15px;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .steps-list {
                list-style: none;
                padding: 0;
            }
            
            .steps-list li {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 12px;
                padding: 12px;
                background-color: #ffffff;
                border-radius: 6px;
                border-left: 3px solid #10b981;
            }
            
            .step-number {
                background-color: #10b981;
                color: white;
                font-size: 12px;
                font-weight: bold;
                padding: 4px 8px;
                border-radius: 50%;
                min-width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .step-text {
                color: #4a5568;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .contact-info {
                background-color: #f1f5f9;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
                text-align: center;
            }
            
            .contact-info h3 {
                color: #2d3748;
                margin-bottom: 15px;
                font-size: 16px;
            }
            
            .contact-methods {
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            .contact-method {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #4a5568;
                font-size: 14px;
            }
            
            .contact-method a {
                color: #3b82f6;
                text-decoration: none;
            }
            
            .contact-method a:hover {
                text-decoration: underline;
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
            
            .social-links {
                margin-top: 20px;
            }
            
            .social-links a {
                display: inline-block;
                margin: 0 10px;
                padding: 8px;
                background-color: #e2e8f0;
                border-radius: 50%;
                color: #4a5568;
                text-decoration: none;
                font-size: 16px;
                width: 36px;
                height: 36px;
                line-height: 20px;
            }
            
            @media (max-width: 600px) {
                .content {
                    padding: 30px 20px;
                }
                
                .contact-methods {
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="header-icon">✉️</div>
                <h1>Thank You for Reaching Out!</h1>
                <p>We've received your message and will get back to you soon</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hi ${firstName},
                </div>
                
                <div class="confirmation-card">
                    <div class="confirmation-icon">✅</div>
                    <div class="confirmation-title">Message Received Successfully</div>
                    <div class="confirmation-message">
                        Thank you for contacting us about "${subject}". We appreciate you taking the time to reach out.
                    </div>
                    <div class="response-time">
                        📞 Expected response time: ${expectedResponse}
                    </div>
                </div>
                
                <p style="color: #4a5568; margin: 25px 0; line-height: 1.8;">
                    Your message is important to us, and our team will review it carefully. We'll get back to you as soon as possible with a detailed response.
                </p>
                
                <div class="next-steps">
                    <h3>🚀 What happens next?</h3>
                    <ul class="steps-list">
                        <li>
                            <span class="step-number">1</span>
                            <span class="step-text">Our team will review your message within the next few hours</span>
                        </li>
                        <li>
                            <span class="step-number">2</span>
                            <span class="step-text">We'll research your inquiry and prepare a comprehensive response</span>
                        </li>
                        <li>
                            <span class="step-number">3</span>
                            <span class="step-text">You'll receive a personalized reply within ${expectedResponse}</span>
                        </li>
                    </ul>
                </div>
                
                <div class="contact-info">
                    <h3>Need immediate assistance?</h3>
                    <div class="contact-methods">
                        <div class="contact-method">
                            📧 <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM}">${process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM}</a>
                        </div>
                        ${process.env.SUPPORT_PHONE ? `
                        <div class="contact-method">
                            📞 <a href="tel:${process.env.SUPPORT_PHONE}">${process.env.SUPPORT_PHONE}</a>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p>Thank you for choosing ${process.env.COMPANY_NAME || 'us'}!</p>
                <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.</p>
                
                <div class="social-links">
                    <a href="#" title="Facebook">📘</a>
                    <a href="#" title="Twitter">🐦</a>
                    <a href="#" title="LinkedIn">💼</a>
                    <a href="#" title="Instagram">📷</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `,
    text: `
Thank You for Contacting Us!

Hi ${firstName},

We've successfully received your message about "${subject}" and wanted to confirm that it's in our system.

What happens next:
1. Our team will review your message within the next few hours
2. We'll research your inquiry and prepare a comprehensive response  
3. You'll receive a personalized reply within ${expectedResponse}

Your message is important to us, and we'll get back to you as soon as possible with a detailed response.

Need immediate assistance?
Email: ${process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM}
${process.env.SUPPORT_PHONE ? `Phone: ${process.env.SUPPORT_PHONE}` : ''}

Thank you for choosing ${process.env.COMPANY_NAME || 'us'}!

---
© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.
    `
  };
};

export async function POST(req: NextRequest) {
  // Rate limit: 5 submissions per hour per IP
  const ip = getIp(req);
  const { allowed } = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const data = await req.json();

    // Validate required fields
    const firstName = clamp(data.firstName, 50);
    const lastName  = clamp(data.lastName,  50);
    const email     = clamp(data.email,      254);
    const phone     = clamp(data.phone,      20);
    const subject   = clamp(data.subject,    100);
    const message   = clamp(data.message,    2000);

    if (!firstName || !isValidEmail(email) || !subject || !message) {
      return NextResponse.json({
        success: false,
        error: 'Please provide your name, a valid email, subject, and message.',
      }, { status: 400 });
    }

    // Escape all user input before inserting into HTML email templates
    const safe = {
      firstName: escapeHtml(firstName),
      lastName:  escapeHtml(lastName),
      email:     escapeHtml(email),
      phone:     escapeHtml(phone),
      subject:   escapeHtml(subject),
      message:   escapeHtml(message),
    };

    const adminEmail    = createAdminNotificationEmail(safe.firstName, safe.lastName, safe.email, safe.phone, safe.subject, safe.message);
    const customerEmail = createCustomerConfirmationEmail(safe.firstName, safe.lastName, safe.subject);

    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      process.env.EMAIL_FROM!,
      subject: `🔔 New Contact: ${safe.subject}`,
      replyTo: email,
      html:    adminEmail.html,
      text:    adminEmail.text,
    });

    if (process.env.SEND_CUSTOMER_CONFIRMATION !== 'false') {
      try {
        await resend.emails.send({
          from:    process.env.EMAIL_FROM!,
          to:      email,
          subject: `Thank you for contacting ${process.env.COMPANY_NAME || 'us'} - We'll be in touch!`,
          html:    customerEmail.html,
          text:    customerEmail.text,
        });
      } catch (confirmationError) {
        console.error('Error sending confirmation email:', confirmationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully! We'll get back to you soon.",
    });

  } catch {
    return NextResponse.json({ success: false, error: 'Failed to send message. Please try again later.' }, { status: 500 });
  }
}
