const WhatsAppButton = () => {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <a 
        href="https://wa.me/233542880528?text=Hello, I'm interested in PureGrain Rice. Can you tell me more about your products?" 
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition duration-300 flex items-center justify-center group"
      >
        <i className="fab fa-whatsapp text-2xl"></i>
        <span className="ml-2 hidden group-hover:inline transition-all duration-300 whitespace-nowrap">Chat with us</span>
      </a>
    </div>
  );
};

export default WhatsAppButton;
