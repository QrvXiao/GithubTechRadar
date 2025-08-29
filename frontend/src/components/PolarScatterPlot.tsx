import React, { useRef } from 'react';
import Plot from 'react-plotly.js';
import { PolarScatterPlotProps } from '../types';

const PolarScatterPlot: React.FC<PolarScatterPlotProps> = ({ data }) => {
  const ignoreNextClick = useRef<boolean>(false);

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

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
      <Plot
        data={data}
        layout={{
          autosize: true,
          margin: { t: 40, l: 40, r: 40, b: 40 },
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
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