import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Plus, X, UserPlus } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [company, setCompany] = useState({ name: '', phone: '', email: '', address: '', notificationEmail: '' });
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'AGENT', phone: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/settings/company').then(res => setCompany(res.data)).catch(() => {});
    api.get('/users').then(res => setUsers(res.data)).catch(() => {});
  }, []);

  const saveCompany = async () => {
    try {
      await api.put('/settings/company', company);
      setMsg('Company settings saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Error saving'); }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const data = { ...userForm };
        if (!data.password) delete data.password;
        await api.put(`/users/${editingUser}`, data);
      } else {
        await api.post('/users', userForm);
      }
      setShowUserForm(false);
      setUserForm({ name: '', email: '', password: '', role: 'AGENT', phone: '' });
      setEditingUser(null);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving user');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/change-password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMsg('Password changed!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Error changing password');
    }
  };

  const openEditUser = (u) => {
    setUserForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', active: u.active });
    setEditingUser(u.id);
    setShowUserForm(true);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {msg && <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg border border-green-200">{msg}</div>}

      {/* Company Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Company Details</h3>
        <div className="space-y-3">
          <input placeholder="Company Name" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Phone" value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            <input placeholder="Email" value={company.email} onChange={e => setCompany({ ...company, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <input placeholder="Address" value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <input placeholder="Notification Email (for lead alerts)" value={company.notificationEmail}
            onChange={e => setCompany({ ...company, notificationEmail: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <button onClick={saveCompany} className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600">
            Save Company Details
          </button>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Manage Users</h3>
          <button onClick={() => { setShowUserForm(true); setEditingUser(null); setUserForm({ name: '', email: '', password: '', role: 'AGENT', phone: '' }); }}
            className="flex items-center gap-1.5 bg-teal-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-600">
            <UserPlus size={14} /> Add User
          </button>
        </div>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">{u.name} <span className="text-xs text-slate-400">({u.email})</span></p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                  {u.active === false && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600">Inactive</span>}
                </div>
              </div>
              <button onClick={() => openEditUser(u)} className="text-sm text-teal-600 hover:underline">Edit</button>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Change Password</h3>
        <form onSubmit={changePassword} className="space-y-3">
          <input type="password" required placeholder="Current Password" value={passwordForm.currentPassword}
            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <input type="password" required placeholder="New Password" value={passwordForm.newPassword}
            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <button type="submit" className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600">
            Change Password
          </button>
        </form>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">{editingUser ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => { setShowUserForm(false); setEditingUser(null); }}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="space-y-3">
              <input required placeholder="Full Name *" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input type="email" required placeholder="Email *" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input type="password" placeholder={editingUser ? 'New Password (leave blank to keep)' : 'Password *'}
                required={!editingUser} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input placeholder="Phone" value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
              {editingUser && (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={userForm.active !== false}
                    onChange={e => setUserForm({ ...userForm, active: e.target.checked })} />
                  Active
                </label>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowUserForm(false); setEditingUser(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600">
                  {editingUser ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
