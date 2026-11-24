import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLandingPage from './pages/PublicLandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import OwnersPage from './pages/OwnersPage';
import AnimalsPage from './pages/AnimalsPage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import VaccinationsPage from './pages/VaccinationsPage';
import ReportsPage from './pages/ReportsPage';
import VetsPage from './pages/VetsPage';
import UsersPage from './pages/UsersPage';
import LookupPage from './pages/LookupPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="owners" element={<OwnersPage />} />
            <Route path="animals" element={<AnimalsPage />} />
            <Route path="animals/:id" element={<AnimalDetailPage />} />
            <Route path="vaccinations" element={<VaccinationsPage />} />
            <Route path="lookup" element={<LookupPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="vets" element={<VetsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}