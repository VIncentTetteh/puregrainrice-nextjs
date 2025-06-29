'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const riceImages = [
  'https://images.unsplash.com/photo-1592997572594-34be01bc36c7?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1549888728-c4df900ccba7?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1686820740687-426a7b9b2043?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?auto=format&fit=crop&w=1600&q=80',
];

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % riceImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="home"
      className="relative w-full min-h-screen flex items-center justify-center pt-16 overflow-hidden"
    >
      {/* Background carousel */}
      <div className="absolute inset-0 z-0">
        {riceImages.map((url, index) => (
          <Image
            key={index}
            src={url}
            alt={`Rice processing ${index}`}
            fill
            sizes="100vw"
            priority={index === 0}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Foreground content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-rice-gold mb-6 ">
            PureGrain Rice & More
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8">
            Premium Aromatic Long Grain Rice<br />
            <span className="text-ghana-green font-semibold bg-white px-2 rounded">
              Proudly Produced in Ghana
            </span>
          </p>
          <div className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center">
            <button
              onClick={() => scrollToSection('shop')}
              className="bg-rice-gold hover:bg-yellow-600 text-white px-8 py-3 rounded-full text-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl"
            >
              Order Now
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="border-2 border-rice-gold text-rice-gold hover:bg-rice-gold hover:text-white px-8 py-3 rounded-full text-lg font-semibold transition duration-300"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
        <i className="fas fa-chevron-down text-rice-gold text-2xl"></i>
      </div>
    </section>
  );
};

export default Hero;
