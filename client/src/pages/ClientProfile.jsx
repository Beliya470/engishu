import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTaskModal } from '../context/TaskContext';
import api from '../lib/api';
import { ArrowLeft, Shield, FolderOpen, Plus, Edit3, MessageCircle, CheckSquare, X } from 'lucide-react';

function daysRemaining(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}

function daysColor(days) {
  if (days < 0) return 'text-red-700 bg-red-100';
  if (days <= 7) return 'text-red-600 bg-red-50';
  if (days <= 30) return 'text-orange-600 bg-orange-50';
  if (days <= 60) return 'text-amber-600 bg-amber-50';
  return 'text-green-600 bg-green-50';
}

export default function ClientProfile() {
  const { id } = useParams();
  const { openTaskModal, subscribeToTaskCreated } = useTaskModal();
  const [client, setClient] = useState(null);
  const [clientTasks, setClientTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [agents, setAgents] = useState([]);

  const openEditModal = () => {
    setEditForm({
      fullName: client.fullName || '', companyName: client.companyName || '',
      idNumber: client.idNumber || '', kraPin: client.kraPin || '',
      phone: client.phone || '', email: client.email || '',
      physicalAddress: client.physicalAddress || '', source: client.source || '',
      status: client.status || 'ACTIVE', agentId: client.agentId || '',
    });
    setShowEdit(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/clients/${id}`, editForm);
      setShowEdit(false);
      fetchClient();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving');
    }
  };

  const fetchClient = () => {
    api.get(`/clients/${id}`).then(res => setClient(res.data)).catch(() => {}).finally(() => setLoading(false));
  };
  const fetchTasks = () => {
    api.get('/tasks').then(res => setClientTasks(res.data.filter(t => t.clientId === id))).catch(() => {});
  };

  useEffect(() => { fetchClient(); fetchTasks(); api.get('/users').then(r => setAgents(r.data)).catch(() => {}); }, [id]);
  useEffect(() => { return subscribeToTaskCreated(() => { fetchTasks(); fetchClient(); }); }, [subscribeToTaskCreated]);

  // Parse notes from client.notes field as a simple log
  useEffect(() => {
    if (client?.notes) {
      const lines = client.notes.split('\n').filter(l => l.trim()).map((text, i) => ({
        id: i, text, date: client.updatedAt || client.createdAt,
      }));
      setNotes(lines);
    }
  }, [client]);

  const markDone = async (taskId) => {
    await api.put(`/tasks/${taskId}`, { status: 'DONE' });
    fetchTasks();
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;
    const timestamp = new Date().toLocaleString('en-GB');
    const updatedNotes = `${client.notes || ''}\n[${timestamp}] ${newNote}`.trim();
    await api.put(`/clients/${id}`, { notes: updatedNotes });
    setNewNote('');
    fetchClient();
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!client) return <div className="text-center py-12 text-red-500">Client not found</div>;

  const handleAddTask = () => openTaskModal({ linked: { type: 'client', id: client.id, label: client.fullName } });
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const activePolicies = client.policies?.filter(p => p.status === 'ACTIVE') || [];
  const totalPremium = activePolicies.reduce((sum, p) => sum + (p.annualPremium || 0), 0);
  const nextRenewal = activePolicies.length > 0
    ? activePolicies.reduce((min, p) => !min || new Date(p.renewalDate) < new Date(min) ? p.renewalDate : min, null)
    : null;

  const whatsappLink = `https://wa.me/${client.phone?.replace(/[^0-9]/g, '')}`;

  const tabs = [
    { val: 'overview', label: 'Overview' },
    { val: 'policies', label: `Policies (${client.policies?.length || 0})` },
    { val: 'tasks', label: `Tasks (${clientTasks.length})` },
    { val: 'documents', label: `Documents (${client.documents?.length || 0})` },
    { val: 'notes', label: 'Notes' },
  ];

  return (
    <div>
      <Link to="/clients" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1DB8A8] mb-4">
        <ArrowLeft size={16} /> Back to Clients
      </Link>

      {/* ── CLIENT HEADER ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left: Info */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-full bg-[#1DB8A8] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{client.fullName?.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#633806]">{client.fullName}</h2>
              {client.companyName && <p className="text-sm text-gray-500">{client.companyName}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {client.status}
                </span>
                <button onClick={openEditModal}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#633806]"><Edit3 size={12} /> Edit</button>
                <button onClick={handleAddTask}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1DB8A8]"><Plus size={12} /> Add Task</button>
                <Link to="/policies"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600"><Shield size={12} /> Add Policy</Link>
                {client.phone && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-500"><MessageCircle size={12} /> WhatsApp</a>
                )}
              </div>
            </div>
          </div>

          {/* Right: Mini stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:w-auto w-full">
            {[
              { label: 'Total Policies', value: client.policies?.length || 0 },
              { label: 'Active Policies', value: activePolicies.length },
              { label: 'Next Renewal', value: nextRenewal ? new Date(nextRenewal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A' },
              { label: 'Premium Value', value: `KES ${totalPremium.toLocaleString()}` },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-[#633806]">{s.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 mb-5 overflow-x-auto hide-scrollbar">
        {tabs.map(t => (
          <button key={t.val} onClick={() => setTab(t.val)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.val ? 'bg-[#633806] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-[#633806] mb-4">Client Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Phone', client.phone], ['Email', client.email], ['ID Number', client.idNumber],
                ['KRA PIN', client.kraPin], ['Address', client.physicalAddress], ['Agent', client.assignedAgent?.name],
                ['Source', client.source], ['Date Added', new Date(client.dateAdded).toLocaleDateString()],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-gray-400 text-xs mb-0.5">{l}</p>
                  <p className="text-slate-700">{v || '-'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-[#633806] mb-4">Activity Timeline</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {clientTasks.filter(t => t.status === 'DONE').slice(0, 5).map(t => (
                <div key={t.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700">Task completed: {t.title}</p>
                    <p className="text-xs text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {client.policies?.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#1DB8A8] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700">Policy added: {p.policyNumber} ({p.productType})</p>
                    <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-700">Client record created</p>
                  <p className="text-xs text-gray-400">{new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── POLICIES TAB ── */}
      {tab === 'policies' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#633806]">Policies</h3>
            <Link to="/policies" className="flex items-center gap-1 text-xs bg-[#633806] text-white px-3 py-1.5 rounded-full font-semibold hover:bg-[#4a2800]">
              <Plus size={14} /> Add New Policy
            </Link>
          </div>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Policy No.</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Underwriter</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">Premium</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Renewal</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Days Left</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {(!client.policies || client.policies.length === 0) ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-400">No policies linked</td></tr>
              ) : client.policies.map(p => {
                const days = daysRemaining(p.renewalDate);
                const dc = daysColor(days);
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-[#633806]">{p.policyNumber}</td>
                    <td className="px-3 py-3 text-gray-600">{p.productType}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{p.underwriter}</td>
                    <td className="px-3 py-3 text-right text-gray-700">KES {p.annualPremium?.toLocaleString()}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{new Date(p.renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${dc}`}>
                        {days < 0 ? 'LAPSED' : `${days}d`}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TASKS TAB ── */}
      {tab === 'tasks' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#633806]">Tasks for {client.fullName}</h3>
            <button onClick={handleAddTask} className="flex items-center gap-1 text-xs text-[#1DB8A8] font-semibold hover:underline">
              <Plus size={14} /> Add Task
            </button>
          </div>
          {clientTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No tasks linked to this client</p>
          ) : (
            <div className="space-y-2">
              {clientTasks.map(t => {
                const isDone = t.status === 'DONE';
                const isOverdue = !isDone && new Date(t.dueDate) < todayStart;
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isOverdue ? '#EF4444' : isDone ? '#9CA3AF' : '#1DB8A8' }} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-slate-700'}`}>{t.title}</p>
                      <p className="text-xs text-gray-400">{t.assignedTo?.name} &middot; {t.status.replace('_', ' ')}</p>
                    </div>
                    <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                      {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                    {!isDone && (
                      <button onClick={() => markDone(t.id)} className="text-xs text-[#633806] font-medium hover:underline">Done</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {tab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-[#633806] mb-3">Documents</h3>
          {client.documents?.length > 0 ? client.documents.map(d => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
              <div>
                <span className="text-slate-700 font-medium">{d.fileName}</span>
                <span className="text-gray-400 ml-2 text-xs">{d.documentType.replace(/_/g, ' ')}</span>
              </div>
              <span className="text-xs text-gray-400">{new Date(d.uploadDate).toLocaleDateString()}</span>
            </div>
          )) : <p className="text-sm text-gray-400">No documents uploaded</p>}
        </div>
      )}

      {/* ── NOTES TAB ── */}
      {tab === 'notes' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-[#633806] mb-4">Notes</h3>
          <div className="mb-5">
            <textarea rows={3} placeholder="Add a note about this client..." value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8] mb-2" />
            <button onClick={saveNote} disabled={!newNote.trim()}
              className="bg-[#1DB8A8] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#28bfb3] disabled:opacity-50">
              Save Note
            </button>
          </div>
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-gray-400">No notes yet</p>
            ) : [...notes].reverse().map(n => (
              <div key={n.id} className="flex items-start gap-3 py-2 border-b border-gray-50">
                <div className="w-1.5 h-1.5 rounded-full bg-[#633806] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-700">{n.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-[#1DB8A8] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-white font-semibold">Edit Client</h2>
              <button onClick={() => setShowEdit(false)}><X size={18} className="text-white/70 hover:text-white" /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-3">
              <input required placeholder="Full Name *" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required placeholder="Phone *" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
                <input type="email" placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              </div>
              <input placeholder="Company Name" value={editForm.companyName} onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="ID Number" value={editForm.idNumber} onChange={e => setEditForm({ ...editForm, idNumber: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
                <input placeholder="KRA PIN" value={editForm.kraPin} onChange={e => setEditForm({ ...editForm, kraPin: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              </div>
              <input placeholder="Physical Address" value={editForm.physicalAddress} onChange={e => setEditForm({ ...editForm, physicalAddress: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              <select value={editForm.agentId} onChange={e => setEditForm({ ...editForm, agentId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]">
                <option value="">Assign Agent</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#633806] text-white rounded-full text-sm font-semibold hover:bg-[#4a2800]">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
