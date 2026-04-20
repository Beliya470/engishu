import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTaskModal } from '../context/TaskContext';
import api from '../lib/api';
import { Plus, Search, X, List, Columns, GripVertical } from 'lucide-react';

const STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'FOLLOW_UP', 'CONVERTED', 'LOST'];
const STATUS_COLORS = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  QUOTED: 'bg-purple-100 text-purple-700',
  FOLLOW_UP: 'bg-orange-100 text-orange-700',
  CONVERTED: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
};
const STATUS_LABELS = {
  NEW: 'New', CONTACTED: 'Contacted', QUOTED: 'Quoted',
  FOLLOW_UP: 'Follow-up', CONVERTED: 'Converted', LOST: 'Lost',
};
const SOURCES = ['REFERRAL', 'WALK_IN', 'COLD_CALL', 'CLIENT_LIST', 'WEBSITE'];

const emptyLead = {
  name: '', phone: '', company: '', email: '', productInterest: '',
  source: 'WALK_IN', status: 'NEW', followUpDate: '', notes: '', agentId: '',
};

export default function Leads() {
  const { user } = useAuth();
  const { openTaskModal } = useTaskModal();
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('kanban');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyLead);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState(null); // full lead object for display

  // Drag-and-drop state
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Status change modal state
  const [statusModal, setStatusModal] = useState(null); // { lead, newStatus }
  const [statusNotes, setStatusNotes] = useState('');
  const [statusFollowUp, setStatusFollowUp] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const fetchLeads = () => {
    const params = {};
    if (search) params.search = search;
    api.get('/leads', { params }).then(res => setLeads(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [search]);
  useEffect(() => { api.get('/users').then(res => setAgents(res.data)).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/leads/${editing}`, form);
      } else {
        await api.post('/leads', form);
      }
      setShowForm(false);
      setForm(emptyLead);
      setEditing(null);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving lead');
    }
  };

  const convertLead = async (leadId) => {
    if (!confirm('Convert this lead to a client?')) return;
    try {
      const res = await api.post(`/leads/${leadId}/convert`);
      alert(`Client "${res.data.client.fullName}" created!`);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.error || 'Error converting lead');
    }
  };

  const deleteLead = async (leadId) => {
    if (!confirm('Delete this lead permanently?')) return;
    try {
      await api.delete(`/leads/${leadId}`);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting lead');
    }
  };

  const openEdit = (lead) => {
    setForm({
      name: lead.name, phone: lead.phone || '', company: lead.company || '',
      email: lead.email || '', productInterest: lead.productInterest || '',
      source: lead.source, status: lead.status,
      followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
      notes: lead.notes || '', agentId: lead.agentId,
    });
    setEditing(lead.id);
    setEditingData(lead);
    setShowForm(true);
  };

  // Drag handlers
  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }
    // Open the status change modal
    setStatusModal({ lead: draggedLead, newStatus });
    setStatusNotes('');
    setStatusFollowUp('');
    setDraggedLead(null);
  };

  const handleStatusChange = async () => {
    if (!statusModal) return;
    setStatusSaving(true);
    try {
      const data = { status: statusModal.newStatus };
      if (statusNotes.trim()) data.notes = `${statusModal.lead.notes || ''}\n[${STATUS_LABELS[statusModal.newStatus]}] ${statusNotes}`.trim();
      if (statusFollowUp) data.followUpDate = statusFollowUp;

      await api.put(`/leads/${statusModal.lead.id}`, data);

      // If moved to CONVERTED, offer to convert
      if (statusModal.newStatus === 'CONVERTED') {
        if (confirm(`Lead moved to Converted. Create a Client record for "${statusModal.lead.name}"?`)) {
          await api.post(`/leads/${statusModal.lead.id}/convert`);
        }
      }

      setStatusModal(null);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating lead');
    } finally {
      setStatusSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]";

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
        </div>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button onClick={() => setView('kanban')}
            className={`px-3 py-2 text-sm ${view === 'kanban' ? 'bg-[#633806] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Columns size={16} />
          </button>
          <button onClick={() => setView('list')}
            className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-[#633806] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <List size={16} />
          </button>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyLead); }}
          className="flex items-center gap-1.5 bg-[#633806] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a2800]">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Kanban View with Drag & Drop */}
      {view === 'kanban' && (
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 -mx-1 px-1">
          {STATUSES.map(status => {
            const col = leads.filter(l => l.status === status);
            const isOver = dragOverCol === status;
            return (
              <div
                key={status}
                className={`flex-shrink-0 w-44 md:flex-1 md:w-auto rounded-xl p-2 transition-colors ${isOver ? 'bg-[#1DB8A8]/10 ring-2 ring-[#1DB8A8]/30' : 'bg-gray-50'}`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                  <span className="text-[10px] text-gray-400">{col.length}</span>
                </div>
                <div className="space-y-1.5 min-h-[80px]">
                  {col.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={() => setDraggedLead(null)}
                      className={`bg-white rounded-lg border border-gray-200 p-2 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow ${
                        draggedLead?.id === lead.id ? 'opacity-40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical size={12} className="text-gray-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0" onClick={() => openEdit(lead)}>
                          <p className="text-xs font-semibold text-[#633806] truncate">{lead.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{lead.company || 'No company'}</p>
                          <p className="text-[10px] text-gray-500 truncate">{lead.productInterest || '-'}</p>
                          {lead.followUpDate && (
                            <p className="text-[10px] text-orange-500">F/U: {new Date(lead.followUpDate).toLocaleDateString()}</p>
                          )}
                          {lead.source === 'WEBSITE' && (
                            <span className="inline-block mt-0.5 text-[9px] px-1 py-0.5 rounded-full bg-[#1DB8A8]/10 text-[#1DB8A8] font-medium">Web</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 pl-4">
                        <button onClick={(e) => { e.stopPropagation(); openTaskModal({ title: `Follow up: ${lead.name}`, taskType: 'Follow-up Call', linked: { type: 'lead', id: lead.id, label: lead.name, sub: lead.company } }); }}
                          className="text-[9px] text-[#1DB8A8] hover:underline">+ Task</button>
                        {(status === 'QUOTED' || status === 'FOLLOW_UP') && (
                          <button onClick={(e) => { e.stopPropagation(); convertLead(lead.id); }}
                            className="text-[9px] text-green-600 hover:underline">Convert</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                          className="text-[9px] text-red-500 hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">No leads found</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#633806]">{l.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{l.company || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{l.productInterest || '-'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {l.source === 'WEBSITE' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#1DB8A8]/10 text-[#1DB8A8] font-medium">Website</span>}
                    {l.source !== 'WEBSITE' && <span className="text-xs text-gray-400">{l.source?.replace('_', ' ')}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[l.status]}`}>{STATUS_LABELS[l.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(l)} className="text-[#1DB8A8] text-sm hover:underline">Edit</button>
                      <button onClick={() => openTaskModal({ title: `Follow up: ${l.name}`, taskType: 'Follow-up Call', linked: { type: 'lead', id: l.id, label: l.name, sub: l.company } })}
                        className="text-[#633806] text-sm hover:underline">+ Task</button>
                      {l.status !== 'CONVERTED' && l.status !== 'LOST' && (
                        <button onClick={() => convertLead(l.id)} className="text-green-600 text-sm hover:underline">Convert</button>
                      )}
                      <button onClick={() => deleteLead(l.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Change Modal (on drag-and-drop) */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#633806] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Move Lead</h2>
              <button onClick={() => setStatusModal(null)}><X size={18} className="text-white/70 hover:text-white" /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm text-gray-600">Moving <strong className="text-[#633806]">{statusModal.lead.name}</strong> from</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[statusModal.lead.status]}`}>{STATUS_LABELS[statusModal.lead.status]}</span>
                <span className="text-gray-400">to</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[statusModal.newStatus]}`}>{STATUS_LABELS[statusModal.newStatus]}</span>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Notes for this update</label>
                <textarea rows={3} placeholder="e.g. Spoke with client, sending quote tomorrow..." value={statusNotes}
                  onChange={e => setStatusNotes(e.target.value)} className={inputClass} />
              </div>

              {/* Follow-up date (show for relevant statuses) */}
              {(statusModal.newStatus === 'CONTACTED' || statusModal.newStatus === 'QUOTED' || statusModal.newStatus === 'FOLLOW_UP') && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Follow-up Date</label>
                  <input type="date" value={statusFollowUp} onChange={e => setStatusFollowUp(e.target.value)} className={inputClass} />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setStatusModal(null)} className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleStatusChange} disabled={statusSaving}
                  className="px-5 py-2 bg-[#633806] text-white rounded-full text-sm font-semibold hover:bg-[#4a2800] disabled:opacity-50">
                  {statusSaving ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Lead Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-[#1DB8A8] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-white font-semibold">{editing ? 'Edit Lead' : 'Add New Lead'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); setEditingData(null); }}><X size={18} className="text-white/70 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3">
              {editing && editingData && (
                <div className="flex flex-wrap gap-3 pb-3 border-b border-gray-100 text-xs text-gray-500">
                  <span>
                    <span className="font-semibold text-gray-600">Received: </span>
                    {new Date(editingData.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {editingData.refNumber && (
                    <span>
                      <span className="font-semibold text-gray-600">Ref: </span>
                      {editingData.refNumber}
                    </span>
                  )}
                </div>
              )}
              <input required placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
              <input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputClass} />
              <input placeholder="Product Interest" value={form.productInterest} onChange={e => setForm({ ...form, productInterest: e.target.value })} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className={inputClass}>
                  {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <input type="date" placeholder="Follow-up Date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} className={inputClass} />
              {user?.role === 'ADMIN' && (
                <select value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })} className={inputClass}>
                  <option value="">Assign Agent</option>
                  {agents.filter(a => a.role === 'AGENT' || a.role === 'ADMIN').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
              <textarea placeholder="Notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputClass} />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); setEditingData(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#633806] text-white rounded-full text-sm font-semibold hover:bg-[#4a2800]">
                  {editing ? 'Save Changes' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
