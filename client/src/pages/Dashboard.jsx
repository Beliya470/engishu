import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTaskModal } from '../context/TaskContext';
import api from '../lib/api';
import { Plus, Check } from 'lucide-react';

function formatDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const { openTaskModal, subscribeToTaskCreated } = useTaskModal();
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/tasks'),
    ]).then(([dashRes, taskRes]) => {
      setData(dashRes.data);
      const allTasks = taskRes.data;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 86400000);

      // My tasks due today
      const myToday = allTasks.filter(t =>
        t.status !== 'DONE' &&
        new Date(t.dueDate) >= todayStart &&
        new Date(t.dueDate) < todayEnd
      ).slice(0, 5);
      setTasks(myToday);

      // Overdue tasks (admin sees all, agent sees own)
      const od = allTasks.filter(t =>
        t.status !== 'DONE' && new Date(t.dueDate) < todayStart
      );
      setOverdueTasks(od);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { return subscribeToTaskCreated(fetchData); }, [subscribeToTaskCreated]);

  const markDone = async (id) => {
    await api.put(`/tasks/${id}`, { status: 'DONE' });
    fetchData();
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Loading...</div>;
  if (!data) return <div className="text-center py-12 text-red-500">Failed to load dashboard</div>;

  const isAdmin = user?.role === 'ADMIN';

  const cards = isAdmin
    ? [
        { label: 'TOTAL CLIENTS', value: data.totalClients, link: '/clients', border: '#1DB8A8' },
        { label: 'ACTIVE POLICIES', value: data.activePolicies, link: '/policies', border: '#1DB8A8' },
        { label: 'LEADS IN PIPELINE', value: data.leadsInPipeline, link: '/leads', border: '#1DB8A8' },
        { label: 'TASKS OVERDUE', value: data.overdueTasks, link: '/tasks', border: '#633806' },
        { label: 'RENEWING IN 30 DAYS', value: data.renewingSoon, link: '/policies', border: '#F59E0B' },
        { label: 'REVENUE THIS MONTH', value: `KES ${(data.revenueThisMonth || 0).toLocaleString()}`, link: null, border: '#1DB8A8', sub: 'Updated today' },
      ]
    : [
        { label: 'MY CLIENTS', value: data.totalClients, link: '/clients', border: '#1DB8A8' },
        { label: 'MY LEADS', value: data.leadsInPipeline, link: '/leads', border: '#1DB8A8' },
        { label: 'TASKS DUE TODAY', value: data.tasksDueToday || 0, link: '/tasks', border: '#633806' },
        { label: 'RENEWING SOON', value: data.renewingSoon, link: '/policies', border: '#F59E0B' },
      ];

  return (
    <div>
      <div className="mb-6">
        <p className="text-xl font-semibold text-[#633806]">Welcome back, {user?.name}</p>
        <p className="text-sm text-[#9CA3AF] mt-0.5">{formatDate()}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8 items-stretch">
        {cards.map((card, i) => {
          const inner = (
            <div className="bg-white border border-gray-200 rounded-r-xl p-6 hover:shadow-sm transition-shadow h-full"
              style={{ borderLeft: `4px solid ${card.border}`, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
              <p className="text-xs font-semibold tracking-wider text-[#9CA3AF] mb-2">{card.label}</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#633806]">{card.value}</p>
              {card.sub && <p className="text-xs text-[#9CA3AF] mt-1">{card.sub}</p>}
            </div>
          );
          return card.link
            ? <Link key={i} to={card.link} className="block h-full">{inner}</Link>
            : <div key={i} className="h-full">{inner}</div>;
        })}
      </div>

      {/* My Tasks Today */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#633806]">My Tasks Today</h2>
          <button onClick={() => openTaskModal()} className="text-xs text-[#1DB8A8] font-semibold hover:underline flex items-center gap-1">
            <Plus size={14} /> Add Task
          </button>
        </div>
        {tasks.length === 0 ? (
          <div className="text-sm text-[#9CA3AF] py-4">
            No tasks due today.{' '}
            <button onClick={() => openTaskModal()} className="text-[#1DB8A8] hover:underline font-medium">Create one</button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
                <button onClick={() => markDone(t.id)}
                  className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#1DB8A8] hover:bg-[#1DB8A8] group transition-colors flex-shrink-0">
                  <Check size={12} className="text-transparent group-hover:text-white" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{t.title}</p>
                  {t.relatedClient && (
                    <Link to={`/clients/${t.relatedClient.id}`} className="text-xs text-[#1DB8A8] hover:underline">
                      {t.relatedClient.fullName}
                    </Link>
                  )}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  t.priority === 'HIGH' ? 'bg-[#633806]/10 text-[#633806]' :
                  t.priority === 'MEDIUM' ? 'bg-[#1DB8A8]/10 text-[#1DB8A8]' :
                  'bg-gray-100 text-gray-500'
                }`}>{t.priority}</span>
              </div>
            ))}
            <Link to="/tasks" className="block text-xs text-[#1DB8A8] font-medium hover:underline pt-1">View all tasks</Link>
          </div>
        )}
      </div>

      {/* Overdue Tasks (admin sees all agents, agent sees own) */}
      {overdueTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6" style={{ borderLeft: '4px solid #EF4444' }}>
          <h2 className="text-lg font-semibold text-[#633806] mb-4">Overdue Tasks ({overdueTasks.length})</h2>
          <div className="space-y-2">
            {overdueTasks.slice(0, 5).map(t => {
              const daysOverdue = Math.ceil((new Date() - new Date(t.dueDate)) / 86400000);
              return (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{t.title}</p>
                    <p className="text-xs text-slate-400">
                      {t.assignedTo?.name} &middot; {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                    </p>
                  </div>
                  <button onClick={() => markDone(t.id)}
                    className="text-xs text-[#633806] font-medium hover:underline flex-shrink-0">Mark Done</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#633806]">Recent Activity</h2>
          <button onClick={() => openTaskModal()} className="text-xs text-[#1DB8A8] font-semibold hover:underline flex items-center gap-1">
            <Plus size={14} /> Add Task
          </button>
        </div>
        <div className="space-y-3">
          {data.recentActivity?.recentLeads?.map(lead => (
            <div key={lead.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1DB8A8] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">New lead: {lead.name}</p>
                <p className="text-xs text-slate-400">{lead.company} &middot; {lead.status}</p>
              </div>
              <span className="text-xs text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {data.recentActivity?.recentClients?.map(client => (
            <div key={client.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1DB8A8] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Client added: {client.fullName}</p>
                <p className="text-xs text-slate-400">{client.companyName || 'Individual'}</p>
              </div>
              <span className="text-xs text-slate-400">{new Date(client.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {data.recentActivity?.recentPolicies?.map(policy => (
            <div key={policy.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1DB8A8] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Policy: {policy.policyNumber}</p>
                <p className="text-xs text-slate-400">{policy.client?.fullName} &middot; {policy.productType}</p>
              </div>
              <span className="text-xs text-slate-400">{new Date(policy.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
