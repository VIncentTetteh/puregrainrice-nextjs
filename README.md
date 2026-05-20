# PureGrain Rice - E-Commerce Platform

Premium aromatic long grain rice e-commerce platform for **PurePlatter Foods LTD**, proudly serving customers across Ghana.

![PureGrain Rice](public/IMG_4866.png)

## 🌾 About PurePlatter Foods LTD

PurePlatter Foods LTD is a Ghanaian company committed to delivering exceptional quality premium aromatic long grain rice. We offer convenient online ordering with fast delivery across 20+ cities in Ghana.

## 🚀 Features

### Customer-Facing Features
- **Product Showcase**: Browse our premium rice offerings with detailed information
- **Online Shopping**: Easy-to-use shopping cart with multiple product sizes
  - 5KG bags: ₵120
  - 10KG bags: ₵240 (Most Popular)
  - 25KG bags: ₵575 (Bulk)
- **Secure Checkout**: Integrated with Paystack for secure payments
- **User Dashboard**: Track order history and status
- **Review System**: Leave verified reviews after delivery
- **WhatsApp Integration**: Quick customer support via WhatsApp
- **Multi-City Delivery**: Serving 20+ cities across Ghana

### Admin Features
- **Order Management**: View, filter, and update order status
- **Customer Management**: Comprehensive customer database with analytics
- **Email Notifications**: Automated emails for order status updates
- **Order Statistics**: Dashboard with key metrics
- **Tracking Numbers**: Generate and manage delivery tracking codes
- **Admin Notes**: Add internal notes to orders

### Technical Features
- **Google OAuth Authentication**: Secure user login
- **Real-time Cart Sync**: Cart persists across devices
- **Responsive Design**: Mobile-first, works on all devices
- **SEO Optimized**: Structured data, meta tags, and Open Graph
- **Email Integration**: Automated emails via Resend API
- **Payment Gateway**: Paystack integration for secure payments

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.3.4](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Styling**: [Tailwind CSS 4.1.10](https://tailwindcss.com/)
- **Animations**: Framer Motion
- **Email**: [Resend](https://resend.com/)
- **Payments**: [Paystack](https://paystack.com/)
- **UI Icons**: Font Awesome 6.0

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm/bun
- Supabase account
- Paystack account (for payments)
- Resend account (for emails)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd puregrainrice-nextjs
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Environment Variables**

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY_TEST=your_paystack_test_key

# Resend Email
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@pureplatterfoods.com
EMAIL_TO=admin@pureplatterfoods.com
SUPPORT_EMAIL=support@pureplatterfoods.com
SUPPORT_PHONE=+233542880528

# App Configuration
COMPANY_NAME=PurePlatter Foods LTD
COMPANY_ADDRESS=Taifa Suma Ampim 23, Ghana
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

4. **Database Setup**

Run the Supabase migrations (SQL files in the database folder) to set up:
- `orders` table
- `order_items` table
- `customers` table
- `reviews` table
- `cart_items` table
- `invoices` table
- `invoice_items` table

5. **Configure Admin Access**

Update admin emails in `src/lib/admin.ts`:
```typescript
const ADMIN_EMAILS = [
  'your-admin-email@example.com'
];
```

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── admin/              # Admin portal pages
│   │   ├── customers/      # Customer management
│   │   └── page.tsx        # Order management
│   ├── api/                # API routes
│   │   ├── admin/          # Admin API endpoints
│   │   ├── contact/        # Contact form handler
│   │   ├── reviews/        # Reviews API
│   │   └── notify-admin-order/ # Order notifications
│   ├── auth/               # OAuth callback
│   ├── dashboard/          # User dashboard
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # React components
│   ├── About.tsx
│   ├── Benefits.tsx
│   ├── CartModal.tsx
│   ├── CheckoutForm.tsx
│   ├── Contact.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── Navigation.tsx
│   ├── Products.tsx
│   ├── ReviewsCarousel.tsx
│   ├── Shop.tsx
│   └── WhatsAppButton.tsx
├── contexts/               # React Context providers
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── lib/                    # Utility functions
│   ├── supabase.ts         # Supabase client
│   └── admin.ts            # Admin utilities
└── types/                  # TypeScript types
    └── database.ts
```

## 🎨 Design System

### Color Palette
- **Rice Gold**: `#D4AF37` - Primary accent
- **Rice Cream**: `#F5F5DC` - Background
- **Ghana Red**: `#CE1126` - Accent
- **Ghana Gold**: `#FCD116` - Secondary
- **Ghana Green**: `#006B3F` - Secondary

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700

## 🔐 Authentication & Security

- Google OAuth via Supabase Auth
- Protected routes with middleware
- Admin-only access control
- HTTP-only session cookies
- CSRF protection
- Input validation and sanitization

## 📧 Email Templates

Automated emails are sent for:
- Order confirmation
- Order status updates (Confirmed, Shipped, Delivered)
- Contact form submissions
- Customer notifications

## 💳 Payment Integration

- **Provider**: Paystack
- **Currencies**: GHS (Ghana Cedis)
- **Test Mode**: Enabled for development
- **Webhook Support**: For real-time payment verification

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
npm run build
```

### Environment Configuration

Ensure all production environment variables are set:
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Use production Paystack keys
- Configure production Supabase instance
- Set up production email domain with Resend

## 📊 Database Schema

### Main Tables

**orders**
- Order information, status tracking
- Customer details
- Payment references
- Delivery information

**order_items**
- Individual items in each order
- Product details and pricing

**customers**
- Customer profiles
- Order statistics
- Contact preferences

**reviews**
- Product reviews (verified only)
- Star ratings
- User feedback

**cart_items**
- Temporary cart storage
- Cross-device cart sync

## 🌐 Supported Delivery Cities

Accra, Kumasi, Takoradi, Tamale, Cape Coast, Tema, Koforidua, Ho, Sunyani, Techiman, Obuasi, Tarkwa, Wa, Bolgatanga, Tafo, Nkawkaw, Aflao, Berekum, Konongo, and more.

## 📱 Social Media

- **Facebook**: [PurePlatter Foods LTD](https://www.facebook.com/PurePlatter-Foods-LTD)
- **LinkedIn**: [pureplatter-foods-ltd](https://www.linkedin.com/in/pureplatter-foods-ltd)
- **TikTok**: [@pureplatterfoodsltdgh](https://www.tiktok.com/@pureplatterfoodsltdgh)
- **WhatsApp**: +233 54 288 0528

## 🤝 Contributing

This is a proprietary project for PurePlatter Foods LTD. For internal development guidelines, contact the development team.

## 📄 License

Copyright © 2025 PurePlatter Foods LTD. All rights reserved.

## 🆘 Support

For technical support or business inquiries:
- **Email**: info@pureplatterfoods.com
- **Phone**: +233 54 288 0528
- **WhatsApp**: +233 54 288 0528
- **Address**: Taifa Suma Ampim 23, Ghana

## 🎯 Roadmap

- [ ] SMS notifications integration
- [ ] Advanced analytics dashboard
- [ ] Inventory management system
- [ ] Multi-product support
- [ ] Subscription/recurring orders
- [ ] Loyalty program
- [ ] Mobile app (React Native)
- [ ] B2B wholesale portal

---

**Built with ❤️ in Ghana** | Powered by Next.js, Supabase & Paystack
