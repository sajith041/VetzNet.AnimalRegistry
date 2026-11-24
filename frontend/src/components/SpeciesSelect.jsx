import { useEffect, useState } from 'react';
import { speciesApi } from '../api/species';

export default function SpeciesSelect({ value, onChange, required = false }) {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    speciesApi
      .list()
      .then(setSpecies)
      .catch(() => setSpecies([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <select
        disabled
        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
      >
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={onChange}
      required={required}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      <option value="">Select species...</option>
      {species.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name} · {s.nameSi} · {s.nameTa}
        </option>
      ))}
    </select>
  );
}