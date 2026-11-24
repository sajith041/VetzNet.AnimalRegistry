import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard/lookup',       label: 'Scan & Lookup', icon: '🔍', roles: ['VET', 'CLINIC_STAFF', 'DAPH_OFFICER', 'SUPER_ADMIN'] },
  { to: '/dashboard',              label: 'Dashboard',     icon: '📊', roles: ['VET', 'CLINIC_STAFF', 'DAPH_OFFICER', 'SUPER_ADMIN'] },
  { to: '/dashboard/owners',       label: 'Owners',        icon: '👤', roles: ['VET', 'CLINIC_STAFF', 'DAPH_OFFICER', 'SUPER_ADMIN'] },
  { to: '/dashboard/animals',      label: 'Animals',       icon: '🐕', roles: ['VET', 'CLINIC_STAFF', 'DAPH_OFFICER', 'SUPER_ADMIN'] },
  { to: '/dashboard/vaccinations', label: 'Vaccinations',  icon: '💉', roles: ['VET', 'CLINIC_STAFF', 'DAPH_OFFICER', 'SUPER_ADMIN'] },
  { to: '/dashboard/reports',      label: 'Reports',       icon: '📋', roles: ['DAPH_OFFICER', 'SUPER_ADMIN'] },
  { to: '/dashboard/vets',         label: 'Vet Profiles',  icon: '🩺', roles: ['DAPH_OFFICER', 'SUPER_ADMIN'] },
  { to: '/dashboard/users',        label: 'Users',         icon: '🔐', roles: ['DAPH_OFFICER', 'SUPER_ADMIN'] },
];

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const role = user?.role;

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 md:w-60 bg-white border-r border-slate-200 h-full p-4">
      <nav className="space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-400 px-3">
          Phase 1 Pilot
          <br />
          DAPH Partnership
        </p>
      </div>
    </aside>
  );
}