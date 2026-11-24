/**
 * Convert an array of objects to CSV and trigger a download.
 * @param {Array<Object>} data - array of rows
 * @param {Array<{key: string, label: string}>} columns - column defs
 * @param {string} filename - e.g. 'overdue.csv'
 */
export function exportCsv(data, columns, filename = 'export.csv') {
  if (!data || !data.length) return;

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const rows = data.map((row) =>
    columns.map((c) => escape(row[c.key])).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}