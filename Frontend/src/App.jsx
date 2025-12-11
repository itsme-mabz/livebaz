import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';


function App() {
  return (
    <BrowserRouter>
      <Navigation />

      <Routes>
        <Route path="/" element={<LiveScore />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/bookmakers" element={<Bookmakers />} />
        <Route path="/competitions/" element={<Leagues />} />
        <Route path="/math-predictions" element={<MathPredictions />} />
        <Route path="/livescore" element={<LiveScore />} />
        <Route path="/predictions/football" element={<Football />} />
        <Route path="/predictions/basketball" element={<Basketball />} />
        <Route path="/predictions/tennis" element={<Tennis />} />
        <Route path="/ar/bookmakers" element={<BestBettingapp />} />

        {/* Prediction Detail Page */}
        <Route path="/prediction/:matchId" element={<PredictionDetail />} />

        {/* League Detail Page */}
        <Route path="/league/:leagueId" element={<LeagueDetail />} />

        {/* Match Detail Page */}
        <Route path="/match/:matchId" element={<MatchDetail />} />

        <Route path="/league/:leagueId/old" element={<PopularLeagues />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

      </Routes>

      <Footer />
    </BrowserRouter>
  )
}

export default App
