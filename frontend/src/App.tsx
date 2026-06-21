import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import Home from '@/pages/public/Home';
import Scoreboard from '@/pages/public/Scoreboard';
import MatchDetail from '@/pages/public/MatchDetail';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import Tournaments from '@/pages/tournaments/Tournaments';
import TournamentDetail from '@/pages/tournaments/TournamentDetail';
import Teams from '@/pages/teams/Teams';
import Players from '@/pages/players/Players';
import Matches from '@/pages/matches/Matches';
import LiveList from '@/pages/live/LiveList';
import LiveScoring from '@/pages/live/LiveScoring';
import Stats from '@/pages/stats/Stats';
import Reports from '@/pages/reports/Reports';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<Home />} />
      <Route path="/scoreboard" element={<Scoreboard />} />
      <Route path="/match/:id" element={<MatchDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* admin (protected) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="tournaments/:id" element={<TournamentDetail />} />
          <Route path="teams" element={<Teams />} />
          <Route path="players" element={<Players />} />
          <Route path="matches" element={<Matches />} />
          <Route path="stats" element={<Stats />} />
          <Route path="reports" element={<Reports />} />
          {/* scoring — requires match official or admin */}
          <Route element={<ProtectedRoute requireScorer />}>
            <Route path="live" element={<LiveList />} />
            <Route path="live/:id" element={<LiveScoring />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
