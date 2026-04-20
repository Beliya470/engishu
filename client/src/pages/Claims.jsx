import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Plus, X, Search } from 'lucide-react';

const CLAIM_TYPES = ['Accident', 'Theft', 'Fire', 'Medical', 'Death', 'Disability', 'Property Damage', 'Third Party', 'Other'];
const STATUSES = ['REPORTED', 'UNDER_REVIEW', 'APPROVED', 'SETTLED', 'REJECTED', 'CLOSED'];
const STATUS_COLORS = {
  REPORTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  SETTLED: 'bg-[#1DB8A8]/10 text-[#1DB8A8]',
  REJECTED: 'bg-red-100 text-red-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

function ksh(n) { return 'KES ' + Math.round(n).toLocaleString(); }

export default function Claims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ policyId: '', clientId: '', claimType: '', description: '', incidentDate: '', amountClaimed: '', notes: '' });
  const [editClaim, setEditClaim] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchClaims = () => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    api.get('/claims', { params }).then(res => setClaims(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchClaims(); }, [filterStatus]);
  useEffect(() => {
    api.get('/policies').then(res => setPolicies(res.data)).catch(() => {});
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
    api.get('/users').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/claims', form);
      setShowForm(false);
      setForm({ policyId: '', clientId: '', claimType: '', description: '', incidentDate: '', amountClaimed: '', notes: '' });
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating claim');
    }
  };

  const openEdit = (c) => {
    setEditForm({ status: c.status, amountSettled: c.amountSettled || '', notes: c.notes || '', handlerId: c.handlerId });
    setEditClaim(c);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/claims/${editClaim.id}`, editForm);
      setEditClaim(null);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating claim');
    }
  };

  // When client selected, filter policies to that client
  const handleClientChange = (clientId) => {
    setForm({ ...form, clientId, policyId: '' });
  };

  // Policies filtered to selected client
  const clientPolicies = form.clientId
    ? policies.filter(p => p.clientId === form.clientId)
    : policies;

  const filtered = claims.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.claimNumber?.toLowerCase().includes(q) || c.client?.fullName?.toLowerCase().includes(q) || c.claimType?.toLowerCase().includes(q);
  });

  // Summary counts
  const reported = claims.filter(c => c.status === 'REPORTED').length;
  const underReview = claims.filter(c => c.status === 'UNDER_REVIEW').length;
  const settled = claims.filter(c => c.status === 'SETTLED').length;
  const totalSettled = claims.reduce((s, c) => s + (c.amountSettled || 0), 0);

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]";
  const labelClass = "block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide";

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'REPORTED', value: reported, border: '#3b82f6' },
          { label: 'UNDER REVIEW', value: underReview, border: '#F59E0B' },
          { label: 'SETTLED', value: settled, border: '#1DB8A8' },
          { label: 'TOTAL SETTLED', value: ksh(totalSettled), border: '#633806' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-r-xl p-4"
            style={{ borderLeft: `4px solid ${s.border}`, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
            <p className="text-xs font-semibold tracking-wider text-[#9CA3AF] mb-1">{s.label}</p>
            <p className="text-2xl font-extrabold text-[#633806]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search claim number, client, type..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-[#1A1A1A]">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-[#633806] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a2800]">
          <Plus size={16} /> New Claim
        </button>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Claim #</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600 hidden md:table-cell">Policy</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">Type</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600 hidden md:table-cell">Claimed</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600 hidden lg:table-cell">Settled</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-8 text-gray-400">No claims found</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-[#633806]">{c.claimNumber}</td>
                <td className="px-3 py-3 text-gray-600">{c.client?.fullName}</td>
                <td className="px-3 py-3 text-gray-500 text-xs hidden md:table-cell">{c.policy?.policyNumber} ({c.policy?.productType})</td>
                <td className="px-3 py-3 text-gray-600">{c.claimType}</td>
                <td className="px-3 py-3 text-right text-gray-700 hidden md:table-cell">{ksh(c.amountClaimed)}</td>
                <td className="px-3 py-3 text-right text-[#1DB8A8] font-medium hidden lg:table-cell">{c.amountSettled > 0 ? ksh(c.amountSettled) : '-'}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.status]}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-gray-400 hidden md:table-cell">{new Date(c.incidentDate).toLocaleDateString()}</td>
                <td className="px-3 py-3">
                  <button onClick={() => openEdit(c)} className="text-[#1DB8A8] text-sm hover:underline">Update</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Claim Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-[#1DB8A8] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-white font-semibold">New Claim</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-white/70 hover:text-white" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-3">
              <div>
                <label className={labelClass}>Client *</label>
                <select required value={form.clientId} onChange={e => handleClientChange(e.target.value)} className={inputClass}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.fullName} {c.companyName ? `(${c.companyName})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Policy *</label>
                <select required value={form.policyId} onChange={e => setForm({ ...form, policyId: e.target.value })} className={inputClass}>
                  <option value="">{form.clientId ? (clientPolicies.length > 0 ? 'Select policy' : 'No policies for this client') : 'Select client first'}</option>
                  {clientPolicies.map(p => <option key={p.id} value={p.id}>{p.policyNumber} ({p.productType} - {p.underwriter})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Claim Type *</label>
                  <select required value={form.claimType} onChange={e => setForm({ ...form, claimType: e.target.value })} className={inputClass}>
                    <option value="">Select type</option>
                    {CLAIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Incident Date *</label>
                  <input type="date" required value={form.incidentDate} onChange={e => setForm({ ...form, incidentDate: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea required rows={3} placeholder="Describe the incident..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Amount Claimed (KES)</label>
                <input type="number" placeholder="e.g. 500000" value={form.amountClaimed}
                  onChange={e => setForm({ ...form, amountClaimed: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea rows={2} placeholder="Internal notes..." value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} className={inputClass} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#633806] text-white rounded-full text-sm font-semibold hover:bg-[#4a2800]">Create Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Claim Modal */}
      {editClaim && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-[#633806] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-white font-semibold">Update Claim {editClaim.claimNumber}</h2>
              <button onClick={() => setEditClaim(null)}><X size={18} className="text-white/70 hover:text-white" /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-3">
              <div>
                <label className={labelClass}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className={inputClass}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Amount Settled (KES)</label>
                <input type="number" value={editForm.amountSettled} onChange={e => setEditForm({ ...editForm, amountSettled: e.target.value })}
                  className={inputClass} placeholder="0" />
              </div>
              {user?.role === 'ADMIN' && (
                <div>
                  <label className={labelClass}>Assigned Handler</label>
                  <select value={editForm.handlerId} onChange={e => setEditForm({ ...editForm, handlerId: e.target.value })} className={inputClass}>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>Notes</label>
                <textarea rows={3} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className={inputClass} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditClaim(null)} className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#633806] text-white rounded-full text-sm font-semibold hover:bg-[#4a2800]">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
