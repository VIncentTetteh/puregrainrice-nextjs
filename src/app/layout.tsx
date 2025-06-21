import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import Script from "next/script";


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

        {children}
      </body>
    </html>
  );
}
