'use client';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const Shop = () => {
  const { addToCart, setIsCartOpen } = useCart();
  const { user } = useAuth();

  const products = [
    {
      id: 'puregrain-5kg',
      name: 'PureGrain Rice 5KG',
      price: 1,
      weight: '5KG',
      image: '/rice-5kg.jpg',
      bgColor: 'bg-gradient-to-br from-rice-gold to-yellow-600',
      buttonColor: 'bg-rice-gold hover:bg-yellow-600',
      features: ['Premium aromatic rice', '5KG sealed package', 'Fresh & clean']
    },
    {
      id: 'puregrain-10kg',
      name: 'PureGrain Rice 10KG',
      price: 230,
      weight: '10KG',
      image: '/rice-10kg.jpg',
      bgColor: 'bg-gradient-to-br from-ghana-green to-green-700',
      buttonColor: 'bg-ghana-green hover:bg-green-700',
      features: ['Premium aromatic rice', '10KG sealed package', 'Best value for families'],
      popular: true,
      savings: '₵10'
    },
    {
      id: 'puregrain-25kg',
      name: 'PureGrain Rice 25KG',
      price: 450,
      weight: '25KG Bulk',
      image: '/rice-25kg.jpg',
      bgColor: 'bg-gradient-to-br from-gray-700 to-black',
      buttonColor: 'bg-gray-800 hover:bg-black',
      features: ['Premium aromatic rice', '25KG bulk package', 'Perfect for businesses'],
      savings: '₵45'
    }
  ];

  const handleAddToCart = async (product: any) => {
    await addToCart(product.id, product.name, product.price, product.image);
    
    // Show success message
    toast.success(`${product.name} added to cart!`);
    
    // If user is not logged in, show the cart modal to encourage checkout
    if (!user) {
      setTimeout(() => {
        setIsCartOpen(true);
      }, 500); // Small delay so user sees the toast first
    }
  };

  return (
    <section id="shop" className="py-20 bg-rice-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Order PureGrain Rice</h2>
          <div className="w-24 h-1 bg-rice-gold mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our premium rice packages and enjoy fresh delivery to your doorstep
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 relative">
              {product.popular && (
                <div className="absolute top-4 right-4 bg-ghana-red text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Popular
                </div>
              )}
              <div className={`${product.bgColor} p-8 text-center`}>
                <i className="fas fa-wheat-alt text-white text-6xl mb-4"></i>
                <h3 className="text-2xl font-bold text-white mb-2">PureGrain Rice</h3>
                <p className="text-white opacity-90">{product.weight}</p>
              </div>
              <div className="p-8">
                <div className="text-center mb-6">
                  <span className={`text-4xl font-bold ${product.id === 'puregrain-5kg' ? 'text-rice-gold' : product.id === 'puregrain-10kg' ? 'text-ghana-green' : 'text-gray-800'}`}>
                    ₵{product.price}
                  </span>
                  <span className="text-gray-500 text-lg">/{product.weight.toLowerCase()}</span>
                  {product.savings && (
                    <div className="text-sm text-ghana-red font-semibold">Save {product.savings}!</div>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <i className="fas fa-check text-ghana-green mr-3"></i>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleAddToCart(product)}
                  className={`w-full ${product.buttonColor} text-white py-3 rounded-lg font-semibold transition duration-300`}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Shop;
