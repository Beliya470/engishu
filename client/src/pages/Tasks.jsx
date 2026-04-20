import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTaskModal } from '../context/TaskContext';
import api from '../lib/api';
import { Plus, List, Columns, Search, Check, X, Pencil } from 'lucide-react';

const PRIORITY_COLORS = { HIGH: 'bg-[#633806]/10 text-[#633806]', MEDIUM: 'bg-[#1DB8A8]/10 text-[#1DB8A8]', LOW: 'bg-gray-100 text-gray-500' };
const STATUS_COLORS = { PENDING: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-blue-100 text-blue-700', DONE: 'bg-green-100 text-green-700' };

export default function Tasks() {
  const { user } = useAuth();
  const { openTaskModal, subscribeToTaskCreated } = useTaskModal();
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('list');
  const [filter, setFilter] = useState('all');
  const [filterAgent, setFilterAgent] = useState('');
  const [search, setSearch] = useState('');
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (t) => {
    setEditForm({
      title: t.title, description: t.description || '',
      assigneeId: t.assigneeId, priority: t.priority,
      status: t.status, dueDate: t.dueDate?.split('T')[0] || '',
    });
    setEditTask(t);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await api.put(`/tasks/${editTask.id}`, editForm);
      setEditTask(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving task');
    } finally {
      setEditSaving(false);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.put(`/tasks/${id}`, { status: 'DONE', title: editTask?.title || '' });
      setEditTask(null);
      fetchTasks();
    } catch {}
  };

  const fetchTasks = () => {
    api.get('/tasks').then(res => setTasks(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => { return subscribeToTaskCreated(fetchTasks); }, [subscribeToTaskCreated]);
  useEffect(() => { api.get('/users').then(res => setAgents(res.data)).catch(() => {}); }, []);

  const cycleStatus = async (id, current) => {
    const next = current === 'PENDING' ? 'IN_PROGRESS' : current === 'IN_PROGRESS' ? 'DONE' : 'PENDING';
    await api.put(`/tasks/${id}`, { status: next });
    fetchTasks();
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAgent && t.assigneeId !== filterAgent) return false;
    if (filter === 'my') return t.assigneeId === user?.id;
    if (filter === 'overdue') return t.status !== 'DONE' && new Date(t.dueDate) < todayStart;
    if (filter === 'today') return t.status !== 'DONE' && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) < todayEnd;
    return true;
  }).sort((a, b) => {
    if (a.status === 'DONE' && b.status !== 'DONE') return 1;
    if (a.status !== 'DONE' && b.status === 'DONE') return -1;
    const aOverdue = a.status !== 'DONE' && new Date(a.dueDate) < todayStart;
    const bOverdue = b.status !== 'DONE' && new Date(b.dueDate) < todayStart;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const getRowBorder = (t) => {
    if (t.status === 'DONE') return 'transparent';
    const due = new Date(t.dueDate);
    if (due < todayStart) return '#EF4444';
    if (due >= todayStart && due < todayEnd) return '#F59E0B';
    return '#1DB8A8';
  };

  const getLinkedChip = (t) => {
    if (t.relatedClient) return (
      <Link to={`/clients/${t.relatedClient.id}`} className="text-xs px-2 py-0.5 rounded-full bg-[#1DB8A8]/10 text-[#1DB8A8] font-medium hover:underline">
        {t.relatedClient.fullName}
      </Link>
    );
    return <span className="text-xs text-gray-400">-</span>;
  };

  const extractType = (title) => {
    const match = title.match(/^\[(.+?)\]\s*/);
    return match ? { type: match[1], clean: title.replace(match[0], '') } : { type: null, clean: title };
  };

  // Board view columns
  const boardCols = ['PENDING', 'IN_PROGRESS', 'DONE'];
  const boardLabels = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', DONE: 'Done' };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {[
            { val: 'all', label: 'All Tasks' },
            { val: 'my', label: 'My Tasks' },
            { val: 'overdue', label: 'Overdue' },
            { val: 'today', label: 'Due Today' },
          ].map(f => (
            <button key={f.val} onClick={() => setFilter(f.val)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f.val ? 'bg-[#633806] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{f.label}</button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs w-40 focus:outline-none focus:ring-1 focus:ring-[#1DB8A8]" />
        </div>

        {/* Agent filter (admin) */}
        {user?.role === 'ADMIN' && (
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white text-[#1A1A1A]">
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}

        {/* View toggle */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button onClick={() => setView('list')} className={`px-2.5 py-1.5 ${view === 'list' ? 'bg-[#633806] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <List size={16} />
          </button>
          <button onClick={() => setView('board')} className={`px-2.5 py-1.5 ${view === 'board' ? 'bg-[#633806] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Columns size={16} />
          </button>
        </div>

        <button onClick={() => openTaskModal()}
          className="flex items-center gap-1 bg-[#633806] text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-[#4a2800]">
          <Plus size={14} /> New Task
        </button>
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-1"></th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Task</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600 hidden md:table-cell">Type</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600 hidden lg:table-cell">Assigned To</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600 hidden md:table-cell">Linked To</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Priority</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Due Date</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400">No tasks found</td></tr>
              ) : filtered.map(t => {
                const { type, clean } = extractType(t.title);
                const isDone = t.status === 'DONE';
                const isOverdue = !isDone && new Date(t.dueDate) < todayStart;
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td style={{ borderLeft: `4px solid ${getRowBorder(t)}` }}></td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isDone ? 'line-through text-gray-400' : 'text-[#633806]'}`}>{clean}</span>
                      {isDone && <span className="block text-[10px] text-gray-400">Completed</span>}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {type && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{type}</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs hidden lg:table-cell">{t.assignedTo?.name}</td>
                    <td className="px-3 py-3 hidden md:table-cell">{getLinkedChip(t)}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                    </td>
                    <td className={`px-3 py-3 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {new Date(t.dueDate).toLocaleDateString()}
                      {isOverdue && <span className="block text-[10px]">Overdue</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => cycleStatus(t.id, t.status)}
                          className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${STATUS_COLORS[t.status]} hover:opacity-80`}>
                          {t.status.replace('_', ' ')}
                        </button>
                        <button onClick={() => openEdit(t)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-[#633806]" title="Edit task">
                          <Pencil size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* BOARD VIEW */}
      {view === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boardCols.map(col => (
            <div key={col} className="bg-gray-50 rounded-xl p-3 min-h-[300px]">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[col]}`}>{boardLabels[col]}</span>
                <span className="text-xs text-gray-400">{filtered.filter(t => t.status === col).length}</span>
              </div>
              <div className="space-y-2">
                {filtered.filter(t => t.status === col).map(t => {
                  const { type, clean } = extractType(t.title);
                  const isOverdue = t.status !== 'DONE' && new Date(t.dueDate) < todayStart;
                  return (
                    <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-3.5 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => openEdit(t)}>
                      <p className={`text-sm font-medium mb-2 ${t.status === 'DONE' ? 'line-through text-gray-400' : 'text-[#633806]'}`}>{clean}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {type && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{type}</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#1DB8A8]/20 flex items-center justify-center">
                            <span className="text-[#1DB8A8] text-[9px] font-bold">{t.assignedTo?.name?.charAt(0)}</span>
                          </div>
                          {t.relatedClient && (
                            <Link to={`/clients/${t.relatedClient.id}`} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1DB8A8]/10 text-[#1DB8A8] hover:underline">
                              {t.relatedClient.fullName}
                            </Link>
                          )}
                        </div>
                        <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <button onClick={() => cycleStatus(t.id, t.status)}
                        className="mt-2.5 w-full text-xs text-center py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-[#1DB8A8] hover:text-white transition-colors font-medium">
                        {col === 'PENDING' ? 'Start' : col === 'IN_PROGRESS' ? 'Mark Done' : 'Reopen'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#633806] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Edit Task</h2>
              <button onClick={() => setEditTask(null)}><X size={18} className="text-white/70 hover:text-white" /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Title</label>
                <input required value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Description</label>
                <textarea rows={2} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]">
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Priority</label>
                  <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Due Date</label>
                  <input type="date" required value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
                </div>
                {user?.role === 'ADMIN' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#633806] mb-1.5 uppercase tracking-wide">Assigned To</label>
                    <select value={editForm.assigneeId} onChange={e => setEditForm({ ...editForm, assigneeId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]">
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-between pt-3">
                <button type="button" onClick={() => setEditTask(null)}
                  className="px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={editSaving}
                  className="px-5 py-2 bg-[#633806] text-white rounded-full text-sm font-semibold hover:bg-[#4a2800] disabled:opacity-50">
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
