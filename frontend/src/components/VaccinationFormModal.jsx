import { useState, useEffect } from 'react';
import { vaccinationsApi } from '../api/vaccinations';
import AnimalSelect from './AnimalSelect';
import { usePreference } from '../hooks/usePreference';
import toast from 'react-hot-toast';

function generateUuid() {
  return (
    'vac-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12)
  );
}

function addYears(dateStr, years) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

const empty = {
  clientUuid: '',
  animalId: '',
  vaccineType: 'RABIES',
  batchNo: '',
  manufacturer: '',
  expiryDate: '',
  stickerQr: '',
  administeredDate: '',
  nextDueDate: '',
};

export default function VaccinationFormModal({
  vaccination,
  lockedAnimalId,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [dueDateTouched, setDueDateTouched] = useState(false);
  const [certFile, setCertFile] = useState(null);
  const isEdit = !!vaccination;

  // Remember last-used manufacturer + batch
  const [lastManufacturer, setLastManufacturer] = usePreference(
    'lastVaccineManufacturer',
    ''
  );
  const [lastBatch, setLastBatch] = usePreference('lastVaccineBatch', '');

  useEffect(() => {
    if (vaccination) {
      setForm({
        clientUuid: vaccination.clientUuid || '',
        animalId: vaccination.animalId || '',
        vaccineType: vaccination.vaccineType || 'RABIES',
        batchNo: vaccination.batchNo || '',
        manufacturer: vaccination.manufacturer || '',
        expiryDate: vaccination.expiryDate
          ? vaccination.expiryDate.slice(0, 10)
          : '',
        stickerQr: vaccination.stickerQr || '',
        administeredDate: vaccination.administeredDate
          ? vaccination.administeredDate.slice(0, 10)
          : '',
        nextDueDate: vaccination.nextDueDate
          ? vaccination.nextDueDate.slice(0, 10)
          : '',
      });
      setDueDateTouched(true);
    } else {
      setForm({
        ...empty,
        clientUuid: generateUuid(),
        animalId: lockedAnimalId || '',
        administeredDate: new Date().toISOString().slice(0, 10),
        manufacturer: lastManufacturer || '',
        batchNo: lastBatch || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaccination, lockedAnimalId]);

  useEffect(() => {
    if (!dueDateTouched && form.administeredDate) {
      const auto = addYears(form.administeredDate, 1);
      setForm((p) => ({ ...p, nextDueDate: auto }));
    }
  }, [form.administeredDate, dueDateTouched]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'nextDueDate') setDueDateTouched(true);
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        clientUuid: form.clientUuid,
        animalId: parseInt(form.animalId, 10),
        vaccineType: form.vaccineType,
        batchNo: form.batchNo,
        manufacturer: form.manufacturer,
        expiryDate: form.expiryDate,
        stickerQr: form.stickerQr,
        administeredDate: form.administeredDate,
        nextDueDate: form.nextDueDate,
      };

      let saved;
      if (isEdit) {
        saved = await vaccinationsApi.update(vaccination.id, payload);
        toast.success('Vaccination updated');
      } else {
        saved = await vaccinationsApi.create(payload);
        toast.success('Vaccination recorded');
      }

      // Remember manufacturer + batch for next time
      if (form.manufacturer) setLastManufacturer(form.manufacturer);
      if (form.batchNo) setLastBatch(form.batchNo);

      if (certFile && saved.id) {
        try {
          await vaccinationsApi.uploadCertificate(saved.id, certFile);
        } catch {
          toast.error('Certificate upload failed');
        }
      }

      onSaved(saved);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Edit Vaccination' : 'Record Vaccination'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {!lockedAnimalId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Animal *
              </label>
              <AnimalSelect
                value={form.animalId}
                onChange={(id) => setForm((p) => ({ ...p, animalId: id }))}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vaccine Type *
              </label>
              <select
                name="vaccineType"
                value={form.vaccineType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="RABIES">Rabies</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Batch No.
              </label>
              <input
                name="batchNo"
                value={form.batchNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Manufacturer
              </label>
              <input
                name="manufacturer"
                value={form.manufacturer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vaccine Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sticker QR / Batch ID{' '}
              <span className="text-xs text-slate-400">(scan later)</span>
            </label>
            <input
              name="stickerQr"
              value={form.stickerQr}
              onChange={handleChange}
              placeholder="e.g. QR-2024-XXXXXXXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Administered Date *
              </label>
              <input
                type="date"
                name="administeredDate"
                value={form.administeredDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Next Due Date
              </label>
              <input
                type="date"
                name="nextDueDate"
                value={form.nextDueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                Auto: 1 year after administration. Editable.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Certificate (PDF or image)
            </label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setCertFile(e.target.files?.[0] || null)}
              className="text-sm w-full"
            />
            <p className="text-xs text-slate-400 mt-1">Max 10MB</p>
          </div>

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
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}