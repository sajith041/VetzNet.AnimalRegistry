import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { animalsApi } from '../api/animals';
import MicrochipModal from '../components/MicrochipModal';
import VaccinationFormModal from '../components/VaccinationFormModal';
import TransferModal from '../components/TransferModal';
import { getVaccinationStatus, STATUS_STYLES } from '../utils/vaccinationStatus';
import toast from 'react-hot-toast';
import { fileUrl } from '../api/client';

export default function AnimalDetailPage() {
  const { id } = useParams();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [chipModalOpen, setChipModalOpen] = useState(false);
  const [vaccinationFormOpen, setVaccinationFormOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [creatorMap, setCreatorMap] = useState({});

  async function load() {
    if (!id || id === 'undefined') {
      setErrorMsg('Invalid animal ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await animalsApi.get(id);
      if (!data || !data.id) {
        setErrorMsg('Animal not found');
      } else {
        setAnimal(data);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setErrorMsg('Animal not found');
      } else if (status === 400) {
        setErrorMsg('Invalid animal ID');
      } else {
        setErrorMsg('Failed to load animal details');
        toast.error('Failed to load animal');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    import('../api/users').then(({ usersApi }) => {
      usersApi
        .list()
        .then((list) => {
          const map = {};
          list.forEach((u) => {
            map[u.id] = u.fullName || u.username;
          });
          setCreatorMap(map);
        })
        .catch(() => { });
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Loading animal details...
      </div>
    );
  }

  if (errorMsg || !animal) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
        <div className="text-4xl mb-3">🐾</div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          {errorMsg || 'Animal not found'}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          The animal may have been deleted, or the link is invalid.
        </p>
        <Link
          to="/dashboard/animals"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Back to Animals
        </Link>
      </div>
    );
  }

  const owner = animal.currentOwner || null;
  const chip = animal.microchip || null;
  const vaccinations = Array.isArray(animal.vaccinations) ? animal.vaccinations : [];
  const history = Array.isArray(animal.ownershipHistory) ? animal.ownershipHistory : [];
  const photoUrl = animal.photoUrl
  ? fileUrl(animal.photoUrl)
    : null;

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 flex items-start gap-2">
        <span className="text-amber-600 text-sm">🔒</span>
        <p className="text-xs text-amber-800">
          <strong>Confidential.</strong> This page contains owner and animal
          data protected under the Data Protection Act. Access is logged.
        </p>
      </div>

      <Link
        to="/dashboard/animals"
        className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 mb-4"
      >
        ← Back to Animals
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 md:gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-4xl flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="animal"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>🐾</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 truncate">
                  {animal.name || 'Unnamed'}
                </h2>
                <p className="text-slate-500">
                  {animal.species?.name || 'Unknown species'}
                  {animal.breed ? ` · ${animal.breed}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${animal.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : animal.status === 'DECEASED'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                >
                  {animal.status || 'UNKNOWN'}
                </span>
                {animal.status === 'ACTIVE' && (
                  <button
                    onClick={() => setTransferModalOpen(true)}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200"
                  >
                    Transfer
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase">Sex</p>
                <p className="text-slate-700 font-medium">{animal.sex || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase">Color</p>
                <p className="text-slate-700 font-medium">{animal.color || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase">Date of Birth</p>
                <p className="text-slate-700 font-medium">
                  {animal.dob ? new Date(animal.dob).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase">Registered</p>
                <p className="text-slate-700 font-medium">
                  {animal.createdAt
                    ? new Date(animal.createdAt).toLocaleDateString()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase">Location</p>
                <p className="text-slate-700 font-medium">{animal.location || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase">Sterilization Status</p>
                <p className="text-slate-700 font-medium">{animal.sterilizationStatus || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* ⚡ NEXT STEPS BANNER — INSERT HERE */}
          {(() => {
            const needsChip = !chip && animal.chipRequirement === 'REQUIRED';
            const needsVaccine = vaccinations.length === 0;
            if (!needsChip && !needsVaccine) return null;

            return (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <span className="text-amber-600 text-lg">⚡</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Next steps</p>
                  <ul className="text-xs text-amber-800 mt-1 space-y-0.5">
                    {needsChip && <li>• Attach a microchip</li>}
                    {needsVaccine && <li>• Record rabies vaccination</li>}
                  </ul>
                </div>
              </div>
            );
          })()}

          {/* Microchip */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Microchip</h3>
              {!chip && (
                <button
                  onClick={() => setChipModalOpen(true)}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg animate-pulse"
                >
                  + Attach Chip
                </button>
              )}
            </div>
            {chip ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-100 py-2 gap-2">
                  <span className="text-slate-500">Chip Number</span>
                  <span className="font-mono font-semibold text-slate-800 text-right break-all">
                    {chip.chipNumber}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-2">
                  <span className="text-slate-500">Standard</span>
                  <span className="text-slate-700">{chip.isoStandard || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-2">
                  <span className="text-slate-500">Implant Date</span>
                  <span className="text-slate-700">
                    {chip.implantDate
                      ? new Date(chip.implantDate).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2 gap-2">
                  <span className="text-slate-500">Location</span>
                  <span className="text-slate-700 text-right">
                    {chip.implantLocation || '—'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No microchip attached yet.</p>
            )}
          </div>

          {/* Vaccinations */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">
                Vaccinations ({vaccinations.length})
              </h3>
              <button
                onClick={() => setVaccinationFormOpen(true)}
                className={`text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg ${vaccinations.length === 0 ? 'animate-pulse' : ''
                  }`}
              >
                + Record Vaccine
              </button>
            </div>

            {vaccinations.length ? (
              <ul className="space-y-3">
                {vaccinations.map((v) => {
                  const status = getVaccinationStatus(v.nextDueDate);
                  const s = STATUS_STYLES[status];
                  return (
                    <li
                      key={v.id}
                      className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            {v.vaccineType || 'Vaccine'}
                            {v.batchNo && (
                              <span className="ml-2 text-xs text-slate-500">
                                Batch {v.batchNo}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Administered:{' '}
                            {v.administeredDate
                              ? new Date(v.administeredDate).toLocaleDateString()
                              : '—'}
                            {v.nextDueDate && (
                              <>
                                {' · '}Due:{' '}
                                {new Date(v.nextDueDate).toLocaleDateString()}
                              </>
                            )}
                          </p>
                          {v.manufacturer && (
                            <p className="text-xs text-slate-400">
                              {v.manufacturer}
                            </p>
                          )}
                          {v.vetId && creatorMap[v.vetId] && (
                            <p className="text-xs text-slate-400">
                              By {creatorMap[v.vetId]}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${s.bg} ${s.text}`}
                          >
                            {s.label}
                          </span>
                          {v.certificateUrl && (
                            <a
                            href={fileUrl(v.certificateUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-slate-600 hover:text-slate-800 underline"
                            >
                              Cert
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No vaccination records yet.</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <h3 className="font-bold text-slate-800 mb-4">Current Owner</h3>
            {owner ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs uppercase">Name</p>
                  <p className="text-slate-700 font-medium">
                    {owner.fullName}
                    {owner.ownerType === 'ORGANIZATION' && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                        ORG
                      </span>
                    )}
                  </p>
                </div>
                {owner.phone && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Phone</p>
                    <p className="text-slate-700">{owner.phone}</p>
                  </div>
                )}
                {owner.email && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Email</p>
                    <p className="text-slate-700 break-all">{owner.email}</p>
                  </div>
                )}
                {owner.nic && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase">NIC</p>
                    <p className="text-slate-700 font-mono">{owner.nic}</p>
                  </div>
                )}
                {owner.registrationNumber && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase">
                      Registration No.
                    </p>
                    <p className="text-slate-700 font-mono">
                      {owner.registrationNumber}
                    </p>
                  </div>
                )}
                {owner.address && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Address</p>
                    <p className="text-slate-700">{owner.address}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No owner assigned.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <h3 className="font-bold text-slate-800 mb-4">Ownership History</h3>
            {history.length ? (
              <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                {history.map((h) => (
                  <li key={h.id} className="ml-4">
                    <div className="absolute -left-1.5 w-3 h-3 bg-amber-500 rounded-full mt-1.5"></div>
                    <p className="text-sm text-slate-800 font-medium">
                      {h.fromOwner?.fullName || '—'}
                      <span className="text-slate-400 mx-1">→</span>
                      {h.toOwner?.fullName || '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {h.transferDate
                        ? new Date(h.transferDate).toLocaleDateString()
                        : '—'}
                      {h.transferReason && ` · ${h.transferReason}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {h.method === 'CODE' ? 'Via transfer code' : 'Direct'}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-400">No transfers yet.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <h3 className="font-bold text-slate-800 mb-4">Record History</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div className="min-w-0">
                <p className="text-slate-400 text-xs uppercase">Created By</p>
                <p className="text-slate-700 font-medium break-words">
                  {animal.createdBy?.fullName || animal.createdBy?.username || '—'}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 text-xs uppercase">Created At</p>
                <p className="text-slate-700">
                  {animal.createdAt
                    ? new Date(animal.createdAt).toLocaleString('en-GB')
                    : '—'}
                </p>
              </div>

              {(animal.modifiedBy || animal.modifiedAt) && (
                <>
                  <div className="min-w-0">
                    <p className="text-slate-400 text-xs uppercase">Modified By</p>
                    <p className="text-slate-700 font-medium break-words">
                      {animal.modifiedBy?.fullName || animal.modifiedBy?.username || '—'}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-400 text-xs uppercase">Modified At</p>
                    <p className="text-slate-700">
                      {animal.modifiedAt
                        ? new Date(animal.modifiedAt).toLocaleString('en-GB')
                        : '—'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {chipModalOpen && (
        <MicrochipModal
          animal={animal}
          onClose={() => setChipModalOpen(false)}
          onSaved={() => {
            setChipModalOpen(false);
            load();
          }}
        />
      )}

      {vaccinationFormOpen && (
        <VaccinationFormModal
          lockedAnimalId={animal.id}
          onClose={() => setVaccinationFormOpen(false)}
          onSaved={() => {
            setVaccinationFormOpen(false);
            load();
          }}
        />
      )}

      {transferModalOpen && (
        <TransferModal
          animal={animal}
          onClose={() => setTransferModalOpen(false)}
          onTransferred={() => {
            setTransferModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}