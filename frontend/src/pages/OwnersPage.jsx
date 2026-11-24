import { useState, useEffect, useCallback } from 'react';
import { ownersApi } from '../api/owners';
import OwnerFormModal from '../components/OwnerFormModal';
import toast from 'react-hot-toast';

export default function OwnersPage() {
  const [owners, setOwners] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ownersApi.list({ search, page, limit: 10 });
      setOwners(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Failed to load owners');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(owner) {
    setEditing(owner);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this owner? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await ownersApi.remove(id);
      toast.success('Owner deleted');
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
          <strong>Confidential.</strong> Owner data is protected under the Data
          Protection Act. Access is logged.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Owners</h2>
          <p className="text-sm text-slate-500">
            {pagination.total} registered owner{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium self-start sm:self-auto"
        >
          + Add Owner
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <input
            type="text"
            placeholder="Search by name, NIC, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading...</div>
        ) : owners.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No owners found.{' '}
            {search ? 'Try a different search.' : 'Click "Add Owner" to start.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    NIC / Reg. No.
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Animals
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {owners.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {o.fullName}
                      {o.ownerType === 'ORGANIZATION' && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                          ORG
                        </span>
                      )}
                      {o.contactPerson && (
                        <p className="text-xs text-slate-500 font-normal">
                          Contact: {o.contactPerson}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-sm">
                      {o.nic || o.registrationNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {o._count?.animalsCurrent ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(o)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        disabled={deletingId === o.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        {deletingId === o.id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
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

      {modalOpen && (
        <OwnerFormModal
          owner={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}