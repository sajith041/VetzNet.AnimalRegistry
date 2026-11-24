import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ownersApi } from '../api/owners';
import OwnerFormModal from './OwnerFormModal';
import toast from 'react-hot-toast';

export default function OwnerSelect({ value, onChange, required = false }) {
  const [owners, setOwners] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const wrapperRef = useRef(null);

  function reload() {
    setLoading(true);
    ownersApi
      .list({ limit: 100 })
      .then((res) => setOwners(res.data))
      .catch(() => setOwners([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = owners.find((o) => o.id === value);

  const filtered = query
    ? owners.filter((o) => {
        const q = query.toLowerCase();
        return (
          o.fullName?.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q) ||
          o.nic?.toLowerCase().includes(q) ||
          o.registrationNumber?.toLowerCase().includes(q) ||
          o.authorityCode?.toLowerCase().includes(q)
        );
      })
    : owners;

  function selectOwner(o) {
    onChange(o.id);
    setQuery('');
    setOpen(false);
  }

  function clearSelection() {
    onChange('');
    setQuery('');
    setOpen(true);
  }

  function handleOwnerCreated(newOwner) {
    setShowNewModal(false);
    reload();
    onChange(newOwner.id);
    toast.success(`Owner created: ${newOwner.fullName}`);
  }

  return (
    <div ref={wrapperRef} className="relative">
      {selected && !open ? (
        <div
          onClick={() => setOpen(true)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 flex items-center justify-between"
        >
          <div className="min-w-0">
            <p className="text-sm text-slate-800 truncate">
              {selected.fullName}
              {selected.ownerType === 'ORGANIZATION' && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                  {selected.authorityCode ? 'AUTHORITY' : 'ORG'}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {selected.phone ||
                selected.nic ||
                selected.registrationNumber ||
                ''}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
            className="text-slate-400 hover:text-red-500 ml-2 text-lg"
          >
            ×
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={
            loading
              ? 'Loading owners...'
              : 'Search by name, phone, NIC, or authority code...'
          }
          disabled={loading}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      )}

      {open && !selected && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              setShowNewModal(true);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-200 bg-blue-50/50"
          >
            <p className="text-sm font-semibold text-blue-700">
              + Add New Owner
            </p>
            <p className="text-xs text-blue-600">
              Create a person, organization, or local authority
            </p>
          </button>

          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-400 text-center">
              No matching owners
            </div>
          ) : (
            filtered.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => selectOwner(o)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
              >
                <p className="text-sm text-slate-800">
                  {o.fullName}
                  {o.ownerType === 'ORGANIZATION' && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      {o.authorityCode ? 'AUTHORITY' : 'ORG'}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {[o.phone, o.nic || o.registrationNumber]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </button>
            ))
          )}
        </div>
      )}

      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{
            position: 'absolute',
            opacity: 0,
            height: 0,
            width: 0,
            pointerEvents: 'none',
          }}
          value={value || ''}
          required
          onChange={() => {}}
        />
      )}

      {showNewModal &&
        createPortal(
          <OwnerFormModal
            owner={null}
            onClose={() => setShowNewModal(false)}
            onSaved={handleOwnerCreated}
          />,
          document.body
        )}
    </div>
  );
}