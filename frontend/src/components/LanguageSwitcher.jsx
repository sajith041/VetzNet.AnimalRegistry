export default function LanguageSwitcher() {
  return (
    <div
      className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 opacity-60 cursor-not-allowed"
      title="Language support coming in v1.1 — English for pilot"
    >
      <span className="px-2 py-1 text-xs font-semibold rounded bg-white text-slate-800 shadow-sm">
        EN
      </span>
      <span className="px-2 py-1 text-xs text-slate-500">සිං</span>
      <span className="px-2 py-1 text-xs text-slate-500">தமி</span>
    </div>
  );
}