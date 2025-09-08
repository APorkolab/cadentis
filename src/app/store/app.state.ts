import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';

// Feature state interfaces
export interface AnalysisState {
  currentText: string;
  results: any[];
  isLoading: boolean;
  error: string | null;
  history: any[];
  cache: { [key: string]: any };
  performance: {
    lastAnalysisTime: number;
    averageProcessingTime: number;
    totalAnalyses: number;
  };
}

export interface UiState {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  sidebarCollapsed: boolean;
  notifications: any[];
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

export interface UserPreferencesState {
  analysisSettings: {
    autoSave: boolean;
    showAdvancedMetrics: boolean;
    enableWebWorker: boolean;
    maxHistoryItems: number;
  };
  displaySettings: {
    showRhymeScheme: boolean;
    showStressPattern: boolean;
    highlightSubstitutions: boolean;
    colorScheme: string;
  };
}

// Root state interface
export interface AppState {
  analysis: AnalysisState;
  ui: UiState;
  userPreferences: UserPreferencesState;
}

// Initial states
export const initialAnalysisState: AnalysisState = {
  currentText: '',
  results: [],
  isLoading: false,
  error: null,
  history: [],
  cache: {},
  performance: {
    lastAnalysisTime: 0,
    averageProcessingTime: 0,
    totalAnalyses: 0
  }
};

export const initialUiState: UiState = {
  theme: 'auto',
  language: 'en',
  sidebarCollapsed: false,
  notifications: [],
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium'
  }
};

export const initialUserPreferencesState: UserPreferencesState = {
  analysisSettings: {
    autoSave: true,
    showAdvancedMetrics: false,
    enableWebWorker: true,
    maxHistoryItems: 50
  },
  displaySettings: {
    showRhymeScheme: true,
    showStressPattern: true,
    highlightSubstitutions: true,
    colorScheme: 'default'
  }
};

// Meta reducers for development
export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? []
  : [];
