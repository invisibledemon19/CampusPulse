import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Discover from './pages/Discover.jsx';
import { getMode, subscribeAuth } from './services/index.js';

const Login = lazy(() => import('./pages/Login.jsx'));
const Nearby = lazy(() => import('./pages/Nearby.jsx'));
const MyOpportunities = lazy(() => import('./pages/MyOpportunities.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const OpportunityDetail = lazy(() => import('./pages/OpportunityDetail.jsx'));
const SubmitOpportunity = lazy(() => import('./pages/SubmitOpportunity.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function StaticSkeletonFallback() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8" role="status" aria-label="Loading page">
      <div className="w-64 h-8 bg-[var(--color-line)] rounded-[var(--radius-control)] mb-4" />
      <div className="w-full max-w-lg h-4 bg-[var(--color-line)] rounded-[var(--radius-control)] mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-44 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
        <div className="h-44 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}

function AppContent() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();
  const isDemo = getMode() === 'demo';

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  if (initialLoading) {
    return <LoadingScreen onComplete={() => setInitialLoading(false)} />;
  }

  const isGuest = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('campusplus:guest') === 'true';
  const isPublicPage = ['/terms', '/privacy', '/login'].includes(location.pathname);
  const shouldRequireLogin = authChecked && !currentUser && !isGuest && !isPublicPage;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {isDemo && <DemoBanner />}
      <Navbar />

      <main id="main" className="flex-1 pb-20 sm:pb-8">
        <Suspense fallback={<StaticSkeletonFallback />}>
          {shouldRequireLogin ? (
            <Navigate to="/login" replace />
          ) : (
            <Routes>
              <Route path="/" element={<Discover />} />
              <Route path="/login" element={<Login />} />
              <Route path="/nearby" element={<Nearby />} />
              <Route path="/my-opportunities" element={<MyOpportunities />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/opportunity/:id" element={<OpportunityDetail />} />
              <Route path="/submit" element={<SubmitOpportunity />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
