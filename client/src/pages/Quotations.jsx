import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Plus, X } from 'lucide-react';

const STATUSES = ['PENDING', 'SENT_TO_UNDERWRITER', 'QUOTE_RECEIVED', 'APPROVED', 'REJECTED'];
const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SENT_TO_UNDERWRITER: 'bg-blue-100 text-blue-700',
  QUOTE_RECEIVED: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};
const PRODUCT_TYPES = [
  'Motor', 'Medical', 'Home', 'Travel', 'Personal Accident', 'SME Package',
  'Group Medical', 'First Afya Biashara', 'Marine', 'Goods in Transit',
  'Engineering', 'Fire', 'Liabilities', 'PI', 'PVT', 'Golfers', 'WIBA', 'Other',
];

const emptyQuotation = {
  clientName: '', clientId: '', productType: '', underwriterPreference: '',
  coverDetails: '', status: 'PENDING', agentId: '',
};

export default function Quotations() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyQuotation);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    api.get('/quotations').then(res => setQuotations(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);
  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
    api.get('/users').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/quotations/${editing}`, form);
      } else {
        await api.post('/quotations', form);
      }
      setShowForm(false);
      setForm(emptyQuotation);
      setEditing(null);
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving quotation');
    }
  };

  const openEdit = (q) => {
    setForm({
      clientName: q.clientName, clientId: q.clientId || '', productType: q.productType,
      underwriterPreference: q.underwriterPreference || '', coverDetails: q.coverDetails || '',
      status: q.status, agentId: q.agentId,
    });
    setEditing(q.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-slate-500 text-sm">{quotations.length} quotation{quotations.length !== 1 ? 's' : ''}</p>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyQuotation); }}
          className="flex items-center gap-1.5 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600">
          <Plus size={16} /> New Quote Request
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Underwriter Pref.</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Requested By</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : quotations.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-slate-400">No quotations yet</td></tr>
            ) : quotations.map(q => (
              <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{q.clientName}</td>
                <td className="px-4 py-3 text-slate-500">{q.productType}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{q.underwriterPreference || '-'}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{q.requestedBy?.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status]}`}>
                    {q.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(q.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(q)} className="text-teal-600 text-sm hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">{editing ? 'Edit Quotation' : 'New Quote Request'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Client / Lead Name *" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Link to Client (optional)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
              <select required value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Product Type *</option>
                {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input placeholder="Underwriter Preference" value={form.underwriterPreference}
                onChange={e => setForm({ ...form, underwriterPreference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <textarea placeholder="Cover Details / Notes" rows={3} value={form.coverDetails}
                onChange={e => setForm({ ...form, coverDetails: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              {editing && (
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600">
                  {editing ? 'Save Changes' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
