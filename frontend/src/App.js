import React, { useEffect, useState } from 'react';
import PolarScatterPlot from './components/PolarScatterPlot';
import './App.css';

function LanguageFilter({ languages, selected, onChange, onCheckAll, onUncheckAll }) {
  return (
    <div className="language-filter">
      <div className="language-filter-tip">
        Filter
      </div>
      <div className="language-filter-actions">
        <button onClick={onCheckAll} className="language-filter-action-btn">Select All</button>
        <button onClick={onUncheckAll} className="language-filter-action-btn">Deselect All</button>
      </div>
      <div className="language-filter-list">
        {languages.map(lang => (
          <label key={lang}>
            <input
              type="checkbox"
              checked={selected.includes(lang)}
              onChange={() => onChange(lang)}
            />
            {lang}
          </label>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="legend">
      <div><b>Legend</b></div>
      <div>• <b>Radius</b>: Stars</div>
      <div>• <b>Angle</b>: Language</div>
    </div>
  );
}

function App() {
  const [radarData, setRadarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/trending');
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();
        setRadarData(data);

        if (data.length && data[0].theta) {
          const langs = Array.from(new Set(data[0].theta));
          setAllLanguages(langs);
          setSelectedLanguages(langs);
        }
        setFetchError(false);
      } catch (error) {
        setRadarData([]);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = React.useMemo(() => {
    if (!radarData.length || !radarData[0].theta) return radarData;
    const idxs = radarData[0].theta
      .map((lang, i) => selectedLanguages.includes(lang) ? i : -1)
      .filter(i => i !== -1);
    const trace = { ...radarData[0] };
    ['r', 'theta', 'text', 'customdata', 'marker'].forEach(key => {
      if (trace[key] && Array.isArray(trace[key])) {
        trace[key] = idxs.map(i => trace[key][i]);
      }
    });
    if (trace.marker && trace.marker.color && Array.isArray(trace.marker.color)) {
      trace.marker = { ...trace.marker, color: idxs.map(i => trace.marker.color[i]) };
    }
    return [trace];
  }, [radarData, selectedLanguages]);

  const handleLanguageChange = (lang) => {
    setSelectedLanguages(selected =>
      selected.includes(lang)
        ? selected.filter(l => l !== lang)
        : [...selected, lang]
    );
  };

  const handleCheckAll = () => setSelectedLanguages(allLanguages);
  const handleUncheckAll = () => setSelectedLanguages([]);

  return (
    <div className="app-background">
      <LanguageFilter
        languages={allLanguages}
        selected={selectedLanguages}
        onChange={handleLanguageChange}
        onCheckAll={handleCheckAll}
        onUncheckAll={handleUncheckAll}
      />
      <Legend />
      <div className="title">
        GitHub Tech Radar
      </div>
      <div className="plot-container">
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : fetchError ? (
          <div className="error-text">
            Failed to fetch data from GitHub API or no data available.
          </div>
        ) : selectedLanguages.length === 0 ? (
          <div className="error-text">
            Select at least 1 language to display data.
          </div>
        ) : (filteredData.length && filteredData[0].r && filteredData[0].r.length === 0) ? (
          <div className="error-text">
            No data to display.
          </div>
        ) : (
          <PolarScatterPlot data={filteredData} />
        )}
      </div>
    </div>
  );
}

export default App;