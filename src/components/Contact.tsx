'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const contactInfo = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Address',
    value: 'Taifa Suma Ampim 23, Ghana',
    href: null,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    label: 'Phone',
    value: '+233 54 288 0528',
    href: 'tel:+233542880528',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Email',
    value: 'info@pureplatterfoods.com',
    href: 'mailto:info@pureplatterfoods.com',
  },
];

const hours = [
  { day: 'Monday – Friday', time: '8:00 AM – 6:00 PM' },
  { day: 'Saturday', time: '8:00 AM – 4:00 PM' },
  { day: 'Sunday', time: 'Closed' },
];

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    subject: 'General Inquiry', message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v: string) => {
    const clean = v.replace(/[\s\-\(\)]/g, '');
    return clean.length >= 10 && /^[\+]?[1-9][\d]{0,15}$/.test(clean);
  };
  const validateName = (v: string) => v.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(v.trim());
  const validateMessage = (v: string) => v.trim().length >= 10 && v.trim().length <= 1000;

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!validateName(formData.firstName)) e.firstName = 'Enter a valid first name (min 2 letters)';
    if (!validateName(formData.lastName)) e.lastName = 'Enter a valid last name (min 2 letters)';
    if (!validateEmail(formData.email)) e.email = 'Enter a valid email address';
    if (formData.phone && !validatePhone(formData.phone)) e.phone = 'Enter a valid phone number';
    if (!validateMessage(formData.message)) e.message = 'Message must be 10–1000 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the errors below'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Message sent! We\'ll get back to you soon.', { icon: '✅' });
        setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
        setErrors({});
      } else {
        throw new Error(result.error || 'Failed');
      }
    } catch {
      toast.error('Could not send message. Try WhatsApp instead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-4 py-3 rounded-xl border text-[var(--charcoal)] bg-[var(--off-white)] text-sm transition-all duration-200 outline-none focus:ring-2 placeholder:text-[var(--charcoal-muted)]/50 ${
      errors[field]
        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
        : 'border-[var(--cream-dark)] focus:ring-[var(--gold-muted)] focus:border-[var(--gold)]'
    }`;

  return (
    <section
      id="contact"
      className="overflow-hidden"
      style={{
        paddingTop: 'var(--section-py)',
        paddingBottom: 'var(--section-py)',
        background: 'linear-gradient(160deg, var(--charcoal) 0%, var(--charcoal-light) 40%, #1e2d25 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge bg-white/10 text-white/80 border border-white/15 mb-4">
            Get In Touch
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            We&apos;d Love to <span className="text-gradient-gold">Hear From You</span>
          </h2>
          <div className="gold-divider my-6" />
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Whether you have a question about our products, want to place a bulk order,
            or just want to say hello — we&apos;re here.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">

          {/* Left: Contact Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Contact Items */}
            <div className="space-y-4">
              {contactInfo.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-white/05 border border-white/08 hover:bg-white/08 transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center text-[var(--gold-dark)] flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-white/90 text-sm font-medium hover:text-[var(--gold-light)] transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-white/90 text-sm font-medium">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Business Hours */}
            <div className="p-5 rounded-2xl bg-white/05 border border-white/08">
              <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
                Business Hours
              </h4>
              <div className="space-y-2.5">
                {hours.map((h, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-white/50">{h.day}</span>
                    <span className={`text-sm font-medium ${h.time === 'Closed' ? 'text-red-400' : 'text-[var(--gold-light)]'}`}>
                      {h.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/233542880528"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/15 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.85L.057 23.571a.5.5 0 00.613.614l5.782-1.472A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.5-5.228-1.374l-.375-.213-3.885.99.999-3.8-.226-.384A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-[#25D366] transition-colors">
                  Chat on WhatsApp
                </p>
                <p className="text-xs text-white/40">Usually responds in minutes</p>
              </div>
              <svg className="w-4 h-4 text-white/30 ml-auto group-hover:text-[#25D366] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-premium">
              <h3
                className="text-2xl font-bold text-[var(--charcoal)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Send Us a Message
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Kwame"
                      className={inputClass('firstName')}
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1.5">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Mensah"
                      className={inputClass('lastName')}
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1.5">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="kwame@example.com"
                    className={inputClass('email')}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
                      Phone <span className="text-[var(--charcoal-muted)]/50 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+233 54 288 0528"
                      className={inputClass('phone')}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
                      Subject
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--cream-dark)] focus:ring-2 focus:ring-[var(--gold-muted)] focus:border-[var(--gold)] text-[var(--charcoal)] bg-[var(--off-white)] text-sm outline-none transition-all duration-200"
                    >
                      <option>General Inquiry</option>
                      <option>Product Information</option>
                      <option>Bulk Order</option>
                      <option>Partnership</option>
                      <option>Complaint</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
                    Message <span className="text-red-500">*</span>
                    <span className="text-[var(--charcoal-muted)]/50 normal-case font-normal ml-2">
                      ({formData.message.length}/1000)
                    </span>
                  </label>
                  <textarea
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us what you need — we're happy to help…"
                    className={`${inputClass('message')} resize-none`}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1.5">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full !rounded-xl !py-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        style={{ animation: 'spin 0.8s linear infinite' }}
                      />
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
