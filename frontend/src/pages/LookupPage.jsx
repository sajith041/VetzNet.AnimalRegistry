import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { animalsApi } from '../api/animals';
import useScannerInput from '../hooks/useScannerInput';
import AnimalFormModal from '../components/AnimalFormModal';
import toast from 'react-hot-toast';
import { fileUrl } from '../api/client';

export default function LookupPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [scanMode, setScanMode] = useState(true);
  const [registerWithChip, setRegisterWithChip] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleScan = useCallback((code) => {
    setQuery(code);
    toast.success(`Scanned: ${code}`);
    doSearch(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useScannerInput(handleScan, { enabled: scanMode, minLength: 9 });

  useEffect(() => {
    if (window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  }, []);

  async function doSearch(term) {
    const value = (term ?? query).trim();
    if (!value) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await animalsApi.list({ search: value, limit: 20 });
      setResults(res.data);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    doSearch();
  }

  function handleResultClick(animal) {
    navigate(`/dashboard/animals/${animal.id}`);
  }

  function handleRegisterWithChip() {
    setRegisterWithChip(query.trim());
  }

  function handleRegistered() {
    setRegisterWithChip(null);
    toast.success('Animal registered! Redirecting...');
    // Re-search with same chip → should now find the newly created animal
    setTimeout(() => doSearch(), 300);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Scan & Lookup</h2>
        <p className="text-sm text-slate-500">
          Scan a microchip or type a chip number, name, or owner
        </p>
      </div>

      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700">
            Scanner mode {scanMode ? 'ON' : 'OFF'}
          </p>
          <p className="text-xs text-slate-500">
            {scanMode
              ? 'Ready — scan a chip or type below'
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

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Scan or type chip / name / owner..."
          autoComplete="off"
          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-lg font-medium"
        >
          {searching ? '...' : 'Search'}
        </button>
      </form>

      {hasSearched && (
        <>
          {searching ? (
            <div className="text-center py-8 text-slate-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                No animals found
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                No animal matches "{query}".
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={handleRegisterWithChip}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  + Register New Animal with this chip
                </button>
                <Link
                  to="/dashboard/animals"
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Browse All Animals
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-500 mb-2">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleResultClick(a)}
                  className="w-full text-left bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:border-blue-400 hover:shadow transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
                      {a.photoUrl ? (
                        <img
                        src={fileUrl(a.photoUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>🐾</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {a.name || 'Unnamed'}
                        <span className="text-slate-400 font-normal ml-2 text-sm">
                          · {a.species?.name}
                          {a.breed ? ` · ${a.breed}` : ''}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {a.currentOwner?.fullName || 'No owner'}
                      </p>
                      {a.microchip && (
                        <p className="text-xs font-mono text-green-700 mt-0.5">
                          📡 {a.microchip.chipNumber}
                        </p>
                      )}
                    </div>
                    <span className="text-slate-400 flex-shrink-0">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {!hasSearched && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">📱</div>
          <h3 className="font-bold text-blue-900 mb-1">Ready to scan</h3>
          <p className="text-sm text-blue-700">
            Point your scanner at the animal's microchip, or type a number above.
          </p>
        </div>
      )}

      {registerWithChip && (
        <AnimalFormModal
          initialChipNumber={registerWithChip}
          onClose={() => setRegisterWithChip(null)}
          onSaved={handleRegistered}
        />
      )}
    </div>
  );
}