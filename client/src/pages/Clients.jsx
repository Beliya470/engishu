import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTaskModal } from '../context/TaskContext';
import api from '../lib/api';
import { Plus, Search, X, Eye, Clock, Shield } from 'lucide-react';

const emptyClient = {
  fullName: '', companyName: '', idNumber: '', kraPin: '',
  phone: '', email: '', physicalAddress: '', source: '', notes: '', status: 'ACTIVE', agentId: '',
};

function timeAgo(date) {
  if (!date) return 'Never';
  const diff = (new Date() - new Date(date)) / 1000;
  if (diff < 86400) return 'Today';
  const days = Math.floor(diff / 86400);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return new Date(date).toLocaleDateString();
}

function getRenewalInfo(policies) {
  if (!policies || policies.length === 0) return { label: 'No Cover', color: 'bg-gray-100 text-gray-500', date: null, days: null };
  const active = policies.filter(p => p.status === 'ACTIVE');
  if (active.length === 0) return { label: 'All Lapsed', color: 'bg-red-100 text-red-700', date: null, days: null };

  const now = new Date();
  let soonest = null;
  for (const p of active) {
    const rd = new Date(p.renewalDate);
    if (!soonest || rd < soonest) soonest = rd;
  }

  const days = Math.ceil((soonest - now) / 86400000);
  if (days < 0) return { label: 'Lapsed', color: 'bg-red-200 text-red-800', date: soonest, days };
  if (days <= 7) return { label: 'Expiring This Week', color: 'bg-red-100 text-red-700', date: soonest, days };
  if (days <= 30) return { label: 'Urgent', color: 'bg-orange-100 text-orange-700', date: soonest, days };
  if (days <= 60) return { label: 'Renewing Soon', color: 'bg-amber-100 text-amber-700', date: soonest, days };
  return { label: 'Active', color: 'bg-green-100 text-green-700', date: soonest, days };
}

