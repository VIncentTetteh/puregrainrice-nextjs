import { useState } from 'react';
import toast from 'react-hot-toast';

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
}

const QuoteModal = ({ open, onClose }: QuoteModalProps) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Your quote request has been sent!');
        onClose();
      } else {
        toast.error('Failed to send quote request.');
      }
    } catch {
      toast.error('Failed to send quote request.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
        <button className="absolute top-2 right-3 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Request a Quote</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            type="text"
            required
            placeholder="Your Name"
            className="w-full border px-4 py-2 rounded"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Your Email"
            className="w-full border px-4 py-2 rounded"
            value={form.email}
            onChange={handleChange}
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone Number"
            className="w-full border px-4 py-2 rounded"
            value={form.phone}
            onChange={handleChange}
          />
          <input
            name="quantity"
            type="text"
            placeholder="Quantity (e.g. 10 bags)"
            className="w-full border px-4 py-2 rounded"
            value={form.quantity}
            onChange={handleChange}
          />
          <textarea
            name="message"
            placeholder="Additional details"
            className="w-full border px-4 py-2 rounded"
            value={form.message}
            onChange={handleChange}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rice-gold hover:bg-yellow-600 text-white px-4 py-2 rounded font-semibold"
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuoteModal;