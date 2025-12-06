import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import PolarScatterPlot from '../components/PolarScatterPlot';
import LanguageFilter from '../components/LanguageFilter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import './RadarPage.css';
import { usePersistedCache } from '../hooks/useCache';
import {
  setAllLanguages,
  checkAll,
  uncheckAll,
  toggleLanguage,
} from '../store';

function RadarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { allLanguages, selectedLanguages, isInitialized } = useSelector((state: RootState) => state.language);
  
  // use ref to track if languages have been initialized
  const languagesInitialized = useRef(false);

  const fetcher = useCallback(async () => {
    const res = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/trending');
    if (!res.ok) throw new Error('API fetch failed');
    return res.json();
  }, []);

  const { 
    data: radarData, 
    loading, 
    error: fetchError,
    fromCache
  } = usePersistedCache('radar-trending-data', fetcher, 2 * 60 * 1000);

  // only get languages from data once
  useEffect(() => {
    if (radarData && 
        radarData.length && 
        radarData[0].theta && 
        !languagesInitialized.current) {
      
      const langs = Array.from(new Set(radarData[0].theta)) as string[];
      dispatch(setAllLanguages(langs));
      languagesInitialized.current = true;
      
      console.log('🎯 Languages initialized:', langs);
    }
  }, [radarData, dispatch]);

  const handleLanguageChange = useCallback((lang: string) => {
    dispatch(toggleLanguage(lang));
  }, [dispatch]);

  const handleCheckAll = useCallback(() => {
    dispatch(checkAll());
  }, [dispatch]);

  const handleUncheckAll = useCallback(() => {
    dispatch(uncheckAll());
  }, [dispatch]);

  const filteredData = useMemo(() => {
    console.log('🔄 Computing filteredData...', {
      hasRadarData: !!radarData,
      radarDataLength: radarData?.length,
      selectedLanguagesLength: selectedLanguages.length,
      isInitialized
    });

    if (!radarData || !radarData.length || !radarData[0] || !radarData[0].theta) {
      console.log('⚠️ No radar data available');
      return [];
    }
    
    if (selectedLanguages.length === 0) {
      console.log('⚠️ No languages selected');
      return [];
    }
    
    const idxs = radarData[0].theta
      .map((lang: string, i: number) => selectedLanguages.includes(lang) ? i : -1)
      .filter((i: number) => i !== -1);
    
    if (idxs.length === 0) {
      console.log('⚠️ No matching languages found');
      return [];
    }
    
    const trace = { ...radarData[0] };
    
    (['r', 'theta', 'text', 'customdata'] as const).forEach(key => {
      if (trace[key] && Array.isArray(trace[key])) {
        (trace as any)[key] = idxs.map((i: number) => (trace as any)[key][i]);
      }
    });
    
    if (trace.marker?.color && Array.isArray(trace.marker.color)) {
      trace.marker = { 
        ...trace.marker, 
        color: idxs.map((i: number) => (trace.marker.color as any[])[i]) 
      };
    }
    
    console.log('✅ Filtered data computed:', { pointsCount: trace.r?.length });
    return [trace];
  }, [radarData, selectedLanguages, isInitialized]); 
  
  useEffect(() => {
    console.log('📊 RadarPage state:', {
      loading,
      fetchError: !!fetchError,
      hasRadarData: !!radarData,
      fromCache,
      allLanguagesCount: allLanguages.length,
      selectedLanguagesCount: selectedLanguages.length,
      isInitialized,
      languagesInitialized: languagesInitialized.current
    });
  }, [loading, fetchError, radarData, fromCache, allLanguages.length, selectedLanguages.length, isInitialized]);
  
  return (
    <div className="radar-page">
      <div className="radar-header">
        <h1>Tech Radar</h1>
        <p>Trending GitHub Repositories Visualization</p>
        {!loading && (
          <div style={{ marginTop: '8px' }}>
            <small style={{ color: '#64748b' }}>
              📊 Data loaded {fromCache ? 'from cache' : 'from API'}
              {isInitialized && ` • ${selectedLanguages.length}/${allLanguages.length} languages selected`}
            </small>
            <br />
            <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              💡 Data is automatically updated weekly. Last refresh: {fromCache ? 'cached' : 'just now'}
            </small>
          </div>
        )}
      </div>

      <div className="radar-content">
        {!loading && !fetchError && isInitialized && (
          <aside className="radar-sidebar">
            <div className="filter-section">
              <h3>Language Filter</h3>
              <LanguageFilter
                languages={allLanguages}
                selected={selectedLanguages}
                onChange={handleLanguageChange}
                onCheckAll={handleCheckAll}
                onUncheckAll={handleUncheckAll}
              />
            </div>
          </aside>
        )}

        <main className="radar-main">
          {!loading && !fetchError && isInitialized && (
            <div className="chart-legend">
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-marker"></span>
                  <span>Repository Stars</span>
                </div>
                <div className="legend-controls">
                  <span>💡 Click points to visit repository</span>
                  <span>🔍 Drag for zoom range</span>
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
              <button 
                onClick={() => window.location.reload()}
                className="retry-button"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                Retry
              </button>
            </div>
          )}
          
          {!loading && !fetchError && isInitialized && (
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