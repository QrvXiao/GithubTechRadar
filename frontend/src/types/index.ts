export interface FrontendPlotlyData {
  type: 'scatterpolar';
  mode: 'markers';
  r: number[];
  theta: string[]; 
  text: string[];
  customdata: string[];
  hoverinfo: 'text';
  marker: { 
    size: number;
    color?: string[] | number[]; 
  };
  name: string;
}

// Redux
export interface LanguageState {
  allLanguages: string[];
  selectedLanguages: string[];
}

// Props
export interface LanguageFilterProps {
  languages: string[];
  selected: string[];
  onChange: (lang: string) => void;
  onCheckAll: () => void;
  onUncheckAll: () => void;
}

export interface PolarScatterPlotProps {
  data: FrontendPlotlyData[];
}

// API
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}