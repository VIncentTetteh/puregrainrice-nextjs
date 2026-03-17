const metrics = [
  { value: '100%', label: 'Locally Sourced', icon: '🌾' },
  { value: '2020', label: 'Founded in Ghana', icon: '🇬🇭' },
  { value: '20+', label: 'Delivery Cities', icon: '🚚' },
  { value: '5★', label: 'Customer Rating', icon: '⭐' },
];

const values = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Community First',
    description: 'We invest in local farmers and communities, strengthening the agricultural backbone of Ghana.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Quality Obsessed',
    description: 'Every grain is carefully selected, processed, and packaged to our exacting standards.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
    title: 'Sustainably Grown',
    description: 'Our farming practices respect Ghana\'s fertile lands for generations to come.',
  },
];

const About = () => {
  return (
    <section id="about" className="bg-[var(--off-white)] overflow-hidden" style={{ paddingTop: 'var(--section-py)', paddingBottom: 'var(--section-py)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge badge-gold mb-4">
            Our Story
          </span>
          <h2 className="section-heading mb-4">
            Grown with Pride.<br />
            <span className="text-gradient-gold">Delivered with Love.</span>
          </h2>
          <div className="gold-divider my-6" />
          <p className="section-subheading">
            Located in the heart of Taifa Suma Ampim, PurePlatter Foods LTD brings you the finest
            quality food products straight from Ghana&apos;s fertile lands.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">

          {/* Left: Story */}
          <div>
            <h3
              className="text-3xl font-bold text-[var(--charcoal)] mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              A Mission Rooted in Ghana
            </h3>
            <div className="space-y-4 text-[var(--charcoal-muted)] leading-relaxed text-base">
              <p>
                PurePlatter Foods LTD was founded with a singular purpose — to showcase the best of Ghanaian
                agriculture. We combine generations of traditional farming wisdom with modern processing and
                packaging to deliver products that are as fresh as they are flavourful.
              </p>
              <p>
                Our flagship product, <strong className="text-[var(--charcoal)] font-semibold">PureGrain Perfume Rice</strong>,
                is an aromatic long grain variety grown on Ghana&apos;s fertile soils. Each bag
                represents our unwavering commitment to quality, purity, and authenticity.
              </p>
              <p>
                As we grow, we&apos;re expanding our range to include fresh fish, meats,
                cooking oils, and other local staples — always with the same promise:
                <em className="text-[var(--gold-dark)] not-italic font-medium"> Eat Ghana, Love Ghana.</em>
              </p>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 mt-8 p-4 bg-[var(--cream)] rounded-xl border border-[var(--gold-muted)]">
              <div className="w-10 h-10 rounded-full bg-[var(--gold-muted)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--gold-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--charcoal)]">Our Location</p>
                <p className="text-sm text-[var(--charcoal-muted)]">Taifa Suma Ampim 23, Ghana</p>
              </div>
            </div>

            {/* Values */}
            <div className="grid gap-4 mt-8">
              {values.map((v, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-[var(--cream)] transition-colors duration-200">
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center text-[var(--gold-dark)] flex-shrink-0">
                    {v.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--charcoal)] mb-1">{v.title}</h4>
                    <p className="text-sm text-[var(--charcoal-muted)] leading-relaxed">{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual + Stats */}
          <div className="space-y-6">
            {/* Hero image card */}
            <div className="relative rounded-2xl overflow-hidden shadow-premium aspect-[4/3]">
              {/* Gradient background placeholder (real product photo would go here) */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 40%, var(--gold-dark) 100%)',
                }}
              />
              {/* Decorative elements */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-10">
                <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6 animate-float">
                  <span className="text-5xl">🌾</span>
                </div>
                <h4
                  className="text-3xl font-bold text-white text-center mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  100% Ghanaian
                </h4>
                <p className="text-white/70 text-center text-sm">
                  Grown, processed &amp; packaged with pride in Ghana
                </p>
                <div className="mt-6 flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[var(--gold-light)]" />
                  <span className="text-white/90 text-sm font-medium">Est. 2020 · Taifa Suma Ampim</span>
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((m, i) => (
                <div
                  key={i}
                  className="card p-5 text-center"
                >
                  <span className="text-2xl mb-2 block">{m.icon}</span>
                  <span
                    className="block text-2xl font-bold text-[var(--gold-dark)] mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {m.value}
                  </span>
                  <span className="text-xs text-[var(--charcoal-muted)] uppercase tracking-wider font-medium">
                    {m.label}
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

export default About;