export default function Clients() {
  const { user } = useAuth();
  const { openTaskModal } = useTaskModal();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('renewal');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyClient);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postSave, setPostSave] = useState(null); // client id after save

  const fetchClients = () => {
    const params = {};
    if (search) params.search = search;
    if (filterAgent) params.agentId = filterAgent;
    api.get('/clients', { params }).then(res => {
      // Fetch policies for each client for renewal info
      Promise.all(res.data.map(c =>
        api.get('/policies', { params: { clientId: c.id } }).then(r => ({ ...c, policies: r.data })).catch(() => ({ ...c, policies: [] }))
      )).then(enriched => setClients(enriched));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, [search, filterAgent]);
  useEffect(() => { api.get('/users').then(res => setAgents(res.data)).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editing) {
        res = await api.put(`/clients/${editing}`, form);
      } else {
        res = await api.post('/clients', form);
      }
      setShowForm(false);
      setForm(emptyClient);
      if (!editing) {
        setPostSave(res.data.id);
      }
      setEditing(null);
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving client');
    }
  };

  const openEdit = (client) => {
    setForm({
      fullName: client.fullName, companyName: client.companyName || '',
      idNumber: client.idNumber || '', kraPin: client.kraPin || '',
      phone: client.phone, email: client.email || '',
      physicalAddress: client.physicalAddress || '', source: client.source || '',
      notes: client.notes || '', status: client.status, agentId: client.agentId,
    });
    setEditing(client.id);
    setShowForm(true);
  };

  // Filtering
  const now = new Date();
  const filtered = clients.filter(c => {
    const ri = getRenewalInfo(c.policies);
    if (filter === 'exp30') return ri.days !== null && ri.days >= 0 && ri.days <= 30;
    if (filter === 'exp60') return ri.days !== null && ri.days >= 0 && ri.days <= 60;
    if (filter === 'lapsed') return ri.label === 'Lapsed' || ri.label === 'All Lapsed';
    if (filter === 'nocover') return ri.label === 'No Cover';
    if (filter === 'new') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return new Date(c.createdAt) >= start;
    }
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
    if (sortBy === 'added') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'renewal') {
      const ra = getRenewalInfo(a.policies);
      const rb = getRenewalInfo(b.policies);
      if (ra.date === null && rb.date === null) return 0;
      if (ra.date === null) return 1;
      if (rb.date === null) return -1;
      return ra.date - rb.date;
    }
    return 0;
  });

  // Summary counts
  const totalCount = clients.length;
  const activeCount = clients.filter(c => c.status === 'ACTIVE').length;
  const renew30 = clients.filter(c => { const r = getRenewalInfo(c.policies); return r.days !== null && r.days >= 0 && r.days <= 30; }).length;
  const lapsedCount = clients.filter(c => { const r = getRenewalInfo(c.policies); return r.label === 'Lapsed' || r.label === 'All Lapsed'; }).length;

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]";

  return (
    <div>
      {/* Summary strip */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: `Total: ${totalCount}`, f: 'all' },
          { label: `Active: ${activeCount}`, f: 'all' },
          { label: `Renewing in 30d: ${renew30}`, f: 'exp30' },
          { label: `Lapsed: ${lapsedCount}`, f: 'lapsed' },
        ].map(s => (
          <button key={s.label} onClick={() => setFilter(s.f)}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[#633806] font-medium hover:bg-gray-50">
            {s.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search name, phone, company..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
        </div>
        {user?.role === 'ADMIN' && (
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-[#1A1A1A]">
            <option value="">All Agents</option>
            {agents.filter(a => a.role === 'AGENT' || a.role === 'ADMIN').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-[#1A1A1A]">
          <option value="renewal">Sort: Next Renewal</option>
          <option value="name">Sort: Name A-Z</option>
          <option value="added">Sort: Date Added</option>
        </select>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyClient); }}
          className="flex items-center gap-1.5 bg-[#633806] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a2800]">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {[
          { val: 'all', label: 'All Clients' },
          { val: 'exp30', label: 'Expiring in 30 Days' },
          { val: 'exp60', label: 'Expiring in 60 Days' },
          { val: 'lapsed', label: 'Lapsed' },
          { val: 'nocover', label: 'No Cover' },
          { val: 'new', label: 'New This Month' },
        ].map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === f.val ? 'bg-[#1DB8A8] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600 hidden md:table-cell">Company</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600 hidden lg:table-cell">Agent</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600 hidden md:table-cell">Policies</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600 hidden lg:table-cell">Next Renewal</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">Renewal Status</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-8 text-gray-400">No clients found</td></tr>
            ) : sorted.map(c => {
              const ri = getRenewalInfo(c.policies);
              const activePolicies = c.policies?.filter(p => p.status === 'ACTIVE').length || 0;
              return (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <Link to={`/clients/${c.id}`} className="text-[#633806] hover:text-[#1DB8A8] font-medium">{c.fullName}</Link>
                  </td>
                  <td className="px-3 py-3 text-gray-500 hidden md:table-cell">{c.companyName || '-'}</td>
                  <td className="px-3 py-3 text-gray-500">{c.phone}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs hidden lg:table-cell">{c.assignedAgent?.name}</td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <Link to={`/clients/${c.id}`} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                      {activePolicies} {activePolicies === 1 ? 'policy' : 'policies'}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 hidden lg:table-cell">
                    {ri.date ? new Date(ri.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No policies'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ri.color}`}>{ri.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/clients/${c.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#633806]" title="View">
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => openTaskModal({ linked: { type: 'client', id: c.id, label: c.fullName } })}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1DB8A8]" title="Add Task">
                        <Clock size={15} />
                      </button>
                      <Link to={`/policies`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-600" title="Add Policy">
                        <Shield size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Post-save prompt */}
      {postSave && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="text-lg font-bold text-[#633806] mb-1">Client Added</h3>
            <p className="text-sm text-gray-500 mb-5">Would you like to add a policy or task now?</p>
            <div className="flex gap-2">
              <Link to="/policies" className="flex-1 bg-[#633806] text-white py-2.5 rounded-full text-sm font-semibold hover:bg-[#4a2800]">Add Policy</Link>
              <button onClick={() => { openTaskModal({ linked: { type: 'client', id: postSave, label: '' } }); setPostSave(null); }}
                className="flex-1 bg-[#1DB8A8] text-white py-2.5 rounded-full text-sm font-semibold hover:bg-[#28bfb3]">Add Task</button>
              <button onClick={() => setPostSave(null)} className="flex-1 border border-gray-300 py-2.5 rounded-full text-sm text-gray-600">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-[#1DB8A8] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-white font-semibold">{editing ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X size={18} className="text-white/70 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3">
              <input required placeholder="Full Name *" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Phone Number *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                <input type="email" required placeholder="Email Address *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
              <input placeholder="Company Name" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="ID Number" value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} className={inputClass} />
                <input placeholder="KRA PIN" value={form.kraPin} onChange={e => setForm({ ...form, kraPin: e.target.value })} className={inputClass} />
              </div>
              <input placeholder="Physical Address" value={form.physicalAddress} onChange={e => setForm({ ...form, physicalAddress: e.target.value })} className={inputClass} />
              {user?.role === 'ADMIN' && (
                <select value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })} className={inputClass}>
                  <option value="">Assign Agent</option>
                  {agents.filter(a => a.role === 'AGENT' || a.role === 'ADMIN').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
              <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className={inputClass}>
                <option value="">Select Source</option>
                <option value="referral">Referral</option>
                <option value="walk-in">Walk-in</option>
                <option value="website">Website</option>
                <option value="cold-call">Cold Call</option>
                <option value="client-list">Client List</option>
                <option value="other">Other</option>
              </select>
              <textarea placeholder="Notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputClass} />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#633806] text-white rounded-full text-sm font-semibold hover:bg-[#4a2800]">
                  {editing ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
