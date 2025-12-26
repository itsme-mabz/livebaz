import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
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
import AdminLayout from './components/AdminLayout';


function App() {
  return (
    <BrowserRouter>
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
        </Route>

        {/* Admin Routes - Wrapped in AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard initialTab="matches" />} />
          <Route path="leagues" element={<AdminDashboard initialTab="leagues" />} />
          <Route path="blogs" element={<BlogAdmin />} />
        </Route>

        {/* Admin Login - No Layout */}
        <Route path="/admin/login" element={<AdminLogin />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
