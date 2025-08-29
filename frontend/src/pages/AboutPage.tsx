import React from 'react';

function AboutPage() {
  return (
    <div className="about-page">
      <h2>About Tech Radar</h2>
      <p>
        This project visualizes trending technologies from GitHub using a polar scatter plot.
        Built with React, Redux Toolkit, and Recharts.
      </p>
      <h3>Features</h3>
      <ul>
        <li>Real-time GitHub API integration</li>
        <li>Interactive data visualization</li>
        <li>Language filtering system</li>
        <li>Responsive design</li>
      </ul>
    </div>
  );
}

export default AboutPage;