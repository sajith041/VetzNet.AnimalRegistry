import { useState, useEffect } from 'react';
import { vetsApi } from '../api/vets';
import toast from 'react-hot-toast';

const EMPLOYMENT_LABELS = {
  GOV: 'Government',
  NGO: 'NGO',
  PRIVATE: 'Private',
  ACADEMIC: 'Academic',
  MOBILE: 'Mobile/Field',
};

const EMPLOYMENT_BADGES = {
  GOV: 'bg-blue-100 text-blue-700',
  NGO: 'bg-green-100 text-green-700',
  PRIVATE: 'bg-purple-100 text-purple-700',
  ACADEMIC: 'bg-amber-100 text-amber-700',
  MOBILE: 'bg-teal-100 text-teal-700',
};

const emptyForm = {
  fullName: '',
  slvcRegNo: '',
  employmentType: 'PRIVATE',
  workplace: '',
  district: '',
  phone: '',
  email: '',
  notes: '',
};

export default function VetsPage() {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await vetsApi.list();
      setVets(data);
    } catch {
      toast.error('Failed to load vets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await vetsApi.create(form);
      toast.success('Vet profile created');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create vet');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 flex items-start gap-2">
        <span className="text-amber-600 text-sm">🔒</span>
        <p className="text-xs text-amber-800">
          <strong>Restricted.</strong> Vet profile management is limited to
          DAPH officers and Super Admins.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vet Profiles</h2>
          <p className="text-sm text-slate-500">
            {vets.length} registered vet{vets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium self-start sm:self-auto"
        >
          {showForm ? 'Cancel' : '+ Add Vet Profile'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                placeholder="Dr. Nimal Perera"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SLVC Reg. No. *
              </label>
              <input
                value={form.slvcRegNo}
                onChange={(e) => setForm({ ...form, slvcRegNo: e.target.value })}
                required
                placeholder="SLVC-2019-00142"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Employment Type *
              </label>
              <select
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {Object.entries(EMPLOYMENT_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Workplace
              </label>
              <input
                value={form.workplace}
                onChange={(e) => setForm({ ...form, workplace: e.target.value })}
                placeholder={
                  form.employmentType === 'GOV'
                    ? 'Divisional Veterinary Office, ...'
                    : form.employmentType === 'NGO'
                    ? 'NGO name'
                    : 'Clinic name'
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                District
              </label>
              <input
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Additional context (e.g. volunteers with Kandy welfare trust)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg w-full sm:w-auto"
            >
              {creating ? 'Creating...' : 'Create Vet Profile'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading...</div>
        ) : vets.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No vet profiles yet. Click "+ Add Vet Profile" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    SLVC Reg. No.
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Employment
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Workplace
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    District
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody>
                {vets.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {v.fullName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-sm">
                      {v.slvcRegNo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          EMPLOYMENT_BADGES[v.employmentType] ||
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {EMPLOYMENT_LABELS[v.employmentType] ||
                          v.employmentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {v.workplace || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {v.district || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {v._count?.users ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}