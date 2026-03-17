const benefits = [
  {
    emoji: '🌿',
    title: '100% Natural',
    description: 'No artificial additives, no bleaching, no preservatives. Just pure rice as nature intended — honest and clean.',
    accent: 'gold',
  },
  {
    emoji: '💚',
    title: 'Nutritious & Wholesome',
    description: 'Rich in complex carbohydrates, essential minerals, and natural nutrients to fuel your family\'s active lifestyle.',
    accent: 'forest',
  },
  {
    emoji: '⭐',
    title: 'Premium Quality',
    description: 'Every batch is rigorously inspected and graded. Only the finest grains make it into a PureGrain bag.',
    accent: 'gold',
  },
  {
    emoji: '🏡',
    title: 'Locally Sourced',
    description: 'Grown by Ghanaian farmers on Ghanaian soil. Every purchase directly supports local agricultural livelihoods.',
    accent: 'forest',
  },
  {
    emoji: '📦',
    title: 'Freshness Sealed',
    description: 'Advanced multi-layer packaging locks in aroma and freshness from our facility straight to your kitchen.',
    accent: 'gold',
  },
  {
    emoji: '🔬',
    title: 'Quality Controlled',
    description: 'Rigorous end-to-end quality control from farm to bag means you get the same exceptional rice every time.',
    accent: 'forest',
  },
];

const trustSignals = [
  { value: '5,000+', label: 'Families Served', icon: '👨‍👩‍👧‍👦' },
  { value: '4.9/5', label: 'Average Rating', icon: '⭐' },
  { value: '20+', label: 'Cities in Ghana', icon: '🗺️' },
  { value: '0%', label: 'Artificial Additives', icon: '✅' },
];

const Benefits = () => {
  return (
    <section
      id="benefits"
      className="bg-white overflow-hidden"
      style={{ paddingTop: 'var(--section-py)', paddingBottom: 'var(--section-py)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge badge-forest mb-4">
            Why PureGrain?
          </span>
          <h2 className="section-heading mb-4">
            The Difference You Can <span className="text-gradient-gold">Taste & Trust</span>
          </h2>
          <div className="gold-divider my-6" />
          <p className="section-subheading">
            From the seed in the ground to the grain in your pot — quality is our
            non-negotiable at every single step.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group card p-7 cursor-default"
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-all duration-300 group-hover:scale-110 ${
                  benefit.accent === 'gold'
                    ? 'bg-[var(--gold-muted)]'
                    : 'bg-[var(--forest-muted)]'
                }`}
              >
                {benefit.emoji}
              </div>

              {/* Content */}
              <h3
                className="text-xl font-bold text-[var(--charcoal)] mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {benefit.title}
              </h3>
              <p className="text-[var(--charcoal-muted)] text-sm leading-relaxed">
                {benefit.description}
              </p>

              {/* Bottom accent bar */}
              <div
                className={`mt-6 h-0.5 w-0 group-hover:w-12 transition-all duration-500 rounded-full ${
                  benefit.accent === 'gold' ? 'bg-[var(--gold)]' : 'bg-[var(--forest)]'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Trust Signals Banner */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 50%, var(--gold-dark) 100%)',
          }}
        >
          <div className="px-8 py-12">
            <div className="text-center mb-10">
              <h3
                className="text-3xl font-bold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Trusted by Ghanaian Families
              </h3>
              <p className="text-white/60 text-sm">
                The numbers speak for themselves
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustSignals.map((signal, i) => (
                <div key={i} className="text-center">
                  <span className="text-3xl block mb-2">{signal.icon}</span>
                  <span
                    className="block text-3xl font-bold text-[var(--gold-light)] mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {signal.value}
                  </span>
                  <span className="text-white/60 text-xs uppercase tracking-wider font-medium">
                    {signal.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
