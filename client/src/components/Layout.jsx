import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/leads': 'Leads',
  '/policies': 'Policies',
  '/quotations': 'Quotations',
  '/documents': 'Documents',
  '/commissions': 'Commissions',
  '/tasks': 'Tasks',
  '/claims': 'Claims',
  '/messages': 'Messages',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
  '/more': 'More',
};

export default function Layout() {
  const location = useLocation();
  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const title = pageTitles[basePath] || 'Engishu';

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="md:ml-60 pb-20 md:pb-0">
        <TopBar title={title} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
