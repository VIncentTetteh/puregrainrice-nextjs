'use client';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Products from '@/components/Products';
import Benefits from '@/components/Benefits';
import Shop from '@/components/Shop';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import CartModal from '@/components/CartModal';
import WhatsAppButton from '@/components/WhatsAppButton';
import { CartProvider } from '@/contexts/CartContext';

export default function Home() {
  return (
    <CartProvider>
      <div className="bg-ricecream text-gray-800">
        <Navigation />
        <Hero />
        <About />
        <Products />
        <Benefits />
        <Shop />
        <Contact />
        <Footer />
        <CartModal />
        <WhatsAppButton />
      </div>
    </CartProvider>
  );
}