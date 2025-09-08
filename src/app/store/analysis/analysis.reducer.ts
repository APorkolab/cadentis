import { createReducer, on } from '@ngrx/store';
import { AnalysisActions } from './analysis.actions';
import { AnalysisState, initialAnalysisState } from '../app.state';
import { VerseLine } from '../../models/verse-line.model';

export const analysisReducer = createReducer(
  initialAnalysisState,

  // Text analysis
  on(AnalysisActions.startAnalysis, (state, { text, options }) => ({
    ...state,
    currentText: text,
    isLoading: true,
    error: null
  })),

  on(AnalysisActions.analysisSuccess, (state, { results, processingTime }) => {
    const newPerformance = {
      lastAnalysisTime: processingTime,
      totalAnalyses: state.performance.totalAnalyses + 1,
      averageProcessingTime: calculateNewAverage(
        state.performance.averageProcessingTime,
        state.performance.totalAnalyses,
        processingTime
      )
    };

    return {
      ...state,
      results,
      isLoading: false,
      error: null,
      performance: newPerformance
    };
  }),

  on(AnalysisActions.analysisFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
    results: []
  })),

  on(AnalysisActions.clearAnalysis, (state) => ({
    ...state,
    results: [],
    error: null,
    isLoading: false
  })),

  // Text input management
  on(AnalysisActions.updateText, (state, { text }) => ({
    ...state,
    currentText: text,
    error: null
  })),

  on(AnalysisActions.clearText, (state) => ({
    ...state,
    currentText: '',
    results: [],
    error: null
  })),

  // History management
  on(AnalysisActions.addToHistory, (state, { analysis }) => {
    const newHistory = [analysis, ...state.history].slice(0, 50); // Keep only last 50
    return {
      ...state,
      history: newHistory
    };
  }),

  on(AnalysisActions.removeFromHistory, (state, { index }) => ({
    ...state,
    history: state.history.filter((_, i) => i !== index)
  })),

  on(AnalysisActions.clearHistory, (state) => ({
    ...state,
    history: []
  })),

  on(AnalysisActions.loadFromHistory, (state, { index }) => {
    const historyItem = state.history[index];
    if (!historyItem) return state;

    return {
      ...state,
      currentText: historyItem.text,
      results: historyItem.results
    };
  }),

  // Cache management
  on(AnalysisActions.cacheResult, (state, { key, data, ttl }) => {
    const expiresAt = ttl ? Date.now() + ttl : null;
    return {
      ...state,
      cache: {
        ...state.cache,
        [key]: {
          data,
          timestamp: Date.now(),
          expiresAt
        }
      }
    };
  }),

  on(AnalysisActions.invalidateCache, (state, { key }) => {
    if (key) {
      const { [key]: removed, ...remainingCache } = state.cache;
      return {
        ...state,
        cache: remainingCache
      };
    }
    return state;
  }),

  on(AnalysisActions.clearCache, (state) => ({
    ...state,
    cache: {}
  })),

  // Performance tracking
  on(AnalysisActions.updatePerformanceStats, (state, { processingTime }) => ({
    ...state,
    performance: {
      ...state.performance,
      lastAnalysisTime: processingTime,
      totalAnalyses: state.performance.totalAnalyses + 1,
      averageProcessingTime: calculateNewAverage(
        state.performance.averageProcessingTime,
        state.performance.totalAnalyses,
        processingTime
      )
    }
  })),

  on(AnalysisActions.resetPerformanceStats, (state) => ({
    ...state,
    performance: {
      lastAnalysisTime: 0,
      averageProcessingTime: 0,
      totalAnalyses: 0
    }
  })),

  // Real-time analysis results
  on(AnalysisActions.realTimeAnalysisResult, (state, { results }) => ({
    ...state,
    results,
    error: null
  }))
);

// Helper function to calculate running average
function calculateNewAverage(currentAvg: number, count: number, newValue: number): number {
  if (count === 0) return newValue;
  return ((currentAvg * count) + newValue) / (count + 1);
}

// Cache cleanup helper
export function cleanExpiredCache(cache: { [key: string]: any }): { [key: string]: any } {
  const now = Date.now();
  const cleanCache: { [key: string]: any } = {};
  
  for (const [key, value] of Object.entries(cache)) {
    if (!value.expiresAt || value.expiresAt > now) {
      cleanCache[key] = value;
    }
  }
  
  return cleanCache;
}
