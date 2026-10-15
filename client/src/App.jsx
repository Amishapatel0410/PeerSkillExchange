import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';

// Pages
import LandingPage       from './pages/LandingPage';
import LoginPage         from './pages/auth/LoginPage';
import RegisterPage      from './pages/auth/RegisterPage';
import DiscoverPage      from './pages/matches/DiscoverPage';
import MatchesPage       from './pages/matches/MatchesPage';
import SessionsDashboard from './pages/sessions/SessionsDashboard';
import RequestSessionPage from './pages/sessions/RequestSessionPage';
import SessionDetailPage from './pages/sessions/SessionDetailPage';
import ChatPage          from './pages/chat/ChatPage';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
          <Route path="/matches"  element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />

          {/* Sessions — Module 3 */}
          <Route path="/sessions"         element={<ProtectedRoute><SessionsDashboard /></ProtectedRoute>} />
          <Route path="/sessions/new"     element={<ProtectedRoute><RequestSessionPage /></ProtectedRoute>} />
          <Route path="/sessions/:id"     element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} />

          {/* Chat — Module 3 */}
          <Route path="/chat/:matchId"    element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
