import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../api/stats';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi
      .dashboard()
      .then(setStats)
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = ['DAPH_OFFICER', 'SUPER_ADMIN'].includes(user?.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return <div className="text-slate-400">Dashboard unavailable.</div>;
  }

  const totalSpecies = stats.animals.bySpecies.reduce(
    (sum, s) => sum + s.count,
    0
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">
            Welcome back, {user?.fullName || user?.username}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/dashboard/animals"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            + Register Animal
          </Link>
          <Link
            to="/dashboard/vaccinations"
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            + Record Vaccine
          </Link>
          {isAdmin && (
            <Link
              to="/dashboard/reports"
              className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
              📊 Reports
            </Link>
          )}
        </div>
      </div>

      {/* Hero cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
              🐾
            </div>
            <p className="text-sm text-slate-500">Total Animals</p>
          </div>
          <p className="text-4xl font-bold text-slate-800">
            {stats.animals.total}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            +{stats.recentActivity.animalsThisWeek} this week
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">
              📡
            </div>
            <p className="text-sm text-slate-500">Microchip Coverage</p>
          </div>
          <p className="text-4xl font-bold text-slate-800">
            {stats.animals.chipCoveragePct}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.animals.chipped} of {stats.animals.total} chipped
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-xl">
              🚨
            </div>
            <p className="text-sm text-slate-500">Overdue Vaccines</p>
          </div>
          <p
            className={`text-4xl font-bold ${
              stats.vaccinations.overdue > 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {stats.vaccinations.overdue}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.vaccinations.overduePct}% of all records
          </p>
        </div>
      </div>

      {/* Species + Vaccination status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Species Breakdown</h3>
          {stats.animals.bySpecies.length === 0 ? (
            <p className="text-sm text-slate-400">No animals registered yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.animals.bySpecies.map((s) => {
                const pct = totalSpecies
                  ? Math.round((s.count / totalSpecies) * 100)
                  : 0;
                return (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">
                        {s.name}
                      </span>
                      <span className="text-slate-500">
                        {s.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Vaccination Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Up to date
              </span>
              <span className="font-semibold text-slate-800">
                {stats.vaccinations.upToDate}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Due soon (30d)
              </span>
              <span className="font-semibold text-slate-800">
                {stats.vaccinations.dueSoon}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Overdue
              </span>
              <span className="font-semibold text-red-600">
                {stats.vaccinations.overdue}
              </span>
            </div>
          </div>
          {stats.animals.missingRequiredChip > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                ⚠️ <strong>{stats.animals.missingRequiredChip}</strong> animal
                {stats.animals.missingRequiredChip !== 1 ? 's' : ''} missing
                required microchip
              </p>
            </div>
          )}
        </div>
      </div>

      {/* District table */}
      {stats.byDistrict.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">By District</h3>
            <p className="text-xs text-slate-500">
              Distribution across Sri Lanka
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    District
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Animals
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Overdue
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.byDistrict.map((d) => (
                  <tr
                    key={d.district}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-4 py-2 text-slate-800 font-medium">
                      {d.district}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      {d.animals}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={
                          d.overdue > 0
                            ? 'text-red-600 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        {d.overdue || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
            This Week
          </p>
          <p className="text-2xl font-bold text-slate-800">
            {stats.recentActivity.animalsThisWeek}
          </p>
          <p className="text-xs text-slate-400">new animals</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
            This Week
          </p>
          <p className="text-2xl font-bold text-slate-800">
            {stats.recentActivity.vaccinationsThisWeek}
          </p>
          <p className="text-xs text-slate-400">vaccinations</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
            This Week
          </p>
          <p className="text-2xl font-bold text-slate-800">
            {stats.recentActivity.transfersThisWeek}
          </p>
          <p className="text-xs text-slate-400">transfers</p>
        </div>
      </div>

      {/* Policy reminder */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-1">
          📋 Microchip policy (pilot)
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 mt-2">
          <li>
            • <strong>Required</strong> for: licensed dogs, breeding animals,
            imports, certification
          </li>
          <li>
            • <strong>Provisional</strong> for: rural, free-roaming, and shelter
            animals — chip within 12 months
          </li>
          <li>
            • <strong>Optional</strong> for: animals where chipping is medically
            contraindicated
          </li>
        </ul>
      </div>
    </div>
  );
}