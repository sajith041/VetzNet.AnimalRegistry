import { useState } from 'react';
import { transfersApi } from '../api/transfers';
import OwnerSelect from './OwnerSelect';
import toast from 'react-hot-toast';

export default function TransferModal({ animal, onClose, onTransferred }) {
  const [toOwnerId, setToOwnerId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!toOwnerId) {
      toast.error('Please select the new owner');
      return;
    }
    setSaving(true);
    try {
      await transfersApi.transfer(animal.id, {
        toOwnerId: parseInt(toOwnerId, 10),
        transferReason: reason,
      });
      toast.success('Ownership transferred');
      onTransferred();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-800">Transfer Ownership</h3>
            <p className="text-xs text-slate-500 truncate">
              {animal.name || 'Unnamed'} · currently owned by{' '}
              {animal.currentOwner?.fullName || '—'}
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            This action permanently records the transfer in the animal's history.
            It cannot be undone, but can be reversed with another transfer.
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Owner *
            </label>
            <OwnerSelect value={toOwnerId} onChange={setToOwnerId} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Sold, rehomed, moved abroad"
              maxLength={200}
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-lg"
            >
              {saving ? 'Transferring...' : 'Transfer Ownership'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}