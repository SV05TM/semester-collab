import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import People from './pages/People';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';
import OnboardingTutorial from './components/OnboardingTutorial';
import socket, { connectSocket, disconnectSocket } from './socket';
import useTheme from './useTheme';

function App() {
  const { theme, toggle: toggleTheme } = useTheme();
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50 text-slate-500 dark:bg-slate-950 dark:text-slate-300">
        Loading...
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingTutorial onComplete={handleOnboardingComplete} />}

      {globalToast && (
        <div className="fixed top-4 right-4 z-[200] animate-slide-in">
          <div className="flex max-w-sm items-center gap-3 rounded-lg bg-teal-700 px-4 py-3 text-white shadow-lg">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
              </svg>
            </span>
            <p className="flex-1 text-sm">{globalToast}</p>
            <button onClick={() => setGlobalToast(null)} className="text-white/70 hover:text-white" aria-label="Dismiss notification">x</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} />
        <Route path="/" element={user ? <Dashboard user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />} />
        <Route path="/event/:id" element={user ? <EventDetail user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />} />
        <Route path="/people" element={user ? <People user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />} />
        <Route path="/bookmarks" element={user ? <Bookmarks user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile user={user} onLogout={handleLogout} onUserUpdate={(u) => setUser(u)} /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;
