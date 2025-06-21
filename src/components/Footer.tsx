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
            <h3 className="text-2xl font-bold text-rice-gold mb-4">PureGrain Rice</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
            Premium aromatic long grain rice proudly produced by PurePlatter Foods LTD in Ghana. We&apos;re committed to delivering exceptional quality and freshness to your table.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-rice-gold transition duration-300">
                <i className="fab fa-facebook-f text-xl"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-rice-gold transition duration-300">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-rice-gold transition duration-300">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-rice-gold transition duration-300">
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
