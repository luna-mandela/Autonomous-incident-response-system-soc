import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Scanner from './pages/Scanner';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './api/axiosConfig';

// A wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppContent() {
  const { user, logoutState } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    } finally {
      logoutState();
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-brand-navy text-[#e6f1ff] flex flex-col font-sans">
      {/* Navigation Bar - Matching the Provided Image */}
      <nav className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold tracking-wider cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
            <span>AIRS</span>
            <span className="text-brand-cyber-green text-sm font-normal">Secure Portal</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-brand-cyber-green transition">Home</Link>
            {user && (
              <>
                <Link to="/dashboard" className="hover:text-brand-cyber-green transition">Dashboard</Link>
                <Link to="/scanner" className="hover:text-brand-cyber-green transition">Scanner</Link>
                <Link to="/chat" className="hover:text-brand-cyber-green transition">Support Chat</Link>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded text-sm transition font-bold">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-brand-cyber-green transition text-sm font-bold">Login</Link>
              <Link to="/register" className="bg-brand-cyber-green text-brand-navy px-4 py-1.5 rounded text-sm font-bold transition">Sign Up</Link>
            </div>
          )}
          
          {/* Mobile Toggle */}
          <button onClick={toggleMenu} className="md:hidden p-1 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-slate-900 border-b border-slate-800 z-50 flex flex-col p-6 gap-4 font-bold">
            <Link to="/" onClick={closeMenu}>Home</Link>
            {user && (
              <>
                <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
                <Link to="/scanner" onClick={closeMenu}>Scanner</Link>
                <Link to="/chat" onClick={closeMenu}>Support Chat</Link>
              </>
            )}
          </div>
        )}
      </nav>
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col relative pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        </Routes>
        
        {/* Persistent Report Button (Red as per Image) */}
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={() => navigate('/scanner')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center gap-3 border-4 border-red-900/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="uppercase tracking-widest text-sm">REPORT</span>
          </button>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
