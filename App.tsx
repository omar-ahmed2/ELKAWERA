
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { CreatePlayer } from './pages/CreatePlayer';
import { PostMatchStats } from './pages/PostMatchStats';
import { Dashboard } from './pages/Dashboard';
import { Teams } from './pages/Teams';
import { Leaderboard } from './pages/Leaderboard';
import { Compare } from './pages/Compare';
import { Matches } from './pages/Matches';

import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { NewPlayers } from './pages/NewPlayers';
import { RequestCard } from './pages/RequestCard';
import { AdminMatches } from './pages/AdminMatches';
import { MatchDetails } from './pages/MatchDetails';
import { EndMatch } from './pages/EndMatch';

import { Kits } from './pages/Kits';
import { AdminKits } from './pages/AdminKits';
import { AdminKitRequests } from './pages/AdminKitRequests';
import { PlayerEvaluationPage } from './pages/PlayerEvaluationPage';
import { CaptainDashboard } from './pages/CaptainDashboard';
import { ExternalMatchScheduler } from './pages/ExternalMatchScheduler';
import { Notifications } from './pages/Notifications';
import { Events } from './pages/Events';
import { EventManagement } from './pages/EventManagement';
import { Settings } from './pages/Settings';
import { CaptainSignUp } from './pages/CaptainSignUp';
import { PlayerPublicProfile } from './pages/PlayerPublicProfile';

import { ScoutSignUp } from './pages/ScoutSignUp';
import { ScoutDashboard } from './pages/ScoutDashboard';
import { AdminScoutControl } from './pages/AdminScoutControl';
import { AdminTeamRankings } from './pages/AdminTeamRankings';
import { UserDatabase as UserDatabaseComponent } from './pages/UserDatabase';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/Toast';

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signup/captain" element={<CaptainSignUp />} />
              <Route path="/signup/scout" element={<ScoutSignUp />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/create" element={<CreatePlayer />} />
                <Route path="/stats" element={<PostMatchStats />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/leaderboard" element={<Leaderboard />} /> {/* Added Route */}
                <Route path="/teams" element={<Teams />} />


                <Route path="/compare" element={<Compare />} />
                <Route path="/player/:playerId" element={<PlayerPublicProfile />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:eventId/manage" element={<EventManagement />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/new-players" element={<NewPlayers />} />
                <Route path="/request-card" element={<RequestCard />} />

                {/* Admin Match Management Routes */}
                <Route path="/admin/matches" element={<AdminMatches />} />
                <Route path="/admin/match-details/:matchId" element={<MatchDetails />} />
                <Route path="/admin/end-match/:matchId" element={<EndMatch />} />
                <Route path="/admin/evaluation/:matchId" element={<PlayerEvaluationPage />} />

                {/* Captain Routes */}
                <Route path="/captain/dashboard" element={<CaptainDashboard />} />
                <Route path="/captain/schedule-match" element={<ExternalMatchScheduler />} />

                {/* Scout Routes */}
                <Route path="/scout/dashboard" element={<ScoutDashboard />} />

                {/* Admin Scout Control */}
                <Route path="/admin/scouts" element={<AdminScoutControl />} />
                <Route path="/admin/rankings" element={<AdminTeamRankings />} />
                <Route path="/admin/users" element={<UserDatabaseComponent />} />

                {/* Kit System */}
                <Route path="/kits" element={<Kits />} />
                <Route path="/admin/kits" element={<AdminKits />} />
                <Route path="/admin/kit-requests" element={<AdminKitRequests />} />
              </Route>
            </Routes>
          </Layout>
          <ToastContainer />
        </HashRouter>
      </AuthProvider>
    </SettingsProvider>
  );
};

export default App;
