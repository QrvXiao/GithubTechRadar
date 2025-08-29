import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/">Tech Radar</Link>
      </div>
      <div className="nav-links">
        <Link 
          to="/" 
          className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
        >
          Home
        </Link>
        <Link 
          to="/radar" 
          className={location.pathname === '/radar' ? 'nav-link active' : 'nav-link'}
        >
          Radar
        </Link>
        <Link 
          to="/analytics" 
          className={location.pathname === '/analytics' ? 'nav-link active' : 'nav-link'}
        >
          Analytics
        </Link>
        <Link 
          to="/about" 
          className={location.pathname === '/about' ? 'nav-link active' : 'nav-link'}
        >
          About
        </Link>
      </div>
    </nav>
  );
}

export default Navigation;