import { useState, useEffect } from 'react';
import api from '../lib/api';
import { allProducts } from '../lib/products';

export default function QuoteForm({ preselectedProduct, dark }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    productInterest: preselectedProduct || '',
    message: '',
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Listen for pre-fill events from the Medical Comparator
  useEffect(() => {
    const handler = (e) => {
      const { product, note } = e.detail || {};
      setForm(prev => ({
        ...prev,
        productInterest: product || prev.productInterest,
        message: note || prev.message,
      }));
    };
    window.addEventListener('engishu-prefill-quote', handler);
    return () => window.removeEventListener('engishu-prefill-quote', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/public/quote', form);
      setStatus({ type: 'success', text: res.data.message, ref: res.data.refNumber });
      setForm({ name: '', phone: '', email: '', productInterest: preselectedProduct || '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // All form fields: always white bg + dark text — regardless of section background
  const inputClass = 'w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-[#1A1A1A] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8] focus:border-transparent';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {status && (
        <div className={`px-4 py-4 rounded-xl text-sm ${
          status.type === 'success'
            ? dark ? 'bg-green-500/20 text-green-200' : 'bg-green-50 text-green-700 border border-green-200'
            : dark ? 'bg-red-500/20 text-red-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <p>{status.text}</p>
          {status.ref && (
            <p className={`mt-2 font-bold text-lg ${dark ? 'text-white' : 'text-[#633806]'}`}>
              Ref: {status.ref}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input required placeholder="Full Name *" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
        <input required placeholder="Phone Number *" value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input type="email" placeholder="Email Address" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
        <select value={form.productInterest} onChange={e => setForm({ ...form, productInterest: e.target.value })}
          className={inputClass}>
          <option value="">Select Product</option>
          {allProducts.map(p => <option key={p.slug} value={p.name}>{p.name}</option>)}
        </select>
      </div>
      <textarea placeholder="Tell us more about what you need..." rows={3} value={form.message}
        onChange={e => setForm({ ...form, message: e.target.value })} className={inputClass} />
      <button type="submit" disabled={loading}
        className="px-8 py-3 rounded-full font-medium text-sm transition-colors disabled:opacity-50 bg-[#633806] text-white hover:bg-[#7a4a0f]">
        {loading ? 'Submitting...' : 'Request a Quote'}
      </button>
    </form>
  );
}
