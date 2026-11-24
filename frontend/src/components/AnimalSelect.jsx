import { useState, useEffect, useRef } from 'react';
import { animalsApi } from '../api/animals';

export default function AnimalSelect({ value, onChange, required = false }) {
  const [animals, setAnimals] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef(null);

  useEffect(() => {
    animalsApi
      .list({ limit: 100 })
      .then((res) => setAnimals(res.data))
      .catch(() => setAnimals([]))
      .finally(() => setLoading(false));
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

  const selected = animals.find((a) => a.id === value);

  const filtered = query
    ? animals.filter((a) => {
        const q = query.toLowerCase();
        return (
          a.name?.toLowerCase().includes(q) ||
          a.breed?.toLowerCase().includes(q) ||
          a.microchip?.chipNumber?.toLowerCase().includes(q) ||
          a.currentOwner?.fullName?.toLowerCase().includes(q)
        );
      })
    : animals;

  function pick(a) {
    onChange(a.id);
    setQuery('');
    setOpen(false);
  }

  function clear() {
    onChange('');
    setQuery('');
    setOpen(true);
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
              {selected.name || 'Unnamed'}{' '}
              <span className="text-xs text-slate-500">
                · {selected.species?.name} · {selected.breed || '—'}
              </span>
            </p>
            <p className="text-xs text-slate-500 truncate">
              {selected.currentOwner?.fullName}
              {selected.microchip?.chipNumber &&
                ` · ${selected.microchip.chipNumber}`}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clear();
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
          placeholder={loading ? 'Loading animals...' : 'Search by name, chip, or owner...'}
          disabled={loading}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      )}

      {open && !selected && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-400 text-center">
              No animals found
            </div>
          ) : (
            filtered.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => pick(a)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
              >
                <p className="text-sm text-slate-800">
                  {a.name || 'Unnamed'}{' '}
                  <span className="text-xs text-slate-500">
                    · {a.species?.name}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {a.currentOwner?.fullName || 'No owner'}
                  {a.microchip?.chipNumber && ` · ${a.microchip.chipNumber}`}
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
          style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
          value={value || ''}
          required
          onChange={() => {}}
        />
      )}
    </div>
  );
}