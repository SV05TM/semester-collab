import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import People from './pages/People';
import OnboardingTutorial from './components/OnboardingTutorial';
import socket, { connectSocket, disconnectSocket } from './socket';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalToast, setGlobalToast] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      connectSocket();
    }
    setLoading(false);
  }, []);

  // Global notification listener — shows toast on any page
  useEffect(() => {
    if (!user) return;

    const handleNotification = (data) => {
      setGlobalToast(data.message);
      setTimeout(() => setGlobalToast(null), 5000);
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [user]);

  const handleLogin = (userData, token, isNewUser = false) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
    connectSocket();

    // Show onboarding for new users or if they haven't seen it
    if (isNewUser || !localStorage.getItem('onboarding_done')) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_done', 'true');
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    disconnectSocket();
    setUser(null);
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <>
      {/* Onboarding tutorial */}
      {showOnboarding && <OnboardingTutorial onComplete={handleOnboardingComplete} />}

      {/* Global toast notification */}
      {globalToast && (
        <div className="fixed top-4 right-4 z-[200] animate-slide-in">
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg max-w-sm flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <p className="text-sm flex-1">{globalToast}</p>
            <button onClick={() => setGlobalToast(null)} className="text-white/70 hover:text-white">✕</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} />
        <Route path="/" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/event/:id" element={user ? <EventDetail user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/people" element={user ? <People user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;
