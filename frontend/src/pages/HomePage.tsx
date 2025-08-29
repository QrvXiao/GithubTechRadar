import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="home-page">
      <h1>GitHub Tech Radar</h1>
      <p>Visualize trending technologies from GitHub</p>
      <div className="home-actions">
        <Link to="/radar" className="nav-button">View Tech Radar</Link>
        <Link to="/analytics" className="nav-button">Analytics</Link>
        <Link to="/about" className="nav-button">About</Link>
      </div>
    </div>
  );
}

export default HomePage;