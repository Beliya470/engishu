import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Plus, Search, X } from 'lucide-react';

const PRODUCT_TYPES = [
  'Motor', 'Medical', 'Home', 'Travel', 'Personal Accident', 'SME Package',
  'Group Medical', 'First Afya Biashara', 'Marine', 'Goods in Transit',
  'Engineering', 'Fire', 'Liabilities', 'PI', 'PVT', 'Golfers', 'WIBA', 'Other',
];
const UNDERWRITERS = [
  'First Assurance', 'Britam', 'Jubilee', 'CIC', 'APA',
  'ICEA Lion', 'AAR', 'Madison', 'UAP', 'Other',
];
const STATUSES = ['ACTIVE', 'LAPSED', 'CANCELLED', 'PENDING'];

const emptyPolicy = {
  policyNumber: '', clientId: '', productType: '', underwriter: '',
  coverAmount: '', annualPremium: '', startDate: '', renewalDate: '',
  status: 'ACTIVE', notes: '', agentId: '',
};

export default function Policies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPolicy);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = () => {
    const params = {};
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    api.get('/policies', { params }).then(res => setPolicies(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPolicies(); }, [search, filterStatus]);
  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
    api.get('/users').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/policies/${editing}`, form);
      } else {
        await api.post('/policies', form);
      }
      setShowForm(false);
      setForm(emptyPolicy);
      setEditing(null);
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving policy');
    }
  };

  const openEdit = (p) => {
    setForm({
      policyNumber: p.policyNumber, clientId: p.clientId, productType: p.productType,
      underwriter: p.underwriter, coverAmount: p.coverAmount, annualPremium: p.annualPremium,
      startDate: p.startDate.split('T')[0], renewalDate: p.renewalDate.split('T')[0],
      status: p.status, notes: p.notes || '', agentId: p.agentId,
    });
    setEditing(p.id);
    setShowForm(true);
  };

  const getDaysUntilRenewal = (date) => {
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search policy number, client..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyPolicy); }}
          className="flex items-center gap-1.5 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600">
          <Plus size={16} /> Add Policy
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Policy #</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Product</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Underwriter</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Premium</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Renewal</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : policies.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-8 text-slate-400">No policies found</td></tr>
            ) : policies.map(p => {
              const days = getDaysUntilRenewal(p.renewalDate);
              const renewalClass = days <= 7 ? 'text-red-600 font-medium' : days <= 30 ? 'text-amber-600 font-medium' : 'text-slate-500';
              return (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.policyNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{p.client?.fullName}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{p.productType}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{p.underwriter}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">KES {p.annualPremium?.toLocaleString()}</td>
                  <td className={`px-4 py-3 ${renewalClass}`}>
                    {new Date(p.renewalDate).toLocaleDateString()}
                    {days > 0 && days <= 30 && <span className="ml-1 text-xs">({days}d)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(p)} className="text-teal-600 text-sm hover:underline">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">{editing ? 'Edit Policy' : 'Add New Policy'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Policy Number *" value={form.policyNumber} onChange={e => setForm({ ...form, policyNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Select Client *</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName} {c.companyName ? `(${c.companyName})` : ''}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select required value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">Product Type *</option>
                  {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select required value={form.underwriter} onChange={e => setForm({ ...form, underwriter: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">Underwriter *</option>
                  {UNDERWRITERS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder="Cover Amount (KES) *" value={form.coverAmount}
                  onChange={e => setForm({ ...form, coverAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                <input type="number" required placeholder="Annual Premium (KES) *" value={form.annualPremium}
                  onChange={e => setForm({ ...form, annualPremium: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Start Date *</label>
                  <input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Renewal Date *</label>
                  <input type="date" required value={form.renewalDate} onChange={e => setForm({ ...form, renewalDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {user?.role === 'ADMIN' && (
                <select value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">Assign Agent</option>
                  {agents.filter(a => a.role === 'AGENT' || a.role === 'ADMIN').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
              <textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600">
                  {editing ? 'Save Changes' : 'Add Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
