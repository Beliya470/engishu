import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';

// Public pages
import PublicLayout from './components/PublicLayout';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import About from './pages/About';
import Contact from './pages/Contact';

// ERP pages
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import Leads from './pages/Leads';
import Policies from './pages/Policies';
import Quotations from './pages/Quotations';
import Documents from './pages/Documents';
import Commissions from './pages/Commissions';
import Tasks from './pages/Tasks';
import Claims from './pages/Claims';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import More from './pages/More';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      {/* Public Website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Staff Login */}
      <Route path="/login" element={
        loading ? <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>
        : user ? <Navigate to="/dashboard" /> : <Login />
      } />

      {/* Internal ERP */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="/clients" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Clients />} />
        <Route path=":id" element={<ClientProfile />} />
      </Route>
      <Route path="/leads" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Leads />} />
      </Route>
      <Route path="/policies" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Policies />} />
      </Route>
      <Route path="/quotations" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Quotations />} />
      </Route>
      <Route path="/documents" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Documents />} />
      </Route>
      <Route path="/commissions" element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
        <Route index element={<Commissions />} />
      </Route>
      <Route path="/tasks" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Tasks />} />
      </Route>
      <Route path="/claims" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Claims />} />
      </Route>
      <Route path="/messages" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Messages />} />
      </Route>
      <Route path="/reports" element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
        <Route index element={<Reports />} />
      </Route>
      <Route path="/settings" element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
        <Route index element={<Settings />} />
      </Route>
      <Route path="/more" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<More />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TaskProvider>
          <AppRoutes />
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
