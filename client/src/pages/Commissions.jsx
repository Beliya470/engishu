import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Plus, X } from 'lucide-react';

const emptyCommission = {
  policyId: '', clientId: '', underwriter: '', premium: '', commissionRate: '', notes: '',
};

export default function Commissions() {
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCommission);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    api.get('/commissions').then(res => setCommissions(res.data)).catch(() => {}).finally(() => setLoading(false));
    api.get('/commissions/summary').then(res => setSummary(res.data)).catch(() => {});
  };

  useEffect(() => { fetch(); }, []);
  useEffect(() => {
    api.get('/policies').then(res => setPolicies(res.data)).catch(() => {});
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/commissions/${editing}`, form);
      } else {
        await api.post('/commissions', form);
      }
      setShowForm(false);
      setForm(emptyCommission);
      setEditing(null);
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving commission');
    }
  };

  const openEdit = (c) => {
    setForm({
      policyId: c.policyId, clientId: c.clientId, underwriter: c.underwriter,
      premium: c.premium, commissionRate: c.commissionRate, notes: c.notes || '',
      status: c.status, paymentDate: c.paymentDate ? c.paymentDate.split('T')[0] : '',
    });
    setEditing(c.id);
    setShowForm(true);
  };

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">This Month</p>
            <p className="text-2xl font-semibold text-slate-800">KES {summary.thisMonth?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">This Quarter</p>
            <p className="text-2xl font-semibold text-slate-800">KES {summary.thisQuarter?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">This Year</p>
            <p className="text-2xl font-semibold text-slate-800">KES {summary.thisYear?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Agent Breakdown */}
      {summary?.agentBreakdown?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-3">Per-Agent Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-600">Agent</th>
                <th className="text-right py-2 font-medium text-slate-600">Policies</th>
                <th className="text-right py-2 font-medium text-slate-600">Total Commission</th>
              </tr>
            </thead>
            <tbody>
              {summary.agentBreakdown.map(a => (
                <tr key={a.agentId} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{a.agentName}</td>
                  <td className="py-2 text-right text-slate-500">{a.count}</td>
                  <td className="py-2 text-right text-slate-800 font-medium">KES {a.total?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Commission Records */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Commission Records</h3>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyCommission); }}
          className="flex items-center gap-1.5 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600">
          <Plus size={16} /> Add Commission
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Policy</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Underwriter</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Premium</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Rate</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Commission</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : commissions.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-8 text-slate-400">No commissions recorded</td></tr>
            ) : commissions.map(c => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{c.policy?.policyNumber}</td>
                <td className="px-4 py-3 text-slate-500">{c.client?.fullName}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{c.underwriter}</td>
                <td className="px-4 py-3 text-right text-slate-600">KES {c.premium?.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-slate-500">{c.commissionRate}%</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">KES {c.commissionAmount?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(c)} className="text-teal-600 text-sm hover:underline">Edit</button>
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
              <h2 className="text-lg font-semibold text-slate-800">{editing ? 'Edit Commission' : 'Add Commission'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select required value={form.policyId} onChange={e => setForm({ ...form, policyId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Select Policy *</option>
                {policies.map(p => <option key={p.id} value={p.id}>{p.policyNumber} - {p.client?.fullName}</option>)}
              </select>
              <select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Select Client *</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
              <input required placeholder="Underwriter *" value={form.underwriter} onChange={e => setForm({ ...form, underwriter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder="Premium (KES) *" value={form.premium}
                  onChange={e => setForm({ ...form, premium: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                <input type="number" step="0.01" required placeholder="Rate (%) *" value={form.commissionRate}
                  onChange={e => setForm({ ...form, commissionRate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              {form.premium && form.commissionRate && (
                <p className="text-sm text-teal-600 font-medium">
                  Commission: KES {((parseFloat(form.premium) * parseFloat(form.commissionRate)) / 100).toLocaleString()}
                </p>
              )}
              {editing && (
                <>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                  {form.status === 'PAID' && (
                    <input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Payment Date" />
                  )}
                </>
              )}
              <textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600">
                  {editing ? 'Save Changes' : 'Add Commission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
