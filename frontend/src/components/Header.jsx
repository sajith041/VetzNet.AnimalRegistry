import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="bg-white border-b border-slate-200 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-600 hover:text-slate-800 p-2 -ml-1"
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              Microchip Registry
            </h1>
            <p className="text-xs text-slate-500">Companion Animal Tracking</p>
          </div>
          <span className="sm:hidden text-sm font-bold text-slate-800">
            Microchip
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:block">
          <LanguageSwitcher />
        </div>

        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-slate-700">
            {user?.fullName || user?.username || 'Guest'}
          </p>
          <p className="text-xs text-slate-400">{user?.role || ''}</p>
        </div>

        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
          {(user?.fullName || user?.username || '?')
            .slice(0, 2)
            .toUpperCase()}
        </div>

        {user && (
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-600 transition-colors px-2 py-1"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">↩</span>
          </button>
        )}
      </div>
    </header>
  );
}