import React, { useRef, useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { PolarScatterPlotProps } from '../types';

const PolarScatterPlot: React.FC<PolarScatterPlotProps> = ({ data }) => {
  const ignoreNextClick = useRef<boolean>(false);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      const isMobile = window.innerWidth <= 768;
      const width = isMobile ? window.innerWidth - 32 : Math.min(window.innerWidth * 0.8, 800);
      const height = isMobile ? Math.min(window.innerHeight * 0.5, 400) : Math.min(window.innerHeight * 0.7, 600);
      
      setPlotSize({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleDoubleClick = (): void => {
    ignoreNextClick.current = true;
    setTimeout(() => {
      ignoreNextClick.current = false;
    }, 300);
  };

  const handleClick = (event: any): void => {
    if (ignoreNextClick.current) {
      return;
    }
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const url = point.customdata;
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      <Plot
        data={data}
        layout={{
          width: plotSize.width,
          height: plotSize.height,
          margin: isMobile 
            ? { t: 20, l: 20, r: 20, b: 20 }
            : { t: 40, l: 40, r: 40, b: 40 },
          font: {
            size: isMobile ? 10 : 12
          },
          polar: {
            radialaxis: {
              tickfont: { size: isMobile ? 8 : 10 }
            },
            angularaxis: {
              tickfont: { size: isMobile ? 8 : 10 }
            }
          }
        }}
        config={{
          scrollZoom: !isMobile,
          doubleClick: 'reset',
          displayModeBar: !isMobile,
          responsive: true
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default PolarScatterPlot;