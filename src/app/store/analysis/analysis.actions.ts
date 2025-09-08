import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { VerseLine } from '../../models/verse-line.model';

export const AnalysisActions = createActionGroup({
  source: 'Analysis',
  events: {
    // Text analysis actions
    'Start Analysis': props<{ text: string; options?: any }>(),
    'Analysis Success': props<{ results: VerseLine[]; processingTime: number }>(),
    'Analysis Failure': props<{ error: string }>(),
    'Clear Analysis': emptyProps(),
    
    // Text input actions
    'Update Text': props<{ text: string }>(),
    'Clear Text': emptyProps(),
    
    // History management
    'Add To History': props<{ analysis: { text: string; results: VerseLine[]; timestamp: number } }>(),
    'Remove From History': props<{ index: number }>(),
    'Clear History': emptyProps(),
    'Load From History': props<{ index: number }>(),
    
    // Cache management
    'Cache Result': props<{ key: string; data: any; ttl?: number }>(),
    'Invalidate Cache': props<{ key?: string }>(),
    'Clear Cache': emptyProps(),
    
    // Performance tracking
    'Update Performance Stats': props<{ processingTime: number; textLength: number }>(),
    'Reset Performance Stats': emptyProps(),
    
    // Advanced features
    'Export Analysis': props<{ format: 'json' | 'csv' | 'xml' }>(),
    'Import Analysis': props<{ data: string; format: 'json' | 'csv' | 'xml' }>(),
    'Share Analysis': props<{ method: 'link' | 'email' | 'social' }>(),
    
    // Real-time analysis
    'Enable Real Time Analysis': emptyProps(),
    'Disable Real Time Analysis': emptyProps(),
    'Real Time Analysis Result': props<{ results: VerseLine[] }>(),
    
    // Batch processing
    'Start Batch Analysis': props<{ texts: string[]; options?: any }>(),
    'Batch Analysis Progress': props<{ completed: number; total: number; currentResult?: VerseLine[] }>(),
    'Batch Analysis Complete': props<{ results: VerseLine[][] }>(),
    'Batch Analysis Error': props<{ error: string; failedIndex: number }>(),
  }
});

// Selectors helper actions
export const AnalysisSelectors = createActionGroup({
  source: 'Analysis Selectors',
  events: {
    'Request Current Analysis': emptyProps(),
    'Request Analysis History': emptyProps(),
    'Request Performance Metrics': emptyProps(),
    'Request Cache Status': emptyProps(),
  }
});
