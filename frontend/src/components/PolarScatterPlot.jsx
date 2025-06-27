import React, { useRef } from 'react';
import Plot from 'react-plotly.js';

const PolarScatterPlot = ({ data }) => {
  const ignoreNextClick = useRef(false);

  const handleDoubleClick = () => {
    ignoreNextClick.current = true;
    // Reset the flag after a short delay
    setTimeout(() => {
      ignoreNextClick.current = false;
    }, 300);
  };

  const handleClick = (event) => {
    if (ignoreNextClick.current) {
      // Ignore this click, it's from a double-click zoom reset
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

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
      <Plot
        data={data}
        layout={{
          width: 750,
          height: 800,
        }}
        config={{
          scrollZoom: true,
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
};

export default PolarScatterPlot;