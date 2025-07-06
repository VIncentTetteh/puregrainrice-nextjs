'use client';
import LayoutWrapper from '@/components/LayoutWrapper';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Products from '@/components/Products';
import Benefits from '@/components/Benefits';
import Shop from '@/components/Shop';
// import ReviewsCarousel from '@/components/ReviewsCarousel';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ReviewsCarousel from '@/components/ReviewsCarousel';

export default function Home() {
  return (
    <LayoutWrapper>
      <div className="bg-ricecream text-gray-800">
        <Hero />
<About />
        <Products />
        <Benefits />
        <ReviewsCarousel />
        <Shop />
        <Contact />
        <Footer />
        <WhatsAppButton />
      </div>
    </LayoutWrapper>
  );
}
