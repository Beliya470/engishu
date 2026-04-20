import { Outlet } from 'react-router-dom';
import PublicNav from './PublicNav';
import Footer from './Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#F7FFFE]">
      <PublicNav />
      <Outlet />
      <Footer />
    </div>
  );
}
