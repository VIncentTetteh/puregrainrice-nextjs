// import { NextRequest, NextResponse } from 'next/server';
// import nodemailer from 'nodemailer';

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { firstName, lastName, email, phone, subject, message } = body;

//     // Validate required fields
//     if (!firstName || !lastName || !email || !message) {
//       return NextResponse.json(
//         { success: false, error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     // Basic email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return NextResponse.json(
//         { success: false, error: 'Invalid email address' },
//         { status: 400 }
//       );
//     }

//     // For development, we'll just log the form data and return success
//     // In production, you would implement actual email sending
//     console.log('Contact form submission:', {
//       firstName,
//       lastName,
//       email,
//       phone,
//       subject,
//       message,
//       timestamp: new Date().toISOString()
//     });

//     // Uncomment and configure the following code for actual email sending:
//     /*
//     // Create a transporter for sending emails
//     const transporter = nodemailer.createTransporter({
//       host: process.env.SMTP_HOST,
//       port: parseInt(process.env.SMTP_PORT || '587'),
//       secure: false,
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     // Email content
//     const mailOptions = {
//       from: process.env.FROM_EMAIL || 'noreply@pureplatterfoods.com',
//       to: process.env.RECIPIENT_EMAIL || 'vincentchrisbone@gmail.com',
//       subject: `PureGrain Rice Contact: ${subject}`,
//       text: `
//         Name: ${firstName} ${lastName}
//         Email: ${email}
//         Phone: ${phone || 'Not provided'}
//         Subject: ${subject}
        
//         Message:
//         ${message}
        
//         Sent from PureGrain Rice website contact form
//       `,
//       html: `
//         <h2>New Contact Form Submission</h2>
//         <p><strong>Name:</strong> ${firstName} ${lastName}</p>
//         <p><strong>Email:</strong> ${email}</p>
//         <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
//         <p><strong>Subject:</strong> ${subject}</p>
//         <br>
//         <p><strong>Message:</strong></p>
//         <p>${message.replace(/\n/g, '<br>')}</p>
//         <br>
//         <p><em>Sent from PureGrain Rice website contact form</em></p>
//       `,
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);
//     */

//     return NextResponse.json(
//       { success: true, message: 'Message sent successfully' },
//       { status: 200 }
//     );

//   } catch (error) {
//     console.error('Contact form error:', error);
//     return NextResponse.json(
//       { success: false, error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend('re_96TiZErM_C1bHNy5h5UJe2Z4Wbv2gj1ry');

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { firstName, lastName, email, phone, subject, message } = data;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!, // must be a verified sender on Resend
      to: process.env.EMAIL_TO!,
      subject: `New Contact Message: ${subject}`,
      replyTo: email,
      text: `
      Name: ${firstName} ${lastName}
      Email: ${email}
      Phone: ${phone}
      Subject: ${subject}

      Message:
      ${message}
            `,
          });

          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('[RESEND ERROR]', error);
          return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
        }
}

