import { useState, useEffect } from 'react';
import { ownersApi } from '../api/owners';
import { useAuth } from '../context/AuthContext';
import { SRI_LANKA_DISTRICTS } from '../utils/districts';
import toast from 'react-hot-toast';

const empty = {
  fullName: '',
  nic: '',
  phone: '',
  email: '',
  address: '',
  preferredLang: 'en',
  ownerType: 'PERSON',
  registrationNumber: '',
  contactPerson: '',
  district: '',
  authorityCode: '',
};

export default function OwnerFormModal({ owner, onClose, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const isEdit = !!owner;
  const isOrg = form.ownerType === 'ORGANIZATION';
  const canEditIdentity = ['DAPH_OFFICER', 'SUPER_ADMIN'].includes(user?.role);
  const identityLocked = isEdit && !canEditIdentity;

  const isAuthority =
    isOrg &&
    (form.authorityCode.trim() !== '' ||
      form.registrationNumber.toUpperCase().includes('-AW'));

  useEffect(() => {
    if (owner) {
      setForm({
        fullName: owner.fullName || '',
        nic: owner.nic || '',
        phone: owner.phone || '',
        email: owner.email || '',
        address: owner.address || '',
        preferredLang: owner.preferredLang || 'en',
        ownerType: owner.ownerType || 'PERSON',
        registrationNumber: owner.registrationNumber || '',
        contactPerson: owner.contactPerson || '',
        district: owner.district || '',
        authorityCode: owner.authorityCode || '',
      });
    } else {
      setForm(empty);
    }
  }, [owner]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      let result;
      if (isEdit) {
        result = await ownersApi.update(owner.id, form);
        toast.success('Owner updated');
      } else {
        result = await ownersApi.create(form);
        toast.success('Owner created');
      }
      onSaved(result);
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
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60]">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Edit Owner' : 'Add Owner'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            handleSubmit(e);
          }}
          className="p-4 md:p-6 space-y-4"
        >
          {identityLocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <span className="text-amber-600 text-sm">🔒</span>
              <p className="text-xs text-amber-800">
                <strong>Identity fields are locked.</strong> Only DAPH officers
                and Super Admins can change the name, NIC, registration, type,
                or authority code.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>
            <div className="flex flex-wrap gap-4">
              <label
                className={`flex items-center gap-2 ${
                  identityLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="ownerType"
                  value="PERSON"
                  checked={form.ownerType === 'PERSON'}
                  onChange={handleChange}
                  disabled={identityLocked}
                  className="accent-blue-600"
                />
                <span
                  className={`text-sm ${
                    identityLocked ? 'text-slate-400' : 'text-slate-700'
                  }`}
                >
                  Person
                </span>
              </label>
              <label
                className={`flex items-center gap-2 ${
                  identityLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="ownerType"
                  value="ORGANIZATION"
                  checked={form.ownerType === 'ORGANIZATION'}
                  onChange={handleChange}
                  disabled={identityLocked}
                  className="accent-blue-600"
                />
                <span
                  className={`text-sm ${
                    identityLocked ? 'text-slate-400' : 'text-slate-700'
                  }`}
                >
                  Organization / Authority
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {isOrg ? 'Organization Name *' : 'Full Name *'}
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              disabled={identityLocked}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isOrg ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Registration No. *
                </label>
                <input
                  name="registrationNumber"
                  value={form.registrationNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g. CMC-AW-2024"
                  disabled={identityLocked}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  NIC *
                </label>
                <input
                  name="nic"
                  value={form.nic}
                  onChange={handleChange}
                  required
                  placeholder="199012345678 or PASSPORT:XXX"
                  disabled={identityLocked}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Required. For foreign residents, use{' '}
                  <code className="bg-slate-100 px-1 rounded">PASSPORT:</code>{' '}
                  prefix.
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {isOrg && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Authority Code
              </label>
              <input
                name="authorityCode"
                value={form.authorityCode}
                onChange={handleChange}
                placeholder="e.g. CMC, KMC, KFGPS (leave blank for non-authority orgs)"
                disabled={identityLocked}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
              {isAuthority && (
                <p className="text-xs text-green-700 mt-1 bg-green-50 border border-green-200 rounded px-2 py-1">
                  🏛️ This owner will be treated as a local authority custodian
                  of stray animals.
                </p>
              )}
            </div>
          )}

          {isOrg && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                placeholder="Name of the person in charge"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              District *
            </label>
            <select
              name="district"
              value={form.district}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select district...</option>
              {SRI_LANKA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Preferred Language
            </label>
            <select
              name="preferredLang"
              value={form.preferredLang}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="si">සිංහල</option>
              <option value="ta">தமிழ்</option>
            </select>
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
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}