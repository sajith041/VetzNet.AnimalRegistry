import { useState, useEffect } from 'react';
import { usersApi } from '../api/users';
import { vetsApi } from '../api/vets';
import toast from 'react-hot-toast';

const empty = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  role: 'VET',
  preferredLang: 'en',
  vetId: '',
};

const ROLES = [
  { value: 'VET', label: 'Veterinarian' },
  { value: 'CLINIC_STAFF', label: 'Clinic Staff' },
  { value: 'DAPH_OFFICER', label: 'DAPH Officer' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

export default function UserFormModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(empty);
  const [vets, setVets] = useState([]);
  const [saving, setSaving] = useState(false);
  const isEdit = !!user;

  useEffect(() => {
    vetsApi.list().then(setVets).catch(() => setVets([]));
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        password: '',
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role || 'VET',
        preferredLang: user.preferredLang || 'en',
        vetId: user.vetId || '',
      });
    } else {
      setForm(empty);
    }
  }, [user]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await usersApi.update(user.id, {
          fullName: form.fullName,
          email: form.email,
          role: form.role,
          preferredLang: form.preferredLang,
          vetId: form.vetId ? parseInt(form.vetId, 10) : null,
        });
        toast.success('User updated');
      } else {
        await usersApi.create({
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          email: form.email,
          role: form.role,
          preferredLang: form.preferredLang,
          vetId: form.vetId ? parseInt(form.vetId, 10) : null,
        });
        toast.success('User created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Edit User' : 'Add User'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username *
            </label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              disabled={isEdit}
              autoComplete="off"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
            />
            {isEdit && (
              <p className="text-xs text-slate-400 mt-1">
                Username cannot be changed
              </p>
            )}
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Language
              </label>
              <select
                name="preferredLang"
                value={form.preferredLang}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
          </div>

          {(form.role === 'VET' || form.role === 'CLINIC_STAFF') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Linked Vet Profile
              </label>
              <select
                name="vetId"
                value={form.vetId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Not linked</option>
                {vets.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fullName} ({v.slvcRegNo})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Links this user to a licensed vet for reporting
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg"
            >
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}