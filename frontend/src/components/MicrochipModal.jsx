import { useState, useCallback, useRef, useEffect } from 'react';
import { animalsApi } from '../api/animals';
import useScannerInput from '../hooks/useScannerInput';
import toast from 'react-hot-toast';

export default function MicrochipModal({ animal, onClose, onSaved }) {
  const [chipNumber, setChipNumber] = useState('');
  const [implantDate, setImplantDate] = useState('');
  const [implantLocation, setImplantLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [scanMode, setScanMode] = useState(true);
  const inputRef = useRef(null);

  const handleScan = useCallback((code) => {
    setChipNumber(code);
    toast.success(`Scanned: ${code}`);
  }, []);

  useScannerInput(handleScan, { enabled: scanMode, minLength: 9 });

  useEffect(() => {
    // Auto-focus on desktop only — mobile keyboard popping up is disruptive
    if (window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = chipNumber.trim();
    if (!trimmed) {
      toast.error('Enter or scan a chip number');
      return;
    }
    setSaving(true);
    try {
      await animalsApi.attachMicrochip(animal.id, {
        chipNumber: trimmed,
        implantDate,
        implantLocation,
      });
      toast.success('Microchip attached');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to attach chip');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-800">Attach Microchip</h3>
            <p className="text-xs text-slate-500 truncate">
              {animal.species?.name} · {animal.breed || 'Unknown breed'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none p-1 ml-2"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {/* Scan mode toggle */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">
                Scanner mode {scanMode ? 'ON' : 'OFF'}
              </p>
              <p className="text-xs text-slate-500">
                {scanMode
                  ? 'Ready — scan the chip or type below'
                  : 'Scanner ignored — type only'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setScanMode((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-2 flex-shrink-0 ${
                scanMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform bg-white rounded-full transition-transform ${
                  scanMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Chip number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Chip Number *
            </label>
            <input
              ref={inputRef}
              type="text"
              value={chipNumber}
              onChange={(e) => setChipNumber(e.target.value)}
              placeholder="Type or scan (e.g. 985112345678901)"
              autoComplete="off"
              inputMode="numeric"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              ISO 11784 · 15 digits (or up to 20 chars)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Implant Date
            </label>
            <input
              type="date"
              value={implantDate}
              onChange={(e) => setImplantDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Implant Location
            </label>
            <input
              type="text"
              value={implantLocation}
              onChange={(e) => setImplantLocation(e.target.value)}
              placeholder="Between shoulder blades"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
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
              {saving ? 'Attaching...' : 'Attach Chip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}