import { BrowserRouter, Routes, Route, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from './components/Navigation/Navigation';
import Footer from './components/Footer/footer';
import Homepage from './components/Home/home';
import Predictions from './pages/Predictions';
import PredictionDetail from './pages/PredictionDetail';
import Bookmakers from './pages/Bookmakers';
import Leagues from './pages/Leagues';
import LeagueDetail from './pages/LeagueDetail';
import MatchDetail from './pages/MatchDetail';
import MathPredictions from './pages/MathPredictions';
import LiveScore from './pages/LiveScore';
import Football from './pages/Football';
import Basketball from './pages/basketball';
import Tennis from './pages/Tennis';
import BestBettingapp from './pages/bestBettingapps';
import PopularLeagues from './pages/PopularLeagues';
import PopularMatches from './pages/PopularMatches';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import BlogAdmin from './pages/BlogAdmin';
import TranslationAdmin from './pages/TranslationAdmin';
import AdminLayout from './components/AdminLayout';
import { loadTranslations } from './utils/translationReplacer';


// Wrapper to intercept navigation and preserve language
function LanguageWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.origin === window.location.origin) {
        const urlMatch = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
        const langCode = urlMatch ? urlMatch[1] : '';
        
        if (langCode) {
          const targetPath = new URL(link.href).pathname;
          if (!targetPath.startsWith(`/${langCode}`)) {
            e.preventDefault();
            const newPath = `/${langCode}${targetPath}`;
            window.history.replaceState({}, '', newPath);
            navigate(newPath);
          }
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [navigate]);

  return children;
}

function App() {
  useEffect(() => {
    loadTranslations();
  }, []);
  return (
    <BrowserRouter>
      <LanguageWrapper>
        <Routes>
          {/* Public Routes - Wrapped in Main Layout with Header/Footer */}
          <Route element={
            <>
              <Navigation />
              <main style={{ minHeight: 'calc(100vh - 300px)' }}>
                <Outlet />
              </main>
              <Footer />
            </>
          }>
            <Route path="/" element={<LiveScore />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/popular-matches" element={<PopularMatches />} />
            <Route path="/bookmakers" element={<Bookmakers />} />
            <Route path="/competitions/" element={<Leagues />} />
            <Route path="/math-predictions" element={<MathPredictions />} />
            <Route path="/livescore" element={<LiveScore />} />
            <Route path="/predictions/football" element={<Football />} />
            <Route path="/predictions/basketball" element={<Basketball />} />
            <Route path="/predictions/tennis" element={<Tennis />} />
            <Route path="/ar/bookmakers" element={<BestBettingapp />} />
            <Route path="/prediction/:matchId" element={<PredictionDetail />} />
            <Route path="/league/:leagueId" element={<LeagueDetail />} />
            <Route path="/match/:matchId" element={<MatchDetail />} />
            <Route path="/league/:leagueId/old" element={<PopularLeagues />} />
            <Route path="/blogs" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />

            {/* Language-prefixed routes */}
            <Route path="/:lang/" element={<LiveScore />} />
            <Route path="/:lang/predictions" element={<Predictions />} />
            <Route path="/:lang/popular-matches" element={<PopularMatches />} />
            <Route path="/:lang/bookmakers" element={<Bookmakers />} />
            <Route path="/:lang/competitions/" element={<Leagues />} />
            <Route path="/:lang/math-predictions" element={<MathPredictions />} />
            <Route path="/:lang/livescore" element={<LiveScore />} />
            <Route path="/:lang/predictions/football" element={<Football />} />
            <Route path="/:lang/predictions/basketball" element={<Basketball />} />
            <Route path="/:lang/predictions/tennis" element={<Tennis />} />
            <Route path="/:lang/prediction/:matchId" element={<PredictionDetail />} />
            <Route path="/:lang/league/:leagueId" element={<LeagueDetail />} />
            <Route path="/:lang/match/:matchId" element={<MatchDetail />} />
            <Route path="/:lang/league/:leagueId/old" element={<PopularLeagues />} />
            <Route path="/:lang/blogs" element={<BlogList />} />
            <Route path="/:lang/blog/:slug" element={<BlogDetail />} />
          </Route>

          {/* Admin Routes - Wrapped in AdminLayout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard initialTab="matches" />} />
            <Route path="leagues" element={<AdminDashboard initialTab="leagues" />} />
            <Route path="blogs" element={<BlogAdmin />} />
            <Route path="translations" element={<TranslationAdmin />} />
          </Route>

          {/* Admin Login - No Layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </LanguageWrapper>
    </BrowserRouter>
  )
}

export default App
