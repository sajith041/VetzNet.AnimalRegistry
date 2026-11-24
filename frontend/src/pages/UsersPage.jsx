import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../api/users';
import UserFormModal from '../components/UserFormModal';
import toast from 'react-hot-toast';

const ROLE_BADGES = {
  SUPER_ADMIN:   { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Super Admin' },
  DAPH_OFFICER:  { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'DAPH Officer' },
  VET:           { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Vet' },
  CLINIC_STAFF:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Clinic Staff' },
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetFor, setResetFor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search };
      if (roleFilter) params.role = roleFilter;
      const res = await usersApi.list(params);
      setUsers(res);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access denied');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(u) {
    const next = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (
      !confirm(
        `Set "${u.username}" to ${next}? ` +
          (next === 'INACTIVE' ? 'They will not be able to log in.' : '')
      )
    )
      return;
    try {
      await usersApi.update(u.id, { status: next });
      toast.success(`User ${next.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResetting(true);
    try {
      await usersApi.resetPassword(resetFor.id, newPassword);
      toast.success('Password reset');
      setResetFor(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 flex items-start gap-2">
        <span className="text-amber-600 text-sm">🔒</span>
        <p className="text-xs text-amber-800">
          <strong>Restricted.</strong> User management is limited to DAPH
          officers and Super Admins. All actions are logged.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Users</h2>
          <p className="text-sm text-slate-500">
            {users.length} user{users.length !== 1 ? 's' : ''} in system
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium self-start sm:self-auto"
        >
          + Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by username, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All roles</option>
            {Object.entries(ROLE_BADGES).map(([key, b]) => (
              <option key={key} value={key}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Vet Profile
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Last Login
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const badge = ROLE_BADGES[u.role] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    label: u.role,
                  };
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {u.fullName || u.username}
                        </p>
                        <p className="text-xs text-slate-500">
                          @{u.username}
                          {u.email && ` · ${u.email}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {u.vet ? (
                          <>
                            {u.vet.fullName}
                            <p className="text-xs text-slate-400">
                              {u.vet.slvcRegNo}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            u.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditing(u);
                            setModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setResetFor(u)}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                        >
                          Reset PW
                        </button>
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`text-sm font-medium ${
                            u.status === 'ACTIVE'
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <UserFormModal
          user={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}

      {resetFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Reset Password</h3>
                <p className="text-xs text-slate-500">
                  for {resetFor.username}
                </p>
              </div>
              <button
                onClick={() => {
                  setResetFor(null);
                  setNewPassword('');
                }}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setResetFor(null);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-lg order-1 sm:order-2"
                >
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}