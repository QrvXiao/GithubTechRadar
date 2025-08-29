export interface Repository {
  name: string;
  fullName: string;
  url: string;
  description?: string;
  stars: number;
  forks: number;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description?: string;
  stargazers_count: number;
  forks_count: number;
  language?: string;
  created_at: string;
  updated_at: string;
}

export interface PlotlyData {
  type: 'scatterpolar';
  mode: 'markers';
  r: number[];
  theta: string[];
  text: string[];
  customdata: string[];
  hoverinfo: 'text';
  marker: { size: number };
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}