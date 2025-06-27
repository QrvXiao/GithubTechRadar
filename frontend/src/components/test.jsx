import Plot from 'react-plotly.js';

export default function PolarZoomTest() {
  return (
    <Plot
      data={[
        {
          type: 'scatterpolar',
          r: [1, 2, 3, 4, 5],
          theta: [0, 45, 90, 135, 180],
          mode: 'markers',
        },
      ]}
      layout={{
        width: 500,
        height: 500,
        polar: {
          radialaxis: {
            visible: true,
            // fixedrange: false, // This is default, so zooming is allowed
          },
        },
      }}
      config={{ scrollZoom: true }}
    />
  );
}