import React, { useState } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation,
} from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Avatar from './components/ui/Avatar';
import { FiHome, FiMessageCircle, FiUsers, FiLogOut } from 'react-icons/fi';

export const AuthContext = React.createContext(null);

export default function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  const login  = u  => { localStorage.setItem('user', JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.removeItem('user'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        {user && <Navbar user={user} logout={logout} />}
        <div className="bg-gray-50 min-h-screen">
          <Routes>
            <Route path="/login"        element={!user ? <Login />    : <Navigate to="/" replace />} />
            <Route path="/register"     element={!user ? <Register /> : <Navigate to="/" replace />} />
            <Route path="/"             element={user  ? <Feed />     : <Navigate to="/login" replace />} />
            {/* Profile page still lives for direct URL sharing / deep links */}
            <Route path="/profile/:id"  element={user  ? <Profile />  : <Navigate to="/login" replace />} />
            <Route path="*"             element={<Navigate to={user ? '/' : '/login'} replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function Navbar({ user, logout }) {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const navIconBtn = (onClick, Icon, label, active = false) => (
    <button
      onClick={onClick}
      title={label}
      className={`
        w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150
        ${active
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }
      `}
    >
      <Icon size={18} />
    </button>
  );

  const isHome = pathname === '/';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 h-14">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-black text-gray-900 tracking-tight flex-shrink-0">
          Nexus
        </Link>

        {/* Center nav icons */}
        <div className="flex items-center gap-1">
          {navIconBtn(() => navigate('/'),              FiHome,          'Feed',       isHome)}
          {navIconBtn(() => navigate('/?chat=open'),    FiMessageCircle, 'Messages'        )}
          {navIconBtn(() => navigate('/?people=open'),  FiUsers,         'Find People'     )}
        </div>

        {/* Right: avatar + username → opens own profile sidebar, logout */}
        <div className="flex items-center gap-2">
          {/* FIX: use ?profile= param so Feed opens sidebar instead of navigating to /profile page */}
          <button
            onClick={() => navigate(`/?profile=${user.id}`)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition"
            title="My profile"
          >
            <Avatar user={user} size={28} />
            <span className="text-sm font-medium text-gray-800 hidden sm:block">
              {user.username}
            </span>
          </button>

          <button
            onClick={logout}
            title="Logout"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}