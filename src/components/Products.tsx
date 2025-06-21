const Products = () => {
  return (
    <section id="products" className="py-20 bg-[#F5F5DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Our Premium Rice</h2>
          <div className="w-24 h-1 bg-rice-gold mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the exceptional quality and aroma of our signature PureGrain Rice
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 bg-gradient-to-br from-rice-gold to-yellow-600 p-12 flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-wheat-alt text-white text-8xl mb-6"></i>
                  <h3 className="text-3xl font-bold text-white mb-4">PureGrain Rice</h3>
                  <p className="text-white opacity-90 text-lg">
                    Premium Aromatic Long Grain
                  </p>
                </div>
              </div>
              
              <div className="md:w-1/2 p-12">
                <h4 className="text-2xl font-bold text-gray-800 mb-6">Product Features</h4>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <i className="fas fa-check-circle text-ghana-green mr-3"></i>
                    <span className="text-gray-600">Pure perfumed aromatic rice</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check-circle text-ghana-green mr-3"></i>
                    <span className="text-gray-600">Premium long grain variety</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check-circle text-ghana-green mr-3"></i>
                    <span className="text-gray-600">Locally grown in Ghana</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check-circle text-ghana-green mr-3"></i>
                    <span className="text-gray-600">Carefully processed & packaged</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check-circle text-ghana-green mr-3"></i>
                    <span className="text-gray-600">Maximum freshness guaranteed</span>
                  </li>
                </ul>
                
                <div className="mt-8">
                    <button className="bg-rice-gold hover:bg-yellow-600 text-white px-8 py-3 rounded-full font-semibold transition duration-300 shadow-lg hover:shadow-xl">
                        Get Quote
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;