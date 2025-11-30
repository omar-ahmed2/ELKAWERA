
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { CreatePlayer } from './pages/CreatePlayer';
import { PostMatchStats } from './pages/PostMatchStats';
import { Dashboard } from './pages/Dashboard';
import { Teams } from './pages/Teams';
import { Compare } from './pages/Compare';
import { MatchSim } from './pages/MatchSim';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { NewPlayers } from './pages/NewPlayers';
import { RequestCard } from './pages/RequestCard';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/create" element={<CreatePlayer />} />
              <Route path="/stats" element={<PostMatchStats />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/match-sim" element={<MatchSim />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/new-players" element={<NewPlayers />} />
              <Route path="/request-card" element={<RequestCard />} />
            </Route>
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
