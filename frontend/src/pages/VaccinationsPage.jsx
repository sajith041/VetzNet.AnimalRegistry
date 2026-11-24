import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { vaccinationsApi } from '../api/vaccinations';
import VaccinationFormModal from '../components/VaccinationFormModal';
import { getVaccinationStatus, STATUS_STYLES } from '../utils/vaccinationStatus';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { fileUrl } from '../api/client';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'due-soon', label: 'Due soon (30d)' },
  { key: 'overdue', label: 'Overdue' },
];

export default function VaccinationsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { user } = useAuth();
  const isAdmin = ['DAPH_OFFICER', 'SUPER_ADMIN'].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vaccinationsApi.list({ search, filter, page, limit: 10 });
      setItems(res.data);
      setPagination(res.pagination);
    } catch {
      toast.error('Failed to load vaccinations');
    } finally {
      setLoading(false);
    }
  }, [search, filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search, filter]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(v) {
    setEditing(v);
    setFormOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this vaccination record?')) return;
    setDeletingId(id);
    try {
      await vaccinationsApi.remove(id);
      toast.success('Vaccination deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 flex items-start gap-2">
        <span className="text-amber-600 text-sm">🔒</span>
        <p className="text-xs text-amber-800">
          <strong>Confidential.</strong> Vaccination records are medico-legal
          documents. Access is logged.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vaccinations</h2>
          <p className="text-sm text-slate-500">
            {pagination.total} record{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium self-start sm:self-auto"
        >
          + Record Vaccination
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by animal, owner, batch, or chip number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${
                  filter === f.key
                    ? 'bg-white text-slate-800 shadow-sm font-medium'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No vaccination records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Animal
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Vaccine
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Administered
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Next Due
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((v) => {
                  const status = getVaccinationStatus(v.nextDueDate);
                  const s = STATUS_STYLES[status];
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {v.animal?.id ? (
                          <Link
                            to={`/dashboard/animals/${v.animal.id}`}
                            className="font-medium text-slate-800 hover:text-blue-600"
                          >
                            {v.animal.name || 'Unnamed'}
                          </Link>
                        ) : (
                          <span className="font-medium text-slate-400">
                            Deleted animal
                          </span>
                        )}
                        <p className="text-xs text-slate-500">
                          {v.animal?.currentOwner?.fullName || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {v.vaccineType}
                        <p className="text-xs text-slate-500">
                          {v.manufacturer || '—'} {v.batchNo && `· ${v.batchNo}`}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(v.administeredDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {v.nextDueDate
                          ? new Date(v.nextDueDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${s.bg} ${s.text}`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {v.certificateUrl && (
                          <a
                          href={fileUrl(v.certificateUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-600 hover:text-slate-800 text-sm font-medium"
                          >
                            Cert
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(v)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        {(() => {
                          const isCreator = v.vetId === user?.id;
                          const isOld =
                            v.createdAt &&
                            Date.now() - new Date(v.createdAt).getTime() >
                              30 * 24 * 60 * 60 * 1000;
                          const canDelete =
                            (isCreator || isAdmin) &&
                            (!isOld || user?.role === 'SUPER_ADMIN');
                          if (!canDelete) return null;
                          return (
                            <button
                              onClick={() => handleDelete(v.id)}
                              disabled={deletingId === v.id}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                              title={
                                isOld
                                  ? 'Older than 30 days — SUPER_ADMIN only'
                                  : ''
                              }
                            >
                              {deletingId === v.id ? '...' : 'Delete'}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <VaccinationFormModal
          vaccination={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}