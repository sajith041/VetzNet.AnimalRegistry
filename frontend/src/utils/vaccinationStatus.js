/**
 * Compute vaccination status from nextDueDate.
 * Returns: 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE' | 'UNKNOWN'
 */
export function getVaccinationStatus(nextDueDate) {
  if (!nextDueDate) return 'UNKNOWN';

  const due = new Date(nextDueDate);
  const today = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);

  if (due < today) return 'OVERDUE';
  if (due <= in30) return 'DUE_SOON';
  return 'UP_TO_DATE';
}

export const STATUS_STYLES = {
  OVERDUE:    { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Overdue' },
  DUE_SOON:   { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Due soon' },
  UP_TO_DATE: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Up to date' },
  UNKNOWN:    { bg: 'bg-slate-100',  text: 'text-slate-600',  label: 'Unknown' },
};