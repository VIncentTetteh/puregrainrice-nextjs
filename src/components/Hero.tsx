'use client';

const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-rice-cream to-white pt-16">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-rice-gold mb-6">
            PureGrain Rice
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Premium Aromatic Long Grain Rice<br />
            <span className="text-ghana-green font-semibold">Proudly Produced in Ghana</span>
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <i className="fas fa-chevron-down text-rice-gold text-2xl"></i>
      </div>
    </section>
  );
};

export default Hero;
