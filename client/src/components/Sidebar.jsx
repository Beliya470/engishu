import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTaskModal } from '../context/TaskContext';
import {
  LayoutDashboard, Users, Target, Shield, FileText,
  FolderOpen, DollarSign, CheckSquare, Settings, LogOut, Plus,
  AlertTriangle, BarChart3, MessageCircle
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/leads', icon: Target, label: 'Leads' },
  { to: '/policies', icon: Shield, label: 'Policies' },
  { to: '/quotations', icon: FileText, label: 'Quotations' },
  { to: '/claims', icon: AlertTriangle, label: 'Claims' },
  { to: '/commissions', icon: DollarSign, label: 'Commissions', adminOnly: true },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/reports', icon: BarChart3, label: 'Reports', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Settings', adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { openTaskModal } = useTaskModal();
  const filtered = navItems.filter(item => !item.adminOnly || user?.role === 'ADMIN');

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-[#3D1A00] flex-col z-30">
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1DB8A8] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <div>
              <span className="font-bold text-white text-base">Engishu</span>
              <p className="text-[10px] text-white/60 -mt-0.5">Staff Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          {filtered.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-[#1DB8A8] text-white'
                    : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
                }`
              }
            >
              <item.icon size={18} className="opacity-80" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-3">
          <button onClick={() => openTaskModal()}
            className="w-full flex items-center justify-center gap-1.5 bg-[#1DB8A8] text-white py-2.5 rounded-full text-sm font-semibold hover:bg-[#28bfb3] transition-colors">
            <Plus size={16} /> New Task
          </button>
        </div>

        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#1DB8A8]/20 flex items-center justify-center">
              <span className="text-[#1DB8A8] font-semibold text-sm">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#1DB8A8] text-white">
                {user?.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-full">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#3D1A00] border-t border-white/10 z-30 flex justify-around py-1.5 px-1">
        {filtered.slice(0, 5).map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs ${isActive ? 'text-[#1DB8A8]' : 'text-white/50'}`
            }>
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <NavLink to="/more"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs ${isActive ? 'text-[#1DB8A8]' : 'text-white/50'}`
          }>
          <Settings size={20} />
          <span>More</span>
        </NavLink>
      </nav>
    </>
  );
}
