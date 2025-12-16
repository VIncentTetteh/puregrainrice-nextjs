import Image from 'next/image';

const Footer = () => {
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
    <footer className="bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-white rounded-lg p-2">
                <Image
                  src="/IMG_4866.png"
                  alt="PurePlatter Foods Logo"
                  width={50}
                  height={50}
                  className="h-16 w-auto"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-rice-gold">PurePlatter Foods LTD</h3>
                <p className="text-sm text-gray-400">Premium Quality Products from Ghana</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">
            A Ghanaian company committed to delivering exceptional quality food products. Starting with our premium aromatic long grain PureGrain Rice, we&apos;re dedicated to bringing the finest products to your table.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/PurePlatter-Foods-LTD" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-rice-gold transition duration-300" aria-label="Visit our Facebook page">
                <i className="fab fa-facebook-f text-xl"></i>
              </a>
              <a href="https://www.tiktok.com/@pureplatterfoodsltdgh" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-rice-gold transition duration-300" aria-label="Visit our TikTok page">
                <i className="fab fa-tiktok text-xl"></i>
              </a>
              <a href="https://www.linkedin.com/in/pureplatter-foods-ltd" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-rice-gold transition duration-300" aria-label="Visit our LinkedIn page">
                <i className="fab fa-linkedin-in text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><button onClick={() => scrollToSection('home')} className="text-gray-300 hover:text-rice-gold transition duration-300">Home</button></li>
              <li><button onClick={() => scrollToSection('about')} className="text-gray-300 hover:text-rice-gold transition duration-300">About Us</button></li>
              <li><button onClick={() => scrollToSection('products')} className="text-gray-300 hover:text-rice-gold transition duration-300">Products</button></li>
              <li><button onClick={() => scrollToSection('benefits')} className="text-gray-300 hover:text-rice-gold transition duration-300">Benefits</button></li>
              <li><button onClick={() => scrollToSection('contact')} className="text-gray-300 hover:text-rice-gold transition duration-300">Contact</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Info</h4>
            <div className="space-y-2 text-gray-300">
              <p><i className="fas fa-map-marker-alt mr-2"></i>Taifa Suma Ampim 23, Ghana</p>
              <p><i className="fas fa-phone mr-2"></i>+233 54 288 0528</p>
              <p><i className="fas fa-envelope mr-2"></i>info@pureplatterfoods.com</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            &copy; 2025 PurePlatter Foods LTD. All rights reserved. | Made with <i className="fas fa-heart text-ghana-red"></i> in Ghana
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
