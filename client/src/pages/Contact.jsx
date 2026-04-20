import { useState } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import api from '../lib/api';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/public/contact', form);
      setStatus({ type: 'success', text: res.data.message, ref: res.data.refNumber });
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#633806] mb-4">Get in Touch</h1>
          <p className="text-lg text-[#6B7280]">We'd love to hear from you. Reach out and let's protect what matters to you.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <h2 className="text-xl font-semibold text-[#633806] mb-6">Send us a message</h2>
            {status && (
              <div className={`px-4 py-4 rounded-xl text-sm mb-4 ${
                status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <p>{status.text}</p>
                {status.ref && <p className="mt-2 font-bold text-lg text-[#633806]">Ref: {status.ref}</p>}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Your Name *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="email" placeholder="Email Address" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
                <input placeholder="Phone Number" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              </div>
              <textarea required placeholder="Your Message *" rows={5} value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              <button type="submit" disabled={loading}
                className="bg-[#1DB8A8] text-white px-8 py-3 rounded-full font-medium text-sm hover:bg-[#28bfb3] transition-colors disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#1DB8A8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-[#1DB8A8]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#633806] mb-1">Office Address</h3>
                    <p className="text-sm text-[#6B7280]">1st Floor, CPA Center (Block A)<br />Thika Road, Nairobi, Kenya</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#1DB8A8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={20} className="text-[#1DB8A8]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#633806] mb-1">Phone</h3>
                    <p className="text-sm text-[#6B7280]">+254 759 840614</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#1DB8A8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-[#1DB8A8]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#633806] mb-1">Email</h3>
                    <p className="text-sm text-[#6B7280]">cover@engishu.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a href="https://wa.me/254759840614" target="_blank" rel="noopener noreferrer"
              className="block bg-green-500 text-white rounded-xl p-6 text-center hover:bg-green-600 transition-colors">
              <p className="text-lg font-semibold mb-1">Chat with us on WhatsApp</p>
              <p className="text-sm text-white/80">Quick responses, Monday to Friday, 8am - 5pm</p>
            </a>

            {/* Map Placeholder */}
            <div className="bg-slate-100 rounded-xl h-48 flex items-center justify-center border border-slate-200">
              <div className="text-center text-slate-400">
                <MapPin size={32} className="mx-auto mb-2" />
                <p className="text-sm">CPA Center, Thika Road, Nairobi</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
