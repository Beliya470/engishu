import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const TASK_TYPES = [
  'Follow-up Call', 'Send Documents', 'Renewal Reminder',
  'Quote Follow-up', 'Client Meeting', 'Payment Follow-up', 'General',
];

export default function TaskModal({ open, onClose, onCreated, prefill }) {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({
    title: '', taskType: 'General', assigneeId: '', priority: 'MEDIUM',
    dueDate: '', dueTime: '', notes: '',
  });
  const [linkedRecord, setLinkedRecord] = useState(null); // { type, id, label }
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (open) {
      api.get('/users').then(res => setAgents(res.data)).catch(() => {});
      setForm(f => ({
        ...f,
        title: prefill?.title || '',
        taskType: prefill?.taskType || 'General',
        assigneeId: user?.id || '',
        dueDate: prefill?.dueDate || '',
      }));
      if (prefill?.linked) {
        setLinkedRecord(prefill.linked);
      } else {
        setLinkedRecord(null);
      }
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, prefill, user]);

  // Click outside to close search
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  // Search across clients, leads, policies
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const [clients, leads, policies] = await Promise.all([
          api.get('/clients', { params: { search: searchQuery } }),
          api.get('/leads', { params: { search: searchQuery } }),
          api.get('/policies', { params: { search: searchQuery } }),
        ]);
        const results = [
          ...clients.data.slice(0, 5).map(c => ({
            type: 'client', id: c.id, label: c.fullName, sub: c.companyName || 'Individual',
          })),
          ...leads.data.slice(0, 5).map(l => ({
            type: 'lead', id: l.id, label: l.name, sub: l.company || '',
          })),
          ...policies.data.slice(0, 5).map(p => ({
            type: 'policy', id: p.id, label: p.policyNumber, sub: p.client?.fullName || '',
          })),
        ];
        setSearchResults(results);
        setSearchOpen(true);
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) return;
    setLoading(true);
    try {
      const data = {
        title: `[${form.taskType}] ${form.title}`,
        description: form.notes || undefined,
        assigneeId: form.assigneeId || user.id,
        dueDate: form.dueTime ? `${form.dueDate}T${form.dueTime}` : form.dueDate,
        priority: form.priority,
        status: 'PENDING',
      };
      // Link to client directly, or look up client from lead/policy
      if (linkedRecord?.type === 'client') {
        data.clientId = linkedRecord.id;
      } else if (linkedRecord?.type === 'lead') {
        // Add lead info to description since tasks only link to clients
        data.description = `${data.description || ''}\nLinked lead: ${linkedRecord.label} (${linkedRecord.id})`.trim();
      } else if (linkedRecord?.type === 'policy') {
        // Look up client from policy and link that
        try {
          const policyRes = await api.get(`/policies/${linkedRecord.id}`);
          if (policyRes.data?.clientId) data.clientId = policyRes.data.clientId;
        } catch {}
        data.description = `${data.description || ''}\nLinked policy: ${linkedRecord.label}`.trim();
      }
      await api.post('/tasks', data);
      onCreated?.();
      onClose();
      setForm({ title: '', taskType: 'General', assigneeId: user?.id || '', priority: 'MEDIUM', dueDate: '', dueTime: '', notes: '' });
      setLinkedRecord(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const priorityOptions = [
    { val: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-600', active: 'bg-gray-500 text-white' },
    { val: 'MEDIUM', label: 'Medium', color: 'bg-gray-100 text-gray-600', active: 'bg-[#1DB8A8] text-white' },
    { val: 'HIGH', label: 'High', color: 'bg-gray-100 text-gray-600', active: 'bg-[#633806] text-white' },
  ];

  const typeBadgeColor = { client: 'bg-[#1DB8A8] text-white', lead: 'bg-[#633806] text-white', policy: 'bg-gray-500 text-white' };

  const isLocked = !!prefill?.linked;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-[#1DB8A8] px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">New Task</h2>
          <button onClick={onClose}><X size={20} className="text-white/80 hover:text-white" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Task Title *</label>
            <input required placeholder="e.g. Call James about motor quote" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
          </div>

          {/* Type + Assigned To */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Task Type *</label>
              <select value={form.taskType} onChange={e => setForm({ ...form, taskType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]">
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Assigned To</label>
              <select value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}
                disabled={user?.role !== 'ADMIN'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8] disabled:opacity-60">
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} {a.role === 'ADMIN' ? '(Admin)' : ''}</option>)}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Priority</label>
            <div className="flex gap-2">
              {priorityOptions.map(p => (
                <button key={p.val} type="button" onClick={() => setForm({ ...form, priority: p.val })}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${form.priority === p.val ? p.active : p.color}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Due Date *</label>
              <input type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Due Time</label>
              <input type="time" value={form.dueTime} onChange={e => setForm({ ...form, dueTime: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
            </div>
          </div>

          {/* Linked Record */}
          <div>
            <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Link to Client, Lead or Policy</label>
            {linkedRecord ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${typeBadgeColor[linkedRecord.type]}`}>
                  {linkedRecord.type}
                </span>
                <span className="text-sm text-[#1A1A1A] flex-1">{linkedRecord.label}</span>
                {!isLocked && (
                  <button type="button" onClick={() => setLinkedRecord(null)}>
                    <X size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
                )}
              </div>
            ) : (
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input placeholder="Search clients, leads, policies..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
                </div>
                {searchOpen && searchResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
                    {searchResults.map(r => (
                      <li key={`${r.type}-${r.id}`}
                        onClick={() => { setLinkedRecord(r); setSearchQuery(''); setSearchOpen(false); }}
                        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer text-sm hover:bg-[#1DB8A8] hover:text-white transition-colors">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${typeBadgeColor[r.type]}`}>
                          {r.type}
                        </span>
                        <span>{r.label}</span>
                        {r.sub && <span className="text-xs opacity-60">{r.sub}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea placeholder="Any additional details..." rows={3} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 rounded-full bg-[#633806] text-white text-sm font-semibold hover:bg-[#4a2800] disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
