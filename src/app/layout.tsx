import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import Script from "next/script";
import { Toaster } from 'react-hot-toast';



const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported but less commonly used
  interactiveWidget: 'resizes-visual',
}

export const metadata: Metadata = {
  title: "PureGrain Rice - Premium Aromatic Long Grain Rice from Ghana",
  description: "Premium aromatic long grain rice proudly produced by PurePlatter Foods LTD in Ghana. We're committed to delivering exceptional quality and freshness to your table.",
  keywords: "rice, ghana, premium rice, aromatic rice, long grain rice, PureGrain, PurePlatter Foods",
  authors: [{ name: "PurePlatter Foods LTD" }],
  creator: "PurePlatter Foods LTD",
  publisher: "PurePlatter Foods LTD",
  openGraph: {
    title: "PureGrain Rice - Premium Aromatic Long Grain Rice from Ghana",
    description: "Premium aromatic long grain rice proudly produced by PurePlatter Foods LTD in Ghana. We're committed to delivering exceptional quality and freshness to your table.",
    url: "https://puregrainrice.com",
    siteName: "PureGrain Rice",
    images: [
      {
        url: "https://puregrainrice.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "PureGrain Rice - Premium Aromatic Long Grain Rice from Ghana",
      },
    ],
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PureGrain Rice - Premium Aromatic Long Grain Rice from Ghana",
    description: "Premium aromatic long grain rice proudly produced by PurePlatter Foods LTD in Ghana. We're committed to delivering exceptional quality and freshness to your table.",
    images: ["https://puregrainrice.com/og-image.png"],
    creator: "@PurePlatterFoods",
  },
  robots: {
    index: true,
    follow: true,
    noarchive: true,
    nosnippet: false,
    noimageindex: false,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  icons: {
    icon: "/leaf-solid.svg",
  },
  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
        <script src="https://unpkg.com/framer-motion@10/dist/framer-motion.js"></script>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-white text-gray-800 shadow-lg',
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              padding: '12px 16px',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
