import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { animalsApi } from '../api/animals';
import { speciesApi } from '../api/species';
import AnimalFormModal from '../components/AnimalFormModal';
import MicrochipModal from '../components/MicrochipModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { fileUrl } from '../api/client';

export default function AnimalsPage() {
  const [animals, setAnimals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchCreatedBy, setSearchCreatedBy] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [chipModalFor, setChipModalFor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuth();
  const canDeleteAnimals = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    speciesApi.list().then(setSpecies).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search,searchCreatedBy, page, limit: 10 };
      if (speciesFilter) params.speciesId = speciesFilter;
      const res = await animalsApi.list(params);
      setAnimals(res.data);
      setPagination(res.pagination);
    } catch {
      toast.error('Failed to load animals');
    } finally {
      setLoading(false);
    }
  }, [search, searchCreatedBy,speciesFilter, page]);

  useEffect(() => {
    load();
  }, [load]);
  // Auto-open add modal if ?new=1 in URL
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
      // Remove the query param without adding a history entry
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search, speciesFilter, searchCreatedBy]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(animal) {
    setEditing(animal);
    setFormOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this animal? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await animalsApi.remove(id);
      toast.success('Animal deleted');
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
          <strong>Confidential.</strong> Animal and owner data is protected
          under the Data Protection Act. Access is logged.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Animals</h2>
          <p className="text-sm text-slate-500">
            {pagination.total} registered animal
            {pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium self-start sm:self-auto"
        >
          + Register Animal
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, breed, chip, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
            <input
            type="text"
            placeholder="Search By Added User"
            value={searchCreatedBy}
            onChange={(e) => setSearchCreatedBy(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All species</option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading...</div>
        ) : animals.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No animals found. Click "Register Animal" to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Photo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Species / Breed
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Owner
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Microchip
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Location
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Sterilization Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Vaccines
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Created By
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {animals.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center text-xl">
                        {a.photoUrl ? (
                          <img
                          src={fileUrl(a.photoUrl)}
                            alt="animal"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>🐾</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/animals/${a.id}`}
                        className="font-medium text-slate-800 hover:text-blue-600"
                      >
                        {a.name || 'Unnamed'}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {a.species?.name || '—'} · {a.breed || 'No breed'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">
                        {a.currentOwner?.fullName || '—'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.currentOwner?.phone || ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {a.microchip ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono bg-green-50 text-green-700 px-2 py-1 rounded">
                          ✓ {a.microchip.chipNumber}
                        </span>
                      ) : a.chipRequirement === 'REQUIRED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 px-2 py-1 rounded">
                          ⚠ Chip required
                        </span>
                      ) : a.chipRequirement === 'PROVISIONAL' ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                          Chip pending
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          No chip
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.location ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.sterilizationStatus ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a._count?.vaccinations ?? 0}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.createdBy?.fullName || a.createdBy?.username || '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {!a.microchip && (
                        <button
                          onClick={() => setChipModalFor(a)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          + Chip
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(a)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      {canDeleteAnimals && (
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
                          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                        >
                          {deletingId === a.id ? '...' : 'Delete'}
                        </button>
                      )}
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

      {formOpen && (
        <AnimalFormModal
          animal={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}

      {chipModalFor && (
        <MicrochipModal
          animal={chipModalFor}
          onClose={() => setChipModalFor(null)}
          onSaved={() => {
            setChipModalFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}