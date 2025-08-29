import React from 'react';

function AnalyticsPage() {
  return (
    <div className="analytics-page">
      <h2>Technology Analytics</h2>
      <div className="analytics-grid">
        <div className="metric-card">
          <h3>Most Popular Languages</h3>
          <p>JavaScript, Python, Java</p>
        </div>
        <div className="metric-card">
          <h3>Fastest Growing</h3>
          <p>Rust, Go, TypeScript</p>
        </div>
        <div className="metric-card">
          <h3>Total Repositories</h3>
          <p>1.2M+ analyzed</p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;