import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FolderOpen, DollarSign, CheckSquare, Settings, LogOut } from 'lucide-react';

export default function More() {
  const { user, logout } = useAuth();

  const items = [
    { to: '/documents', icon: FolderOpen, label: 'Documents' },
    ...(user?.role === 'ADMIN' ? [{ to: '/commissions', icon: DollarSign, label: 'Commissions' }] : []),
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    ...(user?.role === 'ADMIN' ? [{ to: '/settings', icon: Settings, label: 'Settings' }] : []),
  ];

  return (
    <div className="space-y-2">
      {items.map(item => (
        <Link key={item.to} to={item.to}
          className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
          <item.icon size={20} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">{item.label}</span>
        </Link>
      ))}
      <button onClick={logout}
        className="flex items-center gap-3 w-full bg-white rounded-xl border border-slate-200 p-4 hover:bg-red-50 text-left">
        <LogOut size={20} className="text-red-400" />
        <span className="text-sm font-medium text-red-500">Logout</span>
      </button>
    </div>
  );
}
