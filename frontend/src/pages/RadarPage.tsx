import React, { useEffect, useState } from 'react';
import PolarScatterPlot from '../components/PolarScatterPlot';
import LanguageFilter from '../components/LanguageFilter';
import Legend from '../components/Legend';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { FrontendPlotlyData } from '../types'; 
import './RadarPage.css';
import {
  setAllLanguages,
  checkAll,
  uncheckAll,
  toggleLanguage,
} from '../store';

function RadarPage() {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { allLanguages, selectedLanguages } = useSelector((state: RootState) => state.language);
  const [radarData, setRadarData] = useState<FrontendPlotlyData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/trending');
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();
        setRadarData(data);

      if (data.length && data[0].theta) {
        const langs = Array.from(new Set(data[0].theta)) as string[]; // ✅ 添加类型断言
        dispatch(setAllLanguages(langs));
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
  }, [dispatch]); 

const handleLanguageChange = (lang: string) => dispatch(toggleLanguage(lang));

  const handleCheckAll = () => dispatch(checkAll());
  const handleUncheckAll = () => dispatch(uncheckAll());

  const filteredData = React.useMemo(() => {
    if (!radarData.length || !radarData[0].theta) return radarData;
    const idxs = radarData[0].theta
      .map((lang, i) => selectedLanguages.includes(lang) ? i : -1)
      .filter(i => i !== -1);
    const trace = { ...radarData[0] };
    
    (['r', 'theta', 'text', 'customdata'] as const).forEach(key => {
      if (trace[key] && Array.isArray(trace[key])) {
        (trace as any)[key] = idxs.map(i => (trace as any)[key][i]);
      }
    });
    if (trace.marker?.color && Array.isArray(trace.marker.color)) {
      trace.marker = { 
        ...trace.marker, 
        color: idxs.map(i => (trace.marker.color as any[])[i]) 
      };
    }
    return [trace];
  }, [radarData, selectedLanguages]);
  
return (
  <div className="radar-page">
    <div className="radar-header">
      <h1>Tech Radar</h1>
      <p>Trending GitHub Repositories Visualization</p>
    </div>

    <div className="radar-content">
      {!loading && !fetchError && (
        <aside className="radar-sidebar">
          <div className="filter-section">
            <h3>Language Filter</h3>
            <LanguageFilter
              languages={allLanguages}
              selected={selectedLanguages}
              onChange={handleLanguageChange}
              onCheckAll={() => dispatch(checkAll())}
              onUncheckAll={() => dispatch(uncheckAll())}
            />
          </div>
        </aside>
      )}

      <main className="radar-main">
        {!loading && !fetchError && (
          <div className="chart-legend">
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-marker"></span>
                <span>Repository Stars</span>
              </div>
              <div className="legend-controls">
                <span>💡 Click points to visit repository</span>
                <span>🔍 drag for zoom range</span>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading trending repositories...</p>
          </div>
        )}
        
        {fetchError && (
          <div className="error-state">
            <p>❌ Failed to load data. Please try again later.</p>
          </div>
        )}
        
        {!loading && !fetchError && (
          <div className="chart-container">
            <PolarScatterPlot data={filteredData} />
          </div>
        )}
      </main>
    </div>
  </div>
);
}

export default RadarPage;