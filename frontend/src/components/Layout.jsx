import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  // useLocation changes on navigation — effect resets it
  useState(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onMenuClick={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1 relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar: fixed drawer on mobile, static on desktop */}
        <div
          className={`
            fixed md:static inset-y-0 left-0 z-40
            w-64 md:w-60
            bg-white border-r border-slate-200
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            pt-16 md:pt-0
          `}
        >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}