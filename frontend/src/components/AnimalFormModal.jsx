import { useState, useEffect } from 'react';
import { animalsApi } from '../api/animals';
import SpeciesSelect from './SpeciesSelect';
import OwnerSelect from './OwnerSelect';
import { usePreference } from '../hooks/usePreference';
import toast from 'react-hot-toast';
import { fileUrl } from '../api/client';
import { useDeviceLocation } from '../hooks/useDeviceLocation';

function generateUuid() {
  return (
    'ani-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 12)
  );
}

const empty = {
  clientUuid: '',
  name: '',
  speciesId: '',
  breed: '',
  dob: '',
  sex: 'UNKNOWN',
  color: '',
  currentOwnerId: '',
  status: 'ACTIVE',
  chipRequirement: 'REQUIRED',
  location: '',
  sterilizationStatus: '',
};

export default function AnimalFormModal({
  animal,
  initialChipNumber,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [chipNumber, setChipNumber] = useState('');
  const isEdit = !!animal;
  const [lastSpecies, setLastSpecies] = usePreference('lastSpecies', '');

  const deviceLoc = useDeviceLocation();

  // New animal: capture the device location when the form opens
  useEffect(() => {
    if (!animal) deviceLoc.request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal]);

  // Values shown in the read-only fields
  const lat = isEdit ? animal.latitude : deviceLoc.coords?.lat;
  const lng = isEdit ? animal.longitude : deviceLoc.coords?.lng;
  const showCoord = (v) => (typeof v === 'number' ? v.toFixed(6) : '');

  useEffect(() => {
    if (animal) {
      setForm({
        clientUuid: animal.clientUuid || '',
        name: animal.name || '',
        speciesId: animal.speciesId || '',
        breed: animal.breed || '',
        dob: animal.dob ? animal.dob.slice(0, 10) : '',
        sex: animal.sex || 'UNKNOWN',
        color: animal.color || '',
        currentOwnerId: animal.currentOwnerId || '',
        status: animal.status || 'ACTIVE',
        chipRequirement: animal.chipRequirement || 'REQUIRED',
        location: animal.location || '',
        sterilizationStatus: animal.sterilizationStatus || '',
      });
      if (animal.photoUrl) {
        setPhotoPreview(
          // `http://${window.location.hostname}:4000${animal.photoUrl}`
          fileUrl(animal.photoUrl)
        );
        let tt = fileUrl(animal.photoUrl);
        console.log(photoPreview)
      }
      // setChipNumber('');
      setChipNumber(animal.microchip?.chipNumber || '');
    } else {
      setForm({
        ...empty,
        clientUuid: generateUuid(),
        speciesId: lastSpecies || '',
      });
      setChipNumber(initialChipNumber || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal, initialChipNumber]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        clientUuid: form.clientUuid,
        name: form.name,
        speciesId: parseInt(form.speciesId, 10),
        breed: form.breed,
        dob: form.dob,
        sex: form.sex,
        color: form.color,
        currentOwnerId: parseInt(form.currentOwnerId, 10),
        status: form.status,
        chipRequirement: form.chipRequirement,
        location: form.location,
        sterilizationStatus: form.sterilizationStatus,
      };

      if (!isEdit && deviceLoc.coords) {
        payload.latitude = deviceLoc.coords.lat;
        payload.longitude = deviceLoc.coords.lng;
      }

      let saved;
      if (isEdit) {
        saved = await animalsApi.update(animal.id, payload);
        toast.success('Animal updated');
      } else {
        saved = await animalsApi.create(payload);
        toast.success('Animal registered');
        if (form.speciesId) setLastSpecies(form.speciesId);
      }

      // Upload photo if selected
      if (photoFile && saved.id) {
        try {
          await animalsApi.uploadPhoto(saved.id, photoFile);
        } catch {
          toast.error('Photo upload failed');
        }
      }

      // Attach chip if chip number was provided on create
      if (!isEdit && chipNumber.trim() && saved.id) {
        try {
          await animalsApi.attachMicrochip(saved.id, {
            chipNumber: chipNumber.trim(),
            implantDate: '',
            implantLocation: '',
          });
          toast.success('Microchip attached');
        } catch (err) {
          toast.error(
            err.response?.data?.error ||
            'Animal saved but chip attach failed — attach manually'
          );
        }
      }

       // Change chip number on edit
       const newChip = chipNumber.trim();
       const oldChip = animal?.microchip?.chipNumber || '';
       if (isEdit && newChip && newChip !== oldChip) {
         try {
           await animalsApi.updateMicrochip(animal.id, newChip);
           toast.success('Microchip number updated');
         } catch (err) {
           toast.error(err.response?.data?.error || 'Animal saved but chip number update failed');
         }
       }

      onSaved(saved);
    } catch (err) {
      const details = err.response?.data?.details;
      if (details && details.length) {
        toast.error(details[0].message);
      } else {
        toast.error(err.response?.data?.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Edit Animal' : 'Register New Animal'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {/* Microchip + Pet Name + Photo */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Microchip + Pet Name (left) */}
            <div className="flex-1 min-w-0 space-y-4 order-2 sm:order-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Microchip Number
                </label>
                <input
                  value={chipNumber}
                  onChange={(e) => setChipNumber(e.target.value)}
                  placeholder="Type, scan, or leave blank"
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {isEdit && (
                  <p className="text-xs text-slate-500 mt-1">
                    Changing this updates the animal's registered chip number.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pet Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Rex, Luna, Brownie (optional)"
                  maxLength={50}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Optional — leave blank for stray or unnamed animals
                </p>
              </div>
            </div>

            {/* Photo (right) */}
            <div className="flex-shrink-0 flex flex-col items-center order-1 sm:order-2">
              <label className="block text-sm font-medium text-slate-700 mb-1 self-start sm:self-auto">
                Photo
              </label>
              <label className="w-28 h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-4xl cursor-pointer hover:border-blue-400 hover:bg-slate-50 transition">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>🐾</span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhoto}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-400 mt-1 text-center w-36">
                Click to {photoPreview ? 'change' : 'upload'} · JPEG, PNG, WebP · max 5MB
              </p>
            </div>
          </div>

          {/* Species + Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Species *
              </label>
              <SpeciesSelect
                value={form.speciesId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, speciesId: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Owner {!isEdit && '*'}
              </label>
              {isEdit ? (
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-700">
                    {animal.currentOwner?.fullName || 'No owner'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    To change ownership, use "Transfer" on the detail page.
                  </p>
                </div>
              ) : (
                <OwnerSelect
                  value={form.currentOwnerId}
                  onChange={(id) =>
                    setForm((p) => ({ ...p, currentOwnerId: id }))
                  }
                  required
                />
              )}
            </div>
          </div>

          {/* Breed + Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Breed
              </label>
              <input
                name="breed"
                value={form.breed}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Color
              </label>
              <input
                name="color"
                value={form.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Location + Sterilization Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sterilization Status
              </label>
              <select
                name="sterilizationStatus"
                value={form.sterilizationStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-</option>
                <option value="Intact">Intact</option>
                <option value="Neutered">Neutered</option>
              </select>
            </div>
          </div>

          {/* DOB + Sex */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sex
              </label>
              <select
                name="sex"
                value={form.sex}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          {/* Chip Requirement */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Chip Requirement
            </label>
            <select
              name="chipRequirement"
              value={form.chipRequirement}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="REQUIRED">
                Required (licensing, breeding, import)
              </option>
              <option value="PROVISIONAL">
                Provisional (rural/stray — chip within 1 year)
              </option>
              <option value="OPTIONAL">Optional</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              REQUIRED animals must be chipped before a rabies certificate is
              issued
            </p>
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="DECEASED">Deceased</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          )}
          {/* Device location (read-only) */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                <input
                  value={showCoord(lat)}
                  readOnly
                  disabled
                  placeholder={!isEdit && deviceLoc.status === 'loading' ? 'Getting location…' : '—'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                <input
                  value={showCoord(lng)}
                  readOnly
                  disabled
                  placeholder={!isEdit && deviceLoc.status === 'loading' ? 'Getting location…' : '—'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
            {!isEdit && deviceLoc.status === 'ok' && (
              <p className="text-xs text-slate-500 mt-1">Captured from this device (±{deviceLoc.coords.accuracy} m)</p>
            )}
            {!isEdit && deviceLoc.status === 'error' && (
              <p className="text-xs text-red-600 mt-1">{deviceLoc.error}</p>
            )}
            {isEdit && lat == null && (
              <p className="text-xs text-slate-500 mt-1">No location was recorded for this animal.</p>
            )}
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
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}