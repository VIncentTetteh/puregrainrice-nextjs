const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">About PurePlatter Foods</h2>
          <div className="w-24 h-1 bg-rice-gold mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Located in the heart of Taifa Suma Ampim, PurePlatter Foods LTD is dedicated to bringing you the finest quality rice straight from Ghana&apos;s fertile lands.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-800 mb-6">Our Story</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              PurePlatter Foods LTD was founded with a simple mission: to deliver premium quality rice that represents the best of Ghanaian agriculture. Located at Taifa Suma Ampim 23, our facility combines traditional farming wisdom with modern processing techniques.
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Our PureGrain Rice is a testament to Ghana&apos;s rich agricultural heritage. Each grain is carefully selected, processed, and packaged to ensure maximum freshness and flavor reaches your table.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <i className="fas fa-map-marker-alt text-rice-gold mr-2"></i>
                <span className="text-gray-600">Taifa Suma Ampim 23, Ghana</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-gradient-to-br from-rice-gold to-yellow-600 rounded-lg p-8 text-center">
              <i className="fas fa-seedling text-white text-8xl mb-6"></i>
              <h4 className="text-2xl font-bold text-white mb-4">100% Ghanaian</h4>
              <p className="text-white opacity-90">
                Grown, processed, and packaged with pride in Ghana
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
