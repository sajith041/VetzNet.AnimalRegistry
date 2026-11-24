import { useState, useEffect } from 'react';
import { reportsApi } from '../api/stats';
import { exportCsv } from '../utils/exportCsv';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'all', label: '🐾 All Animals' },
  { key: 'overdue', label: '⚠️ Overdue Animals' },
  { key: 'chip', label: '📡 Chip Compliance' },
  { key: 'coverage', label: '💉 Vaccination Coverage' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('all');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData([]);
    const fetch =
    tab==='all'?reportsApi.all:
      tab === 'overdue'
        ? reportsApi.overdue
        : tab === 'chip'
        ? reportsApi.chipCompliance
        : reportsApi.coverage;

    fetch()
      .then(setData)
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [tab]);

  function handleExport() {
    if (!data.length) {
      toast.error('No data to export');
      return;
    }

    if (tab === 'all') {
      exportCsv(
        data,
        [
          { key: 'animalName', label: 'Name' },
          { key: 'species', label: 'Species' },
          { key: 'breed', label: 'Breed' },
          { key: 'ownerName', label: 'Owner' },
          { key: 'ownerPhone', label: 'Owner Contact' },
          { key: 'chipNumber', label: 'Microchip ID' },
          { key: 'location', label: 'Location' },
          { key: 'sterilizationStatus', label: 'Sterilization Status' },
          { key: 'createdBy', label: 'Created By' },
          { key: 'createdAt', label: 'Created On' },
        ],
        `All-Animals-${new Date().toISOString().slice(0, 10)}.csv`
      );
    } else if (tab === 'overdue') {
      exportCsv(
        data,
        [
          { key: 'animalName', label: 'Animal' },
          { key: 'species', label: 'Species' },
          { key: 'breed', label: 'Breed' },
          { key: 'chipNumber', label: 'Chip' },
          { key: 'ownerName', label: 'Owner' },
          { key: 'ownerPhone', label: 'Phone' },
          { key: 'district', label: 'District' },
          { key: 'vaccineType', label: 'Vaccine' },
          { key: 'administeredDate', label: 'Administered' },
          { key: 'nextDueDate', label: 'Due' },
          { key: 'daysOverdue', label: 'Days Overdue' },
        ],
        `overdue-${new Date().toISOString().slice(0, 10)}.csv`
      );
    } else if (tab === 'chip') {
      exportCsv(
        data,
        [
          { key: 'animalName', label: 'Animal' },
          { key: 'species', label: 'Species' },
          { key: 'breed', label: 'Breed' },
          { key: 'ownerName', label: 'Owner' },
          { key: 'ownerPhone', label: 'Phone' },
          { key: 'district', label: 'District' },
          { key: 'registeredAt', label: 'Registered' },
        ],
        `chip-compliance-${new Date().toISOString().slice(0, 10)}.csv`
      );
    } else {
      exportCsv(
        data,
        [
          { key: 'district', label: 'District' },
          { key: 'totalAnimals', label: 'Total Animals' },
          { key: 'upToDate', label: 'Up to Date' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'coveragePct', label: 'Coverage %' },
        ],
        `coverage-${new Date().toISOString().slice(0, 10)}.csv`
      );
    }
    toast.success('Report exported');
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports</h2>
          <p className="text-sm text-slate-500">
            Data for DAPH review and analysis
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={!data.length}
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-medium self-start sm:self-auto"
        >
          📥 Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 overflow-x-auto">
          <div className="flex">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  tab === t.key
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading report...</div>
        ) : data.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            {tab === 'overdue' && '✅ No overdue vaccinations. Excellent!'}
            {tab === 'chip' && '✅ All required animals are chipped. Great work!'}
            {tab === 'coverage' && 'No coverage data yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {tab === 'all' && <AllAnimalsTable data={data} />}
            {tab === 'overdue' && <OverdueTable data={data} />}
            {tab === 'chip' && <ChipComplianceTable data={data} />}
            {tab === 'coverage' && <CoverageTable data={data} />}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-slate-400">
        Last updated: {new Date().toLocaleString()} ·{' '}
        {data.length} record{data.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function AllAnimalsTable({ data }) {
  return (
    <table className="w-full min-w-[900px]">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Name
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Species/Breed 
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
          Created By
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Created On
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((v) => (
          <tr key={v.animalId} className="border-b border-slate-100">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-800">{v.animalName}</p>
            </td>
            <td className="px-4 py-3">
              <p className="font-medium text-slate-800">{v.species}</p>
              <p className="text-xs text-slate-500">
                 {v.breed || '—'}
              </p>
            </td>
         
            <td className="px-4 py-3 text-slate-700">
              {v.ownerName || '—'}
              {v.ownerPhone && (
                <p className="text-xs text-slate-500">{v.ownerPhone}</p>
              )}
            </td>
            <td className="px-4 py-3 text-slate-600">{v.chipNumber || '—'}</td>
            <td className="px-4 py-3 text-slate-600">{v.location || '—'}</td>
            <td className="px-4 py-3 text-slate-600">{v.sterilizationStatus || '—'}</td>
            <td className="px-4 py-3 text-slate-600">{v.createdBy || '—'}</td>
            <td className="px-4 py-3 text-slate-600">{v.createdAt || '—'}</td>
           
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OverdueTable({ data }) {
  return (
    <table className="w-full min-w-[900px]">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Animal
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Owner
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            District
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Vaccine
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Due Date
          </th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Days Overdue
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((v) => (
          <tr key={v.vaccinationId} className="border-b border-slate-100">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-800">{v.animalName}</p>
              <p className="text-xs text-slate-500">
                {v.species} · {v.breed || '—'}
              </p>
            </td>
            <td className="px-4 py-3 text-slate-700">
              {v.ownerName || '—'}
              {v.ownerPhone && (
                <p className="text-xs text-slate-500">{v.ownerPhone}</p>
              )}
            </td>
            <td className="px-4 py-3 text-slate-600">{v.district || '—'}</td>
            <td className="px-4 py-3 text-slate-600">{v.vaccineType}</td>
            <td className="px-4 py-3 text-slate-600">
              {new Date(v.nextDueDate).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-right">
              <span className="bg-red-100 text-red-700 font-semibold px-2 py-1 rounded text-sm">
                {v.daysOverdue} days
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChipComplianceTable({ data }) {
  return (
    <table className="w-full min-w-[700px]">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Animal
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Owner
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            District
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Registered
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((a) => (
          <tr key={a.animalId} className="border-b border-slate-100">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-800">{a.animalName}</p>
              <p className="text-xs text-slate-500">
                {a.species} · {a.breed || '—'}
              </p>
            </td>
            <td className="px-4 py-3 text-slate-700">
              {a.ownerName || '—'}
              {a.ownerPhone && (
                <p className="text-xs text-slate-500">{a.ownerPhone}</p>
              )}
            </td>
            <td className="px-4 py-3 text-slate-600">{a.district || '—'}</td>
            <td className="px-4 py-3 text-slate-600">
              {new Date(a.registeredAt).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CoverageTable({ data }) {
  return (
    <table className="w-full min-w-[600px]">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            District
          </th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Total Animals
          </th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Up to Date
          </th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Overdue
          </th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Coverage %
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.district} className="border-b border-slate-100">
            <td className="px-4 py-3 font-medium text-slate-800">
              {d.district}
            </td>
            <td className="px-4 py-3 text-right text-slate-600">
              {d.totalAnimals}
            </td>
            <td className="px-4 py-3 text-right text-green-700 font-medium">
              {d.upToDate}
            </td>
            <td className="px-4 py-3 text-right text-red-600 font-medium">
              {d.overdue}
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-2">
                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      d.coveragePct >= 80
                        ? 'bg-green-500'
                        : d.coveragePct >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${d.coveragePct}%` }}
                  />
                </div>
                <span className="font-semibold text-slate-800 w-12 text-right">
                  {d.coveragePct}%
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}