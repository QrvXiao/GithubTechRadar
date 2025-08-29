declare module 'react-plotly.js' {
  import { Component } from 'react';

  export interface PlotProps {
    data: any[];
    layout?: any;
    config?: any;
    useResizeHandler?: boolean;
    style?: React.CSSProperties;
    className?: string;
    onClick?: (event: any) => void;
    onDoubleClick?: (event: any) => void;
    onHover?: (event: any) => void;
    onUnhover?: (event: any) => void;
    onSelected?: (event: any) => void;
    onDeselect?: (event: any) => void;
    onRelayout?: (event: any) => void;
    onRedraw?: (event: any) => void;
    revision?: number;
    divId?: string;
  }

  export default class Plot extends Component<PlotProps> {}
}