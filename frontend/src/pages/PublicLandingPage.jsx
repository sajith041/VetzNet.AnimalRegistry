import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicLandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50">
      {/* Header */}
      <header className="px-4 md:px-8 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐾</span>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">
              Microchip Registry
            </h1>
            <p className="text-xs text-slate-500">
              Sri Lanka Companion Animal ID
            </p>
          </div>
        </div>
        <Link
          to="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Staff Login
        </Link>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20 text-center">
        <div className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          DAPH Pilot · Phase 1
        </div>

        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4 leading-tight">
          A national identification system for Sri Lanka's companion animals
        </h2>

        <p className="text-base md:text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          The Microchip Registry is being piloted by the Department of Animal
          Production and Health to track microchipped companion animals,
          coordinate rabies vaccination, and reunite lost animals with their
          owners.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            🔐 Staff Login
          </Link>
          <a
            href="#about"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-6 py-3 rounded-lg font-medium"
          >
            Learn More
          </a>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-3xl mb-3">📡</div>
            <h3 className="font-bold text-slate-800 mb-1">
              Microchip registry
            </h3>
            <p className="text-sm text-slate-600">
              Every chipped dog and cat has a unique, traceable record for
              lifetime identification.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-3xl mb-3">💉</div>
            <h3 className="font-bold text-slate-800 mb-1">
              Rabies vaccination tracking
            </h3>
            <p className="text-sm text-slate-600">
              Certificates linked to microchip IDs, so proof of vaccination
              travels with the animal.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-3xl mb-3">🏛️</div>
            <h3 className="font-bold text-slate-800 mb-1">
              For vets and authorities
            </h3>
            <p className="text-sm text-slate-600">
              Field vets and DAPH officers use one system for registration,
              transfers, and reporting.
            </p>
          </div>
        </div>

        {/* About */}
        <div
          id="about"
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-left max-w-2xl mx-auto"
        >
          <h3 className="text-xl font-bold text-slate-800 mb-3">
            About the pilot
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            The Microchip Registry is currently in a controlled pilot phase with
            participating veterinary clinics and DAPH offices. Registration is
            free during the pilot. Data is protected under the Data Protection
            Act and only accessible to authorized staff.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-slate-700">
                Free registration during pilot
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-slate-700">
                Lifetime microchip record
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-slate-700">
                Rabies certificate tracking
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-slate-700">
                Ownership transfer audit trail
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Coming soon: Public animal lookup · Lost & found reporting ·
              Digital vaccination certificates
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600 mb-1">
            Questions or want your clinic to join?
          </p>
          <p className="text-sm text-slate-800 font-medium">
            📧 daph@daph.gov.lk · 📞 +94 11 XXX XXXX
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Department of Animal Production & Health, Sri Lanka
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center text-xs text-slate-500">
          <p>
            🐾 Microchip Registry · DAPH Pilot v0.1 ·{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Staff Login
            </Link>
          </p>
          <p className="mt-2">
            Data protected under the Data Protection Act · Access is logged
          </p>
        </div>
      </footer>
    </div>
  );
}