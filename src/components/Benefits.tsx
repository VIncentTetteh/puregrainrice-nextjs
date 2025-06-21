const Benefits = () => {
  const benefits = [
    {
      icon: "fas fa-leaf",
      title: "100% Natural",
      description: "No artificial additives or preservatives. Just pure, natural rice as nature intended.",
      bgColor: "bg-rice-gold"
    },
    {
      icon: "fas fa-heart",
      title: "Nutritious",
      description: "Rich in essential nutrients and minerals to support your family's healthy lifestyle.",
      bgColor: "bg-rice-gold"
    },
    {
      icon: "fas fa-star",
      title: "Premium Quality",
      description: "Carefully selected grains ensure consistent quality and exceptional taste in every meal.",
      bgColor: "bg-rice-gold"
    },
    {
      icon: "fas fa-home",
      title: "Locally Sourced",
      description: "Supporting local farmers and communities while bringing you the freshest rice.",
      bgColor: "bg-ghana-green"
    },
    {
      icon: "fas fa-clock",
      title: "Fresh Packaging",
      description: "Advanced packaging techniques ensure maximum freshness from our facility to your kitchen.",
      bgColor: "bg-ghana-green"
    },
    {
      icon: "fas fa-certificate",
      title: "Quality Assured",
      description: "Rigorous quality control processes guarantee you receive only the best rice every time.",
      bgColor: "bg-ghana-green"
    }
  ];

  return (
    <section id="benefits" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Why Choose PureGrain?</h2>
          <div className="w-24 h-1 bg-rice-gold mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover what makes our rice the perfect choice for your family
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center p-8 rounded-xl hover:shadow-lg transition duration-300">
              <div className={`${benefit.bgColor} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6`}>
                <i className={`${benefit.icon} text-white text-2xl`}></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{benefit.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
