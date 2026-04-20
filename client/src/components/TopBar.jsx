import { useAuth } from '../context/AuthContext';
import { useTaskModal } from '../context/TaskContext';
import { Bell, Plus, MessageCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function TopBar({ title }) {
  const { user } = useAuth();
  const { openTaskModal } = useTaskModal();
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const fetchCounts = () => {
    api.get('/notifications/unread').then(res => setUnreadNotifs(res.data.count)).catch(() => {});
    api.get('/messages/unread/count').then(res => setUnreadMsgs(res.data.count)).catch(() => {});
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Browser notification when tab is hidden
  useEffect(() => {
    if (unreadNotifs > 0 && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification('Engishu Insurance', {
        body: `You have ${unreadNotifs} new notification${unreadNotifs > 1 ? 's' : ''}`,
      });
    }
  }, [unreadNotifs]);

  const openNotifications = () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) {
      api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
    }
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnreadNotifs(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  return (
    <header className="bg-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-20" style={{ borderBottom: '1px solid #5a3000' }}>
      <h1 className="text-base md:text-xl font-semibold text-[#633806] truncate mr-3 max-w-[140px] sm:max-w-none">{title}</h1>
      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        <button onClick={() => openTaskModal()}
          className="flex items-center gap-1 bg-[#633806] text-white px-2.5 md:px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-[#4a2800] transition-colors">
          <Plus size={14} /> <span className="hidden sm:inline">Task</span>
        </button>

        {/* Messages */}
        <Link to="/messages" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <MessageCircle size={20} className="text-slate-500" />
          {unreadMsgs > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#1DB8A8] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadMsgs}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={openNotifications} className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell size={20} className="text-slate-500" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadNotifs}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-[#633806] text-sm">Notifications</h3>
                {unreadNotifs > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#1DB8A8] hover:underline">Mark all read</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 p-4 text-center">No notifications</p>
                ) : notifications.slice(0, 20).map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!n.read ? 'bg-[#1DB8A8]/5' : ''}`}>
                    {n.link ? (
                      <Link to={n.link} onClick={() => setShowNotifs(false)} className="block">
                        <p className="text-sm font-medium text-[#633806]">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </Link>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-[#633806]">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-[#1DB8A8]/20 flex items-center justify-center">
          <span className="text-[#1DB8A8] font-semibold text-sm">{user?.name?.charAt(0)}</span>
        </div>
      </div>
    </header>
  );
}
