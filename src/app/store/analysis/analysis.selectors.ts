import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnalysisState } from '../app.state';

// Feature selector
export const selectAnalysisState = createFeatureSelector<AnalysisState>('analysis');

// Basic selectors
export const selectCurrentText = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.currentText
);

export const selectAnalysisResults = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.results
);

export const selectIsAnalyzing = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.isLoading
);

export const selectAnalysisError = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.error
);

export const selectAnalysisHistory = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.history
);

export const selectAnalysisCache = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.cache
);

// Performance selectors
export const selectPerformanceStats = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.performance
);

export const selectLastAnalysisTime = createSelector(
  selectPerformanceStats,
  (performance) => performance.lastAnalysisTime
);

export const selectAverageProcessingTime = createSelector(
  selectPerformanceStats,
  (performance) => performance.averageProcessingTime
);

export const selectTotalAnalyses = createSelector(
  selectPerformanceStats,
  (performance) => performance.totalAnalyses
);

// Computed selectors
export const selectHasResults = createSelector(
  selectAnalysisResults,
  (results) => results && results.length > 0
);

export const selectResultsCount = createSelector(
  selectAnalysisResults,
  (results) => results ? results.length : 0
);

export const selectHasError = createSelector(
  selectAnalysisError,
  (error) => error !== null
);

// History selectors
export const selectRecentHistory = createSelector(
  selectAnalysisHistory,
  (history) => history.slice(0, 10)
);

export const selectHistoryCount = createSelector(
  selectAnalysisHistory,
  (history) => history.length
);

export const selectHistoryByDate = createSelector(
  selectAnalysisHistory,
  (history) => {
    const grouped = new Map<string, any[]>();
    
    history.forEach(item => {
      const date = new Date(item.timestamp).toDateString();
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(item);
    });
    
    return Array.from(grouped.entries()).map(([date, items]) => ({
      date,
      items: items.sort((a, b) => b.timestamp - a.timestamp)
    }));
  }
);

// Cache selectors
export const selectCacheKeys = createSelector(
  selectAnalysisCache,
  (cache) => Object.keys(cache)
);

export const selectCacheSize = createSelector(
  selectAnalysisCache,
  (cache) => Object.keys(cache).length
);

export const selectValidCacheEntries = createSelector(
  selectAnalysisCache,
  (cache) => {
    const now = Date.now();
    return Object.entries(cache).filter(([key, value]) => 
      !value.expiresAt || value.expiresAt > now
    ).length;
  }
);

// Analysis quality selectors
export const selectAnalysisQuality = createSelector(
  selectAnalysisResults,
  (results) => {
    if (!results || results.length === 0) return null;
    
    const totalLines = results.length;
    const identifiedLines = results.filter(result => 
      result.verseType && result.verseType !== 'Unknown'
    ).length;
    
    const confidence = (identifiedLines / totalLines) * 100;
    
    return {
      totalLines,
      identifiedLines,
      confidence: Math.round(confidence),
      qualityRating: confidence >= 90 ? 'excellent' : 
                    confidence >= 70 ? 'good' : 
                    confidence >= 50 ? 'fair' : 'poor'
    };
  }
);

// Verse type distribution
export const selectVerseTypeDistribution = createSelector(
  selectAnalysisResults,
  (results) => {
    if (!results || results.length === 0) return {};
    
    const distribution = new Map<string, number>();
    
    results.forEach(result => {
      const type = result.verseType || 'Unknown';
      distribution.set(type, (distribution.get(type) || 0) + 1);
    });
    
    return Object.fromEntries(distribution);
  }
);

// Rhyme scheme analysis
export const selectRhymeSchemeAnalysis = createSelector(
  selectAnalysisResults,
  (results) => {
    if (!results || results.length === 0) return null;
    
    const rhymeSchemes = results.map(result => result.rhymeScheme).filter(scheme => scheme);
    const uniqueSchemes = new Set(rhymeSchemes);
    
    return {
      totalLines: results.length,
      rhymingLines: rhymeSchemes.length,
      uniqueRhymes: uniqueSchemes.size,
      rhymeComplexity: rhymeSchemes.length > 0 ? uniqueSchemes.size / rhymeSchemes.length : 0,
      pattern: rhymeSchemes.join('')
    };
  }
);

// Performance insights
export const selectPerformanceInsights = createSelector(
  selectPerformanceStats,
  (performance) => {
    if (performance.totalAnalyses === 0) return null;
    
    const avgTime = performance.averageProcessingTime;
    const lastTime = performance.lastAnalysisTime;
    
    return {
      total: performance.totalAnalyses,
      averageTime: Math.round(avgTime),
      lastTime: Math.round(lastTime),
      performance: avgTime < 100 ? 'excellent' :
                   avgTime < 500 ? 'good' :
                   avgTime < 1000 ? 'fair' : 'poor',
      trend: lastTime < avgTime ? 'improving' :
             lastTime > avgTime * 1.2 ? 'declining' : 'stable'
    };
  }
);

// Combined analysis overview
export const selectAnalysisOverview = createSelector(
  selectCurrentText,
  selectAnalysisResults,
  selectIsAnalyzing,
  selectAnalysisError,
  selectAnalysisQuality,
  selectPerformanceInsights,
  (text, results, isLoading, error, quality, performance) => ({
    hasText: text.length > 0,
    textLength: text.length,
    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
    results,
    resultCount: results.length,
    isLoading,
    error,
    quality,
    performance,
    status: isLoading ? 'analyzing' :
            error ? 'error' :
            results.length > 0 ? 'completed' : 'idle'
  })
);
