import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import CartModal from '@/components/CartModal'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported but less commonly used
  interactiveWidget: 'resizes-visual',
}

export const metadata: Metadata = {
  title: "PurePlatter Foods LTD - Premium Food Products from Ghana | PureGrain Rice",
  description: "PurePlatter Foods LTD delivers exceptional quality food products from Ghana. Shop our premium aromatic long grain PureGrain Rice with online ordering and fast delivery across 20+ cities. Order 5KG, 10KG, or 25KG bags today!",
  keywords: "PurePlatter Foods, food products ghana, rice ghana, premium rice, aromatic rice, long grain rice, PureGrain Rice, buy rice online ghana, rice delivery ghana, ghana rice, quality rice, bulk rice ghana, 5kg rice, 10kg rice, 25kg rice, accra rice delivery, kumasi rice delivery, takoradi rice delivery, ghana food company",
  authors: [{ name: "PurePlatter Foods LTD" }],
  creator: "PurePlatter Foods LTD",
  publisher: "PurePlatter Foods LTD",
  applicationName: "PurePlatter Foods",
  category: "Food & Beverage",
  openGraph: {
    title: "PurePlatter Foods LTD - Premium Food Products from Ghana",
    description: "Premium quality food products from Ghana. Shop PureGrain Rice and more. Fast delivery across Ghana. Available in 5KG (₵120), 10KG (₵240), and 25KG (₵575) bags. Trusted by thousands of Ghanaian families.",
    url: "https://www.pureplatterfoods.com",
    siteName: "PurePlatter Foods LTD",
    images: [
      {
        url: "/IMG_4866.png",
        width: 1200,
        height: 630,
        alt: "PurePlatter Foods LTD - Premium Food Products from Ghana",
      },
    ],
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PurePlatter Foods LTD - Premium Food Products from Ghana",
    description: "Premium quality food products from Ghana. Shop PureGrain Rice online. Fast delivery across Ghana. Available in 5KG, 10KG, and 25KG bags.",
    images: ["/IMG_4866.png"],
  },
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  icons: {
    icon: [
      { url: "/IMG_4866.png", sizes: "32x32", type: "image/png" },
      { url: "/IMG_4866.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/IMG_4866.png",
    shortcut: "/IMG_4866.png",
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-google-verification-code',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.pureplatterfoods.com/#organization",
        "name": "PurePlatter Foods LTD",
        "url": "https://www.pureplatterfoods.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.pureplatterfoods.com/IMG_4866.png",
          "width": 1080,
          "height": 1080
        },
        "sameAs": [
          "https://www.facebook.com/PurePlatter-Foods-LTD",
          "https://www.linkedin.com/in/pureplatter-foods-ltd",
          "https://www.tiktok.com/@pureplatterfoodsltdgh"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+233-54-288-0528",
          "contactType": "Customer Service",
          "areaServed": "GH",
          "availableLanguage": ["English"]
        },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Taifa Suma Ampim 23",
          "addressCountry": "GH"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://www.pureplatterfoods.com/#website",
        "url": "https://www.pureplatterfoods.com",
        "name": "PurePlatter Foods LTD",
        "description": "Premium food products from Ghana",
        "publisher": {
          "@id": "https://www.pureplatterfoods.com/#organization"
        }
      },
      {
        "@type": "Product",
        "name": "PureGrain Rice - Aromatic Long Grain",
        "description": "Premium aromatic long grain rice proudly produced in Ghana",
        "brand": {
          "@type": "Brand",
          "name": "PureGrain Rice"
        },
        "offers": [
          {
            "@type": "Offer",
            "name": "5KG Bag",
            "price": "120",
            "priceCurrency": "GHS",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@id": "https://www.pureplatterfoods.com/#organization"
            }
          },
          {
            "@type": "Offer",
            "name": "10KG Bag",
            "price": "240",
            "priceCurrency": "GHS",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@id": "https://www.pureplatterfoods.com/#organization"
            }
          },
          {
            "@type": "Offer",
            "name": "25KG Bag",
            "price": "575",
            "priceCurrency": "GHS",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@id": "https://www.pureplatterfoods.com/#organization"
            }
          }
        ]
      }
    ]
  };

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
        {/* Fonts loaded via next/font — no extra link needed */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-inter, Inter, sans-serif)',
              fontSize: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#ffffff',
              color: '#1A1A1A',
              boxShadow: '0 10px 40px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid rgba(201,168,76,0.15)',
            },
            success: {
              iconTheme: { primary: '#C9A84C', secondary: '#ffffff' },
            },
          }}
        />
        <AuthProvider>
          <CartProvider>
            {children}
            <CartModal />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
